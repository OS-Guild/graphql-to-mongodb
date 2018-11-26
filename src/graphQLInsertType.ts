import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLObjectType, GraphQLInputType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, typesCache, FieldMap } from './common';


export function getGraphQLInsertType(graphQLType: GraphQLObjectType, ...excludedFields: string[]) : GraphQLInputObjectType {
    const inputTypeName = setSuffix(graphQLType.name, 'Type', 'InsertType');

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getGraphQLInsertTypeFields(graphQLType, ...excludedFields)
    }));
}

function getGraphQLInsertTypeFields(graphQLType: GraphQLObjectType, ...excludedFields: string[]) : () => FieldMap<GraphQLInputType> {
    return () => {
        const fields = getUnresolvedFieldsTypes(graphQLType, getGraphQLInsertTypeNested, ...excludedFields)();

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

    return cache(typesCache, inputTypeName, () => new GraphQLInputObjectType({
        name: inputTypeName,
        fields: getUnresolvedFieldsTypes(type, getGraphQLInsertTypeNested, ...excludedFields)
    }));
}