import { GraphQLInputObjectType, GraphQLEnumType, GraphQLNonNull, GraphQLObjectType, GraphQLInputType, GraphQLType, isLeafType, GraphQLInterfaceType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, typesCache, FieldMap, GraphQLFieldsType } from './common';

export const FICTIVE_SORT = "_FICTIVE_SORT";
export const FICTIVE_SORT_DESCRIPTION = "IGNORE. Due to limitations of the package, objects with no sortable fields are not ommited. GraphQL input object types must have at least one field";

function getGraphQLSortTypeObject(type: GraphQLType, ...excludedFields): GraphQLInputType {
    if (isLeafType(type)) {
        return GraphQLSortType;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLSortTypeObject(type.ofType);
    }

    if (type instanceof GraphQLObjectType ||
        type instanceof GraphQLInterfaceType) {
        return getGraphQLSortType(type, ...excludedFields);
    }
    
    return undefined;
}

export function getGraphQLSortType(type: GraphQLFieldsType, ...excludedFields: string[]): GraphQLInputObjectType {
    const sortTypeName = setSuffix(type.name, 'Type', 'SortType');

    return cache(typesCache, sortTypeName, () => new GraphQLInputObjectType({
        name: sortTypeName,
        fields: getGraphQLSortTypeFields(type, ...excludedFields)
    }));
}

function getGraphQLSortTypeFields(type: GraphQLFieldsType, ...excludedFields: string[]): () => FieldMap<GraphQLInputType> {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, getGraphQLSortTypeObject, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_SORT]: { type: GraphQLSortType, isDeprecated: true, description: FICTIVE_SORT_DESCRIPTION } }
    }
}

export const GraphQLSortType = new GraphQLEnumType({
    name: 'SortType',
    values: {
        ASC: { value: 1 },
        DESC: { value: -1 }
    }
});
