import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLBoolean, GraphQLInt, GraphQLFloat } from 'graphql';
import { FICTIVE_INC, cache, setSuffix, getUnresolvedFields, getTypeFields, clear } from './common';

const updateTypesCache = {};
const inputTypesCache = {};
const insertTypesCache = {};
const incTypesCache = {};

function getGraphQLUpdateType(graphQLType, ...excludedFields) {
    const updateTypeName = setSuffix(graphQLType.name, 'Type', 'UpdateType');

    return cache(updateTypesCache, updateTypeName, () => new GraphQLInputObjectType({
        name: updateTypeName,
        fields: getUpdateFields(graphQLType, ...excludedFields)
    }));
}

function getUpdateFields(graphQLType, ...excludedFields) {
    return () => ({
        set: { type: getGraphQLInputType(graphQLType, ...excludedFields) },
        setOnInsert: { type: getGraphQLInsertType(graphQLType, ...excludedFields) },
        inc: { type: getGraphQLIncType(graphQLType, ...excludedFields) }
    });
}

function getGraphQLInputType(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        return graphQLType;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLInputType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInputType(graphQLType.ofType));
    }

    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'InputType');

    return cache(inputTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFields(graphQLType, getGraphQLInputType, ...excludedFields)
    }));
}

function getGraphQLInsertType(graphQLType, ...excludedFields) {
    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'InsertType');

    return cache(insertTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLInsertTypeFields(graphQLType, getGraphQLInsertTypeNested, ...excludedFields)
    }));
}

function getGraphQLInsertTypeFields(graphQLType, typeResolver, ...excludedFields) {
    return () => {
        const fields = getUnresolvedFields(graphQLType, typeResolver, ...excludedFields)();

        if (fields._id && fields._id.type instanceof GraphQLNonNull) {
            fields._id.type = fields._id.type.ofType;
        }

        return fields;
    };
}

function getGraphQLInsertTypeNested(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        return graphQLType;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return new GraphQLNonNull(getGraphQLInsertTypeNested(graphQLType.ofType));
    }

    if (graphQLType instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInsertTypeNested(graphQLType.ofType));
    }

    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'InsertType');

    return cache(insertTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFields(graphQLType, getGraphQLInsertTypeNested, ...excludedFields)
    }));
}

function getGraphQLIncType(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        if (["Int", "Float"].includes(graphQLType.name)) {
            return graphQLType;
        }

        return undefined;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLIncType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return undefined;
    }

    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'IncType');

    return cache(incTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLIncTypeFields(graphQLType, ...excludedFields)
    }));
}

function getGraphQLIncTypeFields(graphQLType, ...excludedFields) {
    return () => {
        const fields = getUnresolvedFields(graphQLType, getGraphQLIncType, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_INC]: { type: GraphQLInt, description: "IGNORE. Due to limitations of the package, objects with no incrementable fields cannot be ommited. All input object types must have at least one field" } }
    }
}

export { getGraphQLUpdateType, getGraphQLInsertType };