import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLObjectType, GraphQLInputType, GraphQLType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, typesCache, FICTIVE_SORT, FieldMap } from './common';


function getGraphQLSortTypeObject(type: GraphQLType, ...excludedFields): GraphQLInputType {
    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return GraphQLSortType;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLSortTypeObject(type.ofType);
    }

    if (type instanceof GraphQLObjectType) {
        return getGraphQLSortType(type, ...excludedFields);
    }
    
    return undefined;
}

export function getGraphQLSortType(type: GraphQLObjectType, ...excludedFields: string[]): GraphQLInputObjectType {
    const sortTypeName = setSuffix(type.name, 'Type', 'SortType');

    return cache(typesCache, sortTypeName, () => new GraphQLInputObjectType({
        name: sortTypeName,
        fields: getGraphQLSortTypeFields(type, ...excludedFields)
    }));
}

function getGraphQLSortTypeFields(type: GraphQLObjectType, ...excludedFields: string[]): () => FieldMap<GraphQLInputType> {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, getGraphQLSortTypeObject, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_SORT]: { type: GraphQLSortType, isDeprecated: true, description: "IGNORE. Due to limitations of the package, objects with no sortable fields are not ommited. GraphQL input object types must have at least one field" } }
    }
}

export const GraphQLSortType = new GraphQLEnumType({
    name: 'SortType',
    values: {
        ASC: { value: 1 },
        DESC: { value: -1 }
    }
});