import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLInt, GraphQLObjectType, GraphQLInputFieldConfigMap, GraphQLInputType } from 'graphql';
import { FICTIVE_INC, cache, setSuffix, getUnresolvedFieldsTypes, clear, TypeResolver, FieldMap } from './common';

const updateTypesCache = {};
const inputTypesCache = {};
const insertTypesCache = {};
const incTypesCache = {};

export function getGraphQLUpdateType(type: GraphQLObjectType, ...excludedFields: string[]) : GraphQLInputObjectType {
    const updateTypeName = setSuffix(type.name, 'Type', 'UpdateType');

    return cache(updateTypesCache, updateTypeName, () => new GraphQLInputObjectType({
        name: updateTypeName,
        fields: getUpdateFields(type, ...excludedFields)
    }));
}

function getUpdateFields(graphQLType: GraphQLObjectType, ...excludedFields: string[]) : () => GraphQLInputFieldConfigMap {
    return () => ({
        set: { type: getGraphQLInputType(graphQLType, ...excludedFields) },
        setOnInsert: { type: getGraphQLInsertTypeNested(graphQLType, ...excludedFields) },
        inc: { type: getGraphQLIncType(graphQLType, ...excludedFields) }
    });
}

function getGraphQLInputType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>, 
    ...excludedFields: string[]) : GraphQLInputType {

    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return type;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLInputType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInputType(type.ofType));
    }

    const inputTypeName = setSuffix(type.name, 'Type', 'InputType');

    return cache(inputTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFieldsTypes(type, getGraphQLInputType, ...excludedFields)
    }));
}

export function getGraphQLInsertType(graphQLType: GraphQLObjectType, ...excludedFields: string[]) : GraphQLInputObjectType {
    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'InsertType');

    return cache(insertTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLInsertTypeFields(graphQLType, getGraphQLInsertTypeNested, ...excludedFields)
    }));
}

function getGraphQLInsertTypeFields(graphQLType: GraphQLObjectType, typeResolver: TypeResolver<GraphQLInputType>, ...excludedFields: string[]) : () => FieldMap<GraphQLInputType> {
    return () => {
        const fields = getUnresolvedFieldsTypes(graphQLType, typeResolver, ...excludedFields)();

        const idField = fields['_id'];

        if (idField && idField.type instanceof GraphQLNonNull) {
            idField.type = idField.type.ofType;
        }

        return fields;
    };
}

function getGraphQLInsertTypeNested(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>, 
    ...excludedFields: string[]) : GraphQLInputType {

    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return type;
    }

    if (type instanceof GraphQLNonNull) {
        return new GraphQLNonNull(getGraphQLInsertTypeNested(type.ofType));
    }

    if (type instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInsertTypeNested(type.ofType));
    }

    const inputTypeName = setSuffix(type.name, 'Type', 'InsertType');

    return cache(insertTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFieldsTypes(type, getGraphQLInsertTypeNested, ...excludedFields)
    }));
}

function getGraphQLIncType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>,  
    ...excludedFields: string[]) : GraphQLInputType {

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

    return cache(incTypesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLIncTypeFields(type, ...excludedFields)
    }));
}

function getGraphQLIncTypeFields(type: GraphQLObjectType, ...excludedFields: string[]) : () => GraphQLInputFieldConfigMap {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, getGraphQLIncType, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_INC]: { type: GraphQLInt, description: "IGNORE. Due to limitations of the package, objects with no incrementable fields cannot be ommited. All input object types must have at least one field" } }
    }
}