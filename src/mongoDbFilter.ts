import { isType, GraphQLObjectType, isLeafType, GraphQLLeafType } from 'graphql';
import { getTypeFields, getInnerType, isListField, addPrefixToProperties, GraphQLFieldsType } from './common';
import { warn, logOnError } from './logger';

type GraphQLLeafOperators = 'EQ' | 'GT' | 'GTE' | 'IN' | 'LT' | 'LTE' | 'NE' | 'NEQ' | 'NEQ' | 'NIN' | 'REGEX' | 'OPTIONS' | 'NOT';
type MongoDbLeafOperators = '$eq' | '$gt' | '$gte' | '$in' | '$lt' | '$lte' | '$ne' | '$neq' | '$nin' | '$regex' | '$options' | '$not';
type GraphQLRootOperators = 'OR' | 'AND' | 'NOR';
export type MongoDbRootOperators = '$or' | '$and' | '$nor';
type GraphQLOperators = GraphQLLeafOperators | GraphQLRootOperators;
type MongoDbOperators = MongoDbLeafOperators | MongoDbRootOperators;

export type GraphQLFilter = {
    [key: string]: GraphQLFilter[] | GraphQLObjectFilter | GraphQLLeafFilter;
    OR?: GraphQLFilter[];
    AND?: GraphQLFilter[];
    NOR?: GraphQLFilter[];
};

type GraphQLObjectFilter = {
    [key: string]: GraphQLObjectFilter | GraphQLLeafFilter | ('exists' | 'not_exists');
    opr?: 'exists' | 'not_exists';
};

type GraphQLLeafFilterInner = {
    [key in GraphQLLeafOperators]?: any | any[];
};

type GraphQLLeafFilter = GraphQLLeafFilterInner & {
    NOT?: GraphQLLeafFilterInner;
    opr?: MongoDbLeafOperators;
    value?: any;
    values?: any[];
};

export type MongoDbFilter = {
    [key: string]: MongoDbLeafFilter | { $elemMatch: MongoDbObjectFilter } | { $exists?: boolean } | MongoDbFilter[];
    $or?: MongoDbFilter[];
    $and?: MongoDbFilter[];
    $nor?: MongoDbFilter[];
};

type MongoDbObjectFilter = {
    [key: string]: MongoDbLeafFilter | { $elemMatch: MongoDbObjectFilter } | { $exists?: boolean } | boolean;
};

type MongoDbLeafFilter = {
    [key in MongoDbLeafOperators]?: any | any[];
} & {
    $not?: MongoDbLeafFilter | RegExp
};

const operatorsMongoDbKeys: { [key in GraphQLOperators]: MongoDbOperators } = {
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    IN: '$in',
    LT: '$lt',
    LTE: '$lte',
    NE: '$ne',
    NEQ: '$ne', // DEPRECATED
    NIN: '$nin',
    REGEX: '$regex',
    OPTIONS: '$options',
    NOT: '$not',
    OR: '$or',
    AND: '$and',
    NOR: '$nor',
};

const rootOperators: GraphQLRootOperators[] = ['OR', 'AND', 'NOR']


export const getMongoDbFilter = logOnError((graphQLType: GraphQLFieldsType, graphQLFilter: GraphQLFilter = {}): MongoDbFilter => {
    if (!isType(graphQLType)) throw 'First arg of getMongoDbFilter must be the base graphqlType to be parsed'

    const filter = parseMongoDbFilter(graphQLType, graphQLFilter as GraphQLObjectFilter, ...rootOperators) as MongoDbFilter;

    rootOperators
        .map(key => ({ key, args: graphQLFilter[key] as GraphQLFilter[] }))
        .filter(({ args }) => !!args && args.length > 0)
        .forEach(({ key, args }) => filter[operatorsMongoDbKeys[key] as MongoDbRootOperators] =
            args.map(_ => getMongoDbFilter(graphQLType, _)));

    return filter;
});

function parseMongoDbFilter(type: GraphQLFieldsType, graphQLFilter: GraphQLObjectFilter, ...excludedFields: string[]): MongoDbObjectFilter {
    const typeFields = getTypeFields(type)();

    return Object.keys(graphQLFilter)
        .filter(key => !excludedFields.includes(key))
        .reduce((agg: MongoDbObjectFilter, key) => {
            if (key === 'opr') {
                return { ...agg, ...parseMongoExistsFilter(graphQLFilter[key]) } as MongoDbObjectFilter
            }

            const fieldFilter = graphQLFilter[key] as GraphQLObjectFilter | GraphQLLeafFilter;
            const fieldType = getInnerType(typeFields[key].type) as GraphQLLeafType | GraphQLObjectType;

            if (isLeafType(fieldType)) {
                const leafFilter = parseMongoDbLeafFilter(fieldFilter as GraphQLLeafFilter);

                if (Object.keys(leafFilter).length > 0) {
                    return { ...agg, [key]: leafFilter };
                }
            } else {
                const nestedFilter = parseMongoDbFilter(fieldType, fieldFilter, ...excludedFields);

                if (Object.keys(nestedFilter).length > 0) {
                    if (isListField(typeFields[key].type)) {
                        return { ...agg, [key]: { '$elemMatch': nestedFilter } };
                    } else {
                        const { $exists, ...nestedObjectFilter } = nestedFilter;

                        const exists = typeof $exists === 'boolean' ? { [key]: { $exists } } : {  };
                        
                        return { ...agg, ...addPrefixToProperties(nestedObjectFilter, `${key}.`), ...exists};
                    }
                }
            }

            return agg;
        }, {} as MongoDbObjectFilter);
}

function parseMongoExistsFilter(exists: 'exists' | 'not_exists'): { $exists: boolean } {
    return { $exists: exists === 'exists' ? true : false };
}

function parseMongoDbLeafFilter(graphQLLeafFilter: GraphQLLeafFilter, not: boolean = false): MongoDbLeafFilter {
    const mongoDbScalarFilter: MongoDbLeafFilter = {};

    Object.keys(graphQLLeafFilter)
        .filter((key: keyof GraphQLLeafFilter) => key !== 'value' && key !== 'values' && key !== 'OPTIONS')
        .forEach((key: keyof GraphQLLeafFilter) => {
            ////////////// DEPRECATED /////////////////////////////////////////
            if (key === 'opr') {
                Object.assign(mongoDbScalarFilter, parseMongoDbScalarFilterOpr(graphQLLeafFilter[key], graphQLLeafFilter));
                return;
            }
            ///////////////////////////////////////////////////////////////////
            if (key === 'NOT') {
                mongoDbScalarFilter[operatorsMongoDbKeys[key]] = parseMongoDbLeafNoteFilter(graphQLLeafFilter[key]);
                return;
            }

            const element = graphQLLeafFilter[key];

            mongoDbScalarFilter[operatorsMongoDbKeys[key]] = element;

            if (key === 'REGEX') {
                const options = graphQLLeafFilter['OPTIONS'];
                if (not) {
                    mongoDbScalarFilter[operatorsMongoDbKeys[key]] = new RegExp(element, `g${options || ''}`);
                } else if (!!options) {
                    mongoDbScalarFilter[operatorsMongoDbKeys['OPTIONS']] = graphQLLeafFilter['OPTIONS'];
                }
            }

        });

    return mongoDbScalarFilter;
}

function parseMongoDbLeafNoteFilter(graphQLLeafFilterInner: GraphQLLeafFilterInner): MongoDbLeafFilter | RegExp {
    if (!graphQLLeafFilterInner.REGEX) {
        return parseMongoDbLeafFilter(graphQLLeafFilterInner, true);
    }

    if (Object.keys(graphQLLeafFilterInner).length > (!!graphQLLeafFilterInner.OPTIONS ? 2 : 1)) {
        throw "NOT operator can contain either REGEX [and OPTIONS], or every other operator."
    }

    return new RegExp(graphQLLeafFilterInner.REGEX, `g${graphQLLeafFilterInner.OPTIONS || ''}`);
}

////////////// DEPRECATED ///////////////////////////////////////////
let dperecatedMessageSent = false;

function parseMongoDbScalarFilterOpr(opr: MongoDbLeafOperators, graphQLFilter: GraphQLLeafFilter): {} {
    if (!dperecatedMessageSent) {
        warn('scalar filter "opr" field is deprecated, please switch to the operator fields');
        dperecatedMessageSent = true;
    }

    if (["$in", "$nin"].includes(opr)) {
        if (graphQLFilter['values']) {
            return { [opr]: graphQLFilter['values'] };
        }
    }
    else if (graphQLFilter['value'] !== undefined) {
        return { [opr]: graphQLFilter['value'] };
    }

    return {};
}
/////////////////////////////////////////////////////////////////////
