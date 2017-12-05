import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes } from './common';

const filterTypesCache = {};
const objectFilterTypesCache = {};
const scalarFilterTypesCache = {};

const OprType = new GraphQLEnumType({
    name: 'Opr',
    values: {
        EQL: { value: "$eq" },
        GT: { value: "$gt" },
        GTE: { value: "$gte" },
        IN: { value: "$in" },
        LT: { value: "$lt" },
        LTE: { value: "$lte" },
        NE: { value: "$ne" },
        NIN: { value: "$nin" }
    }
});

const OprExistsType = new GraphQLEnumType({
    name: 'OprExists',
    values: {
        EXISTS: { value: "exists" },
        NOT_EXISTS: { value: "not_exists" },
    }
});

function getGraphQLFilterType(graphQLType, ...excludedFields) {
    const filterTypeName = setSuffix(graphQLType.name, 'Type', 'FilterType');

    return cache(filterTypesCache, filterTypeName, () => new GraphQLInputObjectType({
        name: filterTypeName,
        fields: getOrAndFields(graphQLType, ...excludedFields)
    }));
}

function getOrAndFields(graphQLType, ...excludedFields) {
    return () => {
        const generatedFields = getUnresolvedFieldsTypes(graphQLType, getGraphQLObjectFilterType, ...excludedFields)();

        generatedFields['OR'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };
        generatedFields['AND'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };

        return generatedFields;
    };
}

function getGraphQLObjectFilterType(graphQLType, ...excludedFields) {
    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        return getGraphQLScalarFilterType(graphQLType);
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLObjectFilterType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return getGraphQLObjectFilterType(graphQLType.ofType);
    }

    const typeName = setSuffix(graphQLType.name, 'Type', 'ObjectFilterType');
    return cache(objectFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        fields: getInputObjectTypeFields(graphQLType, ...excludedFields)
    }));
}

function getInputObjectTypeFields(graphQLType, ...excludedFields) {
    return () => {
        const generatedFields = getUnresolvedFieldsTypes(graphQLType, getGraphQLObjectFilterType, ...excludedFields)();

        generatedFields['opr'] = { type: OprExistsType };

        return generatedFields;
    };
}

function getGraphQLScalarFilterType(graphQLScalarType) {
    const typeName = graphQLScalarType.toString() + "Filter";

    return cache(scalarFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        fields: getGraphQLScalarFilterTypeFields(graphQLScalarType)
    }));
}

function getGraphQLScalarFilterTypeFields(graphQLScalarType) {
    return {
        opr: { type: OprType, deprecationReason: 'Switched to the more intuitive operator fields' },
        value: { type: graphQLScalarType, deprecationReason: 'Switched to the more intuitive operator fields' },
        values: { type: new GraphQLList(graphQLScalarType), deprecationReason: 'Switched to the more intuitive operator fields' },
        EQ: { type: graphQLScalarType },
        GT: { type: graphQLScalarType },
        GTE: { type: graphQLScalarType },
        IN: { type: new GraphQLList(graphQLScalarType) },
        LT: { type: graphQLScalarType },
        LTE: { type: graphQLScalarType },
        NEQ: { type: graphQLScalarType },
        NIN: { type: new GraphQLList(graphQLScalarType) }
    };
}

function clearTypeCache() {
    for (var member in filterTypesCache) delete filterTypesCache[member];
    for (var member in objectFilterTypesCache) delete objectFilterTypesCache[member];
    for (var member in scalarFilterTypesCache) delete scalarFilterTypesCache[member];
}

export { getGraphQLFilterType, clearTypeCache, OprType, OprExistsType }