import { isType, GraphQLScalarType, GraphQLEnumType } from 'graphql'
import { getTypeFields, getInnerType } from './common'

const operatorsMongoDbKeys = {
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    IN: '$in',
    LT: '$lt',
    LTE: '$lte',
    NEQ: '$ne',
    NIN: '$nin',
}

function getMongoDbFilter(graphQLType, graphQLFilter = {}) {
    if (!isType(graphQLType)) throw 'First arg of getMongoDbFilter must be the base graphqlType to be parsed'

    const filter = parseMongoDbFilter(graphQLType, graphQLFilter, [], "OR", "AND");

    if (graphQLFilter["OR"]) {
        filter["$or"] = graphQLFilter["OR"].map(_ => getMongoDbFilter(graphQLType, _));
    }
    if (graphQLFilter["AND"]) {
        filter["$and"] = graphQLFilter["AND"].map(_ => getMongoDbFilter(graphQLType, _));
    }

    return filter;
};

function parseMongoDbFilter(graphQLType, graphQLFilter, path = [], ...excludedFields) {
    const typeFields = getTypeFields(graphQLType)();

    return Object.assign({}, ...Object.keys(graphQLFilter)
        .filter(key => !excludedFields.includes(key))
        .map(key => {
            const fieldType = getInnerType(typeFields[key].type);
            const filterField = graphQLFilter[key];

            if (key == 'opr') {
                return { [path.join(".")]: parseMongoExistsFilter(filterField) };
            }

            const newPath = [...path, key];

            if (fieldType instanceof GraphQLScalarType || fieldType instanceof GraphQLEnumType) {
                const mongoDbScalarFilter = parseMongoDbScalarFilter(filterField);

                if (mongoDbScalarFilter && Object.keys(mongoDbScalarFilter).length > 0) {
                    return { [newPath.join(".")]: mongoDbScalarFilter };
                } else {
                    return {};
                }
            }

            return parseMongoDbFilter(fieldType, filterField, newPath, ...excludedFields);
        }));
}

function parseMongoExistsFilter(exists) {
    return { $exists: exists == "exists" ? true : false };
}

let dperecatedMessageSent = false;

function parseMongoDbScalarFilter(graphQLFilter) {
    const mongoDbScalarFilter = {};

    Object.keys(graphQLFilter)
        .filter(key => key !== 'value' && key !== 'values')
        .forEach(key => {
            const element = graphQLFilter[key];
            ////////////// DEPRECATED /////////////////////////////////////////
            if (key === 'opr') {
                if (!dperecatedMessageSent) {
                    console.warn('scalar filter "opr" field is deprecated, please switch to the operator fields')
                    dperecatedMessageSent = true;
                }
                if (["$in", "$nin"].includes(element)) {
                    if (graphQLFilter.values) {
                        mongoDbScalarFilter[element] = graphQLFilter.values;
                    }
                } else if (graphQLFilter.value !== undefined) {
                    mongoDbScalarFilter[element] = graphQLFilter.value;
                }
            ///////////////////////////////////////////////////////////////////
            } else {
                mongoDbScalarFilter[operatorsMongoDbKeys[key]] = element;
            }
        });

    return mongoDbScalarFilter;
}

export default getMongoDbFilter;