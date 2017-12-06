import { isType, GraphQLScalarType, GraphQLEnumType } from 'graphql';
import { getTypeFields, getInnerType, isListType, isScalarType } from './common';
import { logError, warn } from './logger';

const operatorsMongoDbKeys = {
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    IN: '$in',
    LT: '$lt',
    LTE: '$lte',
    NEQ: '$ne',
    NIN: '$nin',
};

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
}

function parseMongoDbFilter(graphQLType, graphQLFilter, path, ...excludedFields) {
    const typeFields = getTypeFields(graphQLType)();

    return Object.assign({}, ...Object.keys(graphQLFilter)
        .filter(key => !excludedFields.includes(key) && key !== 'opr')
        .map(key => {
            const fieldFilter = graphQLFilter[key];
            const fieldType = getInnerType(typeFields[key].type);
            const newPath = [...path, key];
            const filters = [];

            if (!isScalarType(fieldType) && fieldFilter.opr) {
                filters.push(parseMongoExistsFilter(fieldFilter.opr));
            }

            if (isListType(typeFields[key].type)) {
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

function parseMongoDbFieldFilter(graphQLType, fieldFilter, path, ...excludedFields) {
    if (isScalarType(graphQLType)) {
        const elementFilter = parseMongoDbScalarFilter(fieldFilter);

        return Object.keys(elementFilter).length > 0
            ? { [path.join(".")]: elementFilter }
            : {};
    }

    return parseMongoDbFilter(graphQLType, fieldFilter, path, ...excludedFields);
}

function parseMongoExistsFilter(exists) {
    return { $exists: exists === 'exists' ? true : false };
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
                    warn('scalar filter "opr" field is deprecated, please switch to the operator fields')
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

export default logError(getMongoDbFilter);