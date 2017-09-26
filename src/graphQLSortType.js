import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType } from 'graphql';

const sortTypesCache = {};

function getGraphQLSortType(graphQLType, ...excludedFields) {
    const sortTypeName = setTypeSuffix(graphQLType.name, 'Type', 'SortType');

    if (!sortTypesCache[sortTypeName]) {
        sortTypesCache[sortTypeName] = new GraphQLInputObjectType({
            name: sortTypeName,
            fields: getTypeScalarFields(graphQLType, () => SortType, ...excludedFields)
        });
    }

    return sortTypesCache[sortTypeName];
}

function setTypeSuffix(text, locate, replaceWith) {
    const regex = new RegExp(`${locate}$`);
    return regex.test(text)
        ? text.replace(regex, replaceWith)
        : `${text}${replaceWith}`;
}

function getTypeScalarFields(graphQLType, fieldTypeResolver, ...excludedFields) {
    return () => {
        const typeFields =
            typeof graphQLType._typeConfig.fields === "function"
                ? graphQLType._typeConfig.fields()
                : graphQLType._typeConfig.fields;

        const generatedFields = {};

        Object.keys(typeFields)
            .filter(key => isScalarType(typeFields[key].type))
            .filter(key => !excludedFields.includes(key))
            .filter(key => !typeFields[key].resolve)
            .forEach(key => generatedFields[key] = { type: fieldTypeResolver(typeFields[key].type) });

        return generatedFields;
    };
}

function isScalarType(graphQLType) {
    return graphQLType instanceof GraphQLScalarType ||
        (graphQLType instanceof GraphQLNonNull && graphQLType.ofType instanceof GraphQLScalarType);
}

const SortType = new GraphQLEnumType({
    name: 'SortType',
    values: {
        ASC: { value: 1 },
        DESC: { value: -1 }
    }
});

export default getGraphQLSortType;