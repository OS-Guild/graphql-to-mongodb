import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLType, GraphQLInputFieldConfigMap, GraphQLObjectType, GraphQLInputType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, clear, FICTIVE_SORT, FieldMap } from './common';

const sortTypesCache = {};

function getGraphQLSortType(type: GraphQLObjectType, ...excludedFields: string[]): GraphQLInputType {
    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return SortType;
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLSortType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        return undefined;
    }

    const sortTypeName = setSuffix(type.name, 'Type', 'SortType');

    return cache(sortTypesCache, sortTypeName, () => new GraphQLInputObjectType({
        name: sortTypeName,
        fields: getGraphQLSortTypeFields(type, ...excludedFields)
    }));
}

function getGraphQLSortTypeFields(type: GraphQLObjectType, ...excludedFields: string[]): () => FieldMap<GraphQLInputType> {
    return () => {
        const fields = getUnresolvedFieldsTypes(type, getGraphQLSortType, ...excludedFields)();

        if (Object.keys(fields).length > 0) {
            return fields;
        }

        return { [FICTIVE_SORT]: { type: SortType, description: "IGNORE. Due to limitations of the package, objects with no sortable fields cannot be ommited. All input object types must have at least one field" } }
    }
}

const SortType = new GraphQLEnumType({
    name: 'SortType',
    values: {
        ASC: { value: 1 },
        DESC: { value: -1 }
    }
});

export default getGraphQLSortType;