import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType } from 'graphql';
import { cache, setSuffix, getUnresolvedFields } from './common';

const filterTypesCache = {};
const scalarInputTypesCache = {};

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

function getGraphQLScalarInputFilterType(graphQLScalarType, inArray) {
    const typeName = graphQLScalarType.toString() + (inArray ? "InArray" : "") + "Input";

    return cache(scalarInputTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        description: inArray ? "Filter operator currently limited only to EQL and IN" : "",
        fields: getScalarInputFilterTypeFields(graphQLScalarType, inArray)
    }));
}

function getScalarInputFilterTypeFields(graphQLScalarType, inArray) {
    return () => ({
        opr: { type: new GraphQLNonNull(inArray ? OprEqType : OprType) },
        value: { type: graphQLScalarType },
        values: { type: new GraphQLList(graphQLScalarType) }
    })
}

function getGraphQLInputFilterType(graphQLType, isInArray, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType) {
        return getGraphQLScalarInputFilterType(graphQLType, isInArray);
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLInputFilterType(graphQLType.ofType, isInArray);
    }

    if (graphQLType instanceof GraphQLList) {
        return getGraphQLInputFilterType(graphQLType.ofType, true);
    }

    return new GraphQLInputObjectType({
        name: setSuffix(graphQLType.name, 'Type', 'InputFilterType'),
        fields: getInputObjectTypeFields(graphQLType, isInArray, ...excludedFields)
    });
}

function getFields(graphQLType, isInArray, ...excludedFields) {
    return getUnresolvedFields(graphQLType, _ => getGraphQLInputFilterType(_, isInArray));
}

function getInputObjectTypeFields(graphQLType, inArray, ...excludedFields) {
    return () => {
        const generatedFields = getFields(graphQLType, inArray, ...excludedFields)();

        generatedFields['opr'] = { type: OprExistsType };

        return generatedFields;
    };
}

function getOrAndFields(graphQLType, ...excludedFields) {
    return () => {
        const generatedFields = getFields(graphQLType, false, ...excludedFields)();

        generatedFields['OR'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };
        generatedFields['AND'] = { type: new GraphQLList(getGraphQLFilterType(graphQLType, ...excludedFields)) };

        return generatedFields;
    };
}

function getGraphQLFilterType(graphQLType, ...excludedFields) {
    const filterTypeName = setSuffix(graphQLType.name, 'Type', 'FilterType');

    return cache(filterTypesCache, filterTypeName, () => new GraphQLInputObjectType({
        name: filterTypeName,
        fields: getOrAndFields(graphQLType, ...excludedFields)
    }));
}

function clearTypeCache() {
    for (var member in filterTypesCache) delete filterTypesCache[member];
    for (var member in scalarInputTypesCache) delete scalarInputTypesCache[member];
}

export { getGraphQLFilterType, clearTypeCache, OprType, OprEqType, OprExistsType }