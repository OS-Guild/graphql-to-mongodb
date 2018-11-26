import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLInt, GraphQLObjectType, GraphQLInputFieldConfigMap, GraphQLInputType, Thunk, GraphQLBoolean } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, typesCache } from './common';

export const OVERWRITE = "_OVERWRITE";
export const OVERWRITE_DESCRIPTION = "If set to true, the object would be overwriten entirely, including fields that are not specified. Non-null validation rules will apply. Once set to true, any child object will overwriten invariably of the value set to this field.";
export const FICTIVE_INC = "_FICTIVE_INC";
export const FICTIVE_INC_DESCRIPTION = "IGNORE. Due to limitations of the package, objects with no incrementable fields cannot be ommited. All input object types must have at least one field";

export function getGraphQLUpdateType(type: GraphQLObjectType, ...excludedFields: string[]): GraphQLInputObjectType {
    const updateTypeName = setSuffix(type.name, 'Type', 'UpdateType');

    return cache(typesCache, updateTypeName, () => new GraphQLInputObjectType({
        name: updateTypeName,
        fields: getUpdateFields(type, ...excludedFields)
    }));
}

function getUpdateFields(graphQLType: GraphQLObjectType, ...excludedFields: string[]): () => GraphQLInputFieldConfigMap {
    return () => ({
        setOnInsert: { type: getGraphQLSetOnInsertType(graphQLType, ...excludedFields) },
        set: { type: getGraphQLSetType(graphQLType, ...excludedFields) },
        inc: { type: getGraphQLIncType(graphQLType, ...excludedFields) }
    });
}

export function getGraphQLSetOnInsertType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>,
    ...excludedFields: string[]): GraphQLInputType {

    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return type;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLSetOnInsertType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        return new GraphQLList(getGraphQLSetOnInsertType(type.ofType));
    }

    const inputTypeName = setSuffix(type.name, 'Type', 'SetOnInsertType');

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFieldsTypes(type, getGraphQLSetOnInsertType, ...excludedFields)
    }));
}

export function getGraphQLSetType(type: GraphQLObjectType, ...excludedFields: string[]): GraphQLInputObjectType {
    const inputTypeName = setSuffix(type.name, 'Type', 'SetType');

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFieldsTypes(type, (_, ...excluded) => getGraphQLSetObjectType(_ as any, false, ...excluded), ...excludedFields)
    }));
}

function getGraphQLSetObjectType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>,
    isInList: boolean, 
    ...excludedFields: string[]): GraphQLInputType {


    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return type;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLSetObjectType(type.ofType, isInList);
    }

    if (type instanceof GraphQLList) {
        return new GraphQLList(getGraphQLSetObjectType(type.ofType, true));
    }

    const inputTypeName = setSuffix(type.name, 'Type', isInList ? 'SetListObjectType' : 'SetObjectType');

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLSetObjectTypeFields(type, isInList, ...excludedFields)
    }));
}

function getGraphQLSetObjectTypeFields(type: GraphQLObjectType, isInList: boolean, ...excludedFields: string[]): Thunk<GraphQLInputFieldConfigMap> {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, (_, ...excluded) => getGraphQLSetObjectType(_ as any, isInList, ...excluded), ...excludedFields)();

        if (!isInList) {
            fields[OVERWRITE] = { type: GraphQLBoolean, description: OVERWRITE_DESCRIPTION }
        }

        return fields;
    };
}

export function getGraphQLIncType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>,
    ...excludedFields: string[]): GraphQLInputType {

    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        if (["Int", "Float"].includes(type.name)) {
            return type;
        }

        return undefined;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLIncType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        return undefined;
    }

    const inputTypeName = setSuffix(type.name, 'Type', 'IncType');

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLIncTypeFields(type, ...excludedFields)
    }));
}

function getGraphQLIncTypeFields(type: GraphQLObjectType, ...excludedFields: string[]): () => GraphQLInputFieldConfigMap {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, getGraphQLIncType, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_INC]: { type: GraphQLInt, description: FICTIVE_INC_DESCRIPTION } }
    }
}