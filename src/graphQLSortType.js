import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, clear, FICTIVE_SORT } from './common';

const sortTypesCache = {};

function getGraphQLSortType(graphQLType, ...excludedFields) {
    if (graphQLType instanceof GraphQLScalarType ||
        graphQLType instanceof GraphQLEnumType) {
        return SortType;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLSortType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return undefined;
    }

    const sortTypeName = setSuffix(graphQLType.name, 'Type', 'SortType');

    return cache(sortTypesCache, sortTypeName, () => new GraphQLInputObjectType({
        name: sortTypeName,
        fields: getGraphQLSortTypeFields(graphQLType, ...excludedFields)
    }));
}

function getGraphQLSortTypeFields(graphQLType, ...excludedFields) {
    return () => {
        const fields = getUnresolvedFieldsTypes(graphQLType, getGraphQLSortType, ...excludedFields)();

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