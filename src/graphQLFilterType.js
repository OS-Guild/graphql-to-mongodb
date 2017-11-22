import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType } from 'graphql';
import { cache, setSuffix, getUnresolvedFields } from './common';

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

const OprEqType = new GraphQLEnumType({
    name: 'OprEq',
    values: {
        EQL: { value: "$eq" },
        IN: { value: "$in" }
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
        const generatedFields = getFields(graphQLType, false, ...excludedFields)();

        generatedFields['OR'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };
        generatedFields['AND'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };

        return generatedFields;
    };
}

function getFields(graphQLType, isInArray, ...excludedFields) {
    return getUnresolvedFields(graphQLType, _ => getGraphQLObjectFilterType(_, isInArray));
}

function getGraphQLObjectFilterType(graphQLType, isInArray, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        return getGraphQLScalarFilterType(graphQLType, isInArray);
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLObjectFilterType(graphQLType.ofType, isInArray);
    }

    if (graphQLType instanceof GraphQLList) {
        return getGraphQLObjectFilterType(graphQLType.ofType, true);
    }

    const typeName = setSuffix(graphQLType.name, 'Type', 'ObjectFilterType');
    return cache(objectFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        fields: getInputObjectTypeFields(graphQLType, isInArray, ...excludedFields)
    }));
}

function getInputObjectTypeFields(graphQLType, inArray, ...excludedFields) {
    return () => {
        const generatedFields = getFields(graphQLType, inArray, ...excludedFields)();

        generatedFields['opr'] = { type: OprExistsType };

        return generatedFields;
    };
}

function getGraphQLScalarFilterType(graphQLScalarType, inArray) {
    const typeName = graphQLScalarType.toString() + (inArray ? "InArray" : "") + "Filter";

    return cache(scalarFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        description: inArray ? "Filter operator currently limited only to EQL and IN" : "",
        fields: getGraphQLScalarFilterTypeFields(graphQLScalarType, inArray)
    }));
}

function getGraphQLScalarFilterTypeFields(graphQLScalarType, inArray) {
    return inArray
        ? {
            opr: { type: OprEqType, deprecationReason: 'Switched to the more intuitive operator fields' },
            value: { type: graphQLScalarType, deprecationReason: 'Switched to the more intuitive operator fields' },
            values: { type: new GraphQLList(graphQLScalarType), deprecationReason: 'Switched to the more intuitive operator fields' },
            EQ: { type: graphQLScalarType },
            IN: { type: new GraphQLList(graphQLScalarType) }
        } : {
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
    for (var member in scalarFilterTypesCache) delete scalarFilterTypesCache[member];
}

export { getGraphQLFilterType, clearTypeCache, OprType, OprEqType, OprExistsType }