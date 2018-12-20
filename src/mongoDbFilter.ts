import { isType, GraphQLObjectType, isLeafType } from 'graphql';
import { getTypeFields, getInnerType, isListType } from './common';
import { warn, logOnError } from './logger';

const operatorsMongoDbKeys = {
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    IN: '$in',
    LT: '$lt',
    LTE: '$lte',
    NEQ: '$ne',
    NIN: '$nin',
    REGEX: '$regex',
    OPTIONS: '$options',
};

function getMongoDbFilter(graphQLType: GraphQLObjectType, graphQLFilter: object = {}): object {
    if (!isType(graphQLType)) throw 'First arg of getMongoDbFilter must be the base graphqlType to be parsed'

    const filter = parseMongoDbFilter(graphQLType, graphQLFilter, [], "OR", "AND");

    if (graphQLFilter["OR"]) {
        filter["$or"] = graphQLFilter["OR"].map(_ => getMongoDbFilter(graphQLType, _));
    }
    if (graphQLFilter["AND"]) {
        filter["$and"] = graphQLFilter["AND"].map(_ => getMongoDbFilter(graphQLType, _));
    }

    return filter;
}

function parseMongoDbFilter(type: GraphQLObjectType, graphQLFilter: object, path: string[], ...excludedFields: string[]): object {
    const typeFields = getTypeFields(type)();

    return Object.assign({}, ...Object.keys(graphQLFilter)
        .filter(key => !excludedFields.includes(key) && key !== 'opr')
        .map(key => {
            const fieldFilter = graphQLFilter[key];
            const fieldType: any = getInnerType(typeFields[key].type);
            const newPath = [...path, key];
            const filters = [];

            if (!isLeafType(fieldType) && fieldFilter.opr) {
                filters.push(parseMongoExistsFilter(fieldFilter.opr));
            }

            if (!isLeafType(fieldType) && isListType(typeFields[key].type)) {
                const elementFilter = parseMongoDbFieldFilter(fieldType, fieldFilter, [], ...excludedFields);

                if (Object.keys(elementFilter).length > 0) {
                    filters.push({ '$elemMatch': elementFilter });
                }

                return filters.length > 0
                    ? { [newPath.join('.')]: Object.assign({}, ...filters) }
                    : {};
            }

            return Object.assign({},
                parseMongoDbFieldFilter(fieldType, fieldFilter, newPath, ...excludedFields),
                ...filters.map(_ => ({ [newPath.join('.')]: _ })));
        }));
}

function parseMongoDbFieldFilter(type: GraphQLObjectType, fieldFilter: object, path: string[], ...excludedFields: string[]): object {
    if (isLeafType(type)) {
        const elementFilter = parseMongoDbScalarFilter(fieldFilter);

        return Object.keys(elementFilter).length > 0
            ? { [path.join(".")]: elementFilter }
            : {};
    }

    return parseMongoDbFilter(type, fieldFilter, path, ...excludedFields);
}

function parseMongoExistsFilter(exists: string): object {
    return { $exists: exists === 'exists' ? true : false };
}

let dperecatedMessageSent = false;

function parseMongoDbScalarFilter(graphQLFilter: object): object {
    const mongoDbScalarFilter = {};

    Object.keys(graphQLFilter)
        .filter(key => key !== 'value' && key !== 'values' && key !== 'OPTIONS')
        .forEach(key => {
            const element = graphQLFilter[key];
            ////////////// DEPRECATED /////////////////////////////////////////
            if (key === 'opr') {
                if (!dperecatedMessageSent) {
                    warn('scalar filter "opr" field is deprecated, please switch to the operator fields')
                    dperecatedMessageSent = true;
                }
                if (["$in", "$nin"].includes(element)) {
                    if (graphQLFilter['values']) {
                        mongoDbScalarFilter[element] = graphQLFilter['values'];
                    }
                } else if (graphQLFilter['value'] !== undefined) {
                    mongoDbScalarFilter[element] = graphQLFilter['value'];
                }
                ///////////////////////////////////////////////////////////////////
            } else {
                mongoDbScalarFilter[operatorsMongoDbKeys[key]] = element;

                if (key === 'REGEX' && graphQLFilter['OPTIONS']) {
                    mongoDbScalarFilter[operatorsMongoDbKeys['OPTIONS']] = graphQLFilter['OPTIONS'];
                }
            }
        });

    return mongoDbScalarFilter;
}

export default logOnError(getMongoDbFilter);