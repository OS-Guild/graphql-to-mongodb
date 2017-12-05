import { isType, GraphQLList, GraphQLScalarType, GraphQLEnumType } from 'graphql'

const FICTIVE_INC = "FICTIVE_INC";
const FICTIVE_SORT = "FICTIVE_SORT";

function cache(cacheObj, key, callback) {
    let item = cacheObj[key];

    if (item === undefined) {
        item = callback(key);
        cacheObj[key] = item;
    }

    return item;
}

function setSuffix(text, locate, replaceWith) {
    const regex = new RegExp(`${locate}$`);
    return regex.test(text)
        ? text.replace(regex, replaceWith)
        : `${text}${replaceWith}`;
}

function getTypeFields(graphQLType, filter = null, typeResolver = null, ...excludedFields) {
    return () => {
        const typeFields =
            typeof graphQLType._typeConfig.fields === "function"
                ? graphQLType._typeConfig.fields()
                : graphQLType._typeConfig.fields;

        const generatedFields = {};

        Object.keys(typeFields)
            .filter(key => !excludedFields.includes(key))
            .filter(key => !filter || filter(key, typeFields[key]))
            .forEach(key => {
                const field = typeFields[key];
                const type = typeResolver
                    ? typeResolver(field.type)
                    : field.type;
                if (type) generatedFields[key] = { ...field, type: type }
            }); //, ...excludedFields

        return generatedFields;
    };
}

function getUnresolvedFieldsTypes(graphQLType, typeResolver, ...excludedFields) {
    return () => {
        const fields = getTypeFields(graphQLType, (key, field) => !field.resolve, typeResolver, ...excludedFields)();
        const fieldsTypes = {};
        Object.keys(fields).forEach(key => fieldsTypes[key] = { type: fields[key].type } );
        return fieldsTypes;
    };
}

function getInnerType(graphQLType) {
    let innerType = graphQLType;

    while (innerType.ofType) {
        innerType = innerType.ofType;
    }

    return innerType;
}

function isListType(graphQLType) {
    let innerType = graphQLType;

    while (innerType.ofType) {
        if (innerType instanceof GraphQLList) return true;
        innerType = innerType.ofType;
    }

    return false;
}

function isScalarType(graphQLType) {
    return graphQLType instanceof GraphQLScalarType || graphQLType instanceof GraphQLEnumType;
}

function clear(obj, ...excludedKeys) {
    return Object.keys(obj).reduce((cleared, key) => {
        let value = obj[key];
        if (value !== undefined &&
            value !== null &&
            !excludedKeys.includes(key)) {

            if (typeof value != 'object' ||
                value instanceof Date ||
                isType(value)) {
                return { ...cleared, [key]: value }
            }

            const objectValue = clear(value, ...excludedKeys);

            if (Object.keys(objectValue).length > 0) {
                return { ...cleared, [key]: objectValue }
            }
        }

        return cleared;
    }, {});
}

export { FICTIVE_INC, FICTIVE_SORT, cache, setSuffix, getUnresolvedFieldsTypes, getTypeFields, getInnerType, clear, isListType, isScalarType };