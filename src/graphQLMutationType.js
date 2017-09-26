import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLBoolean, GraphQLInt, GraphQLFloat } from 'graphql';

const updateTypesCache = {};
const inputTypesCache = {};
const insertTypesCache = {};
const incTypesCache = {};

function getGraphQLUpdateType(graphQLType, ...excludedFields) {
    const updateTypeName = setTypeSuffix(graphQLType.name, 'Type', 'UpdateType');

    if (!updateTypesCache[updateTypeName]) {
        updateTypesCache[updateTypeName] = new GraphQLInputObjectType({
            name: updateTypeName,
            fields: getUpdateFields(graphQLType, ...excludedFields)
        });
    }

    return updateTypesCache[updateTypeName];
}

function getUpdateFields(graphQLType, ...excludedFields) {
    return () => ({
        set: { type: getGraphQLInputType(graphQLType, ...excludedFields) },
        setOnInsert: { type: getGraphQLInsertType(graphQLType, ...excludedFields) },
        inc: { type: getGraphQLIncType(graphQLType, ...excludedFields) }
    });
}

function getGraphQLInputType(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType) {
        return graphQLType;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLInputType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInputType(graphQLType.ofType));
    }

    const inputTypeName = setTypeSuffix(graphQLType.name, 'Type', 'InputType');

    if (!inputTypesCache[inputTypeName]) {
        inputTypesCache[inputTypeName] = new GraphQLInputObjectType({
            name: inputTypeName,
            fields: getTypeFields(graphQLType, getGraphQLInputType, ...excludedFields)
        });
    }

    return inputTypesCache[inputTypeName];
}

function getGraphQLInsertType(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType) {
        return graphQLType;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return new GraphQLNonNull(getGraphQLInsertType(graphQLType.ofType));
    }

    if (graphQLType instanceof GraphQLList) {
        return new GraphQLList(getGraphQLInsertType(graphQLType.ofType));
    }

    const inputTypeName = setTypeSuffix(graphQLType.name, 'Type', 'InsertType');

    if (!insertTypesCache[inputTypeName]) {
        insertTypesCache[inputTypeName] = new GraphQLInputObjectType({
            name: inputTypeName,
            fields: getTypeFields(graphQLType, getGraphQLInsertType, ...excludedFields)
        });
    }

    return insertTypesCache[inputTypeName];
}

function getGraphQLIncType(graphQLType, ...excludedFields) {

    if (graphQLType instanceof GraphQLScalarType) {
        if (["Int","Float"].includes(graphQLType.name)) {
            return graphQLType;
        }

        return GraphQLInt;
    }

    if (graphQLType instanceof GraphQLNonNull) {
        return getGraphQLIncType(graphQLType.ofType);
    }

    if (graphQLType instanceof GraphQLList) {
        return GraphQLInt;
    }

    const inputTypeName = setTypeSuffix(graphQLType.name, 'Type', 'IncType');

    if (!insertTypesCache[inputTypeName]) {
        insertTypesCache[inputTypeName] = new GraphQLInputObjectType({
            name: inputTypeName,
            fields: getTypeFields(graphQLType, getGraphQLIncType, ...excludedFields)
        });
    }

    return insertTypesCache[inputTypeName];
}

function getTypeFields(graphQLType, fieldTypeResolver, ...excludedFields) {
    return () => {
        const typeFields =
            typeof graphQLType._typeConfig.fields === "function"
                ? graphQLType._typeConfig.fields()
                : graphQLType._typeConfig.fields;

        const generatedFields = {};

        Object.keys(typeFields)
            .filter(key => !excludedFields.includes(key))
            .filter(key => !typeFields[key].resolve)
            .forEach(key => generatedFields[key] = { type: fieldTypeResolver(typeFields[key].type) });

        return generatedFields;
    };
}

function setTypeSuffix(text, locate, replaceWith) {
    const regex = new RegExp(`${locate}$`);
    return regex.test(text)
        ? text.replace(regex, replaceWith)
        : `${text}${replaceWith}`;
}

export { getGraphQLUpdateType, getGraphQLInsertType };