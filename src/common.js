import { isType } from 'graphql'

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

function getTypeFields(graphQLType, filter, typeResolver, ...excludedFields) {
    return () => {
        const typeFields =
            typeof graphQLType._typeConfig.fields === "function"
                ? graphQLType._typeConfig.fields()
                : graphQLType._typeConfig.fields;

        const generatedFields = {};

        Object.keys(typeFields)
            .filter(key => !excludedFields.includes(key))
            .filter(key => filter(key, typeFields[key]))
            .forEach(key => {
                const type = typeResolver(typeFields[key].type);
                if (type) generatedFields[key] = { type: type }
        }); //, ...excludedFields

        return generatedFields;
    };
}

function getUnresolvedFields(graphQLType, typeResolver, ...excludedFields) {
    return getTypeFields(
        graphQLType, 
        (key, field) => !field.resolve,
        typeResolver, 
        ...excludedFields);
}

function getInnerType(graphQLType) {
    let innerType = graphQLType;

    while (innerType.ofType) {
        innerType = innerType.ofType;
    }

    return innerType;
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

export { FICTIVE_INC, FICTIVE_SORT, cache, setSuffix, getUnresolvedFields, getTypeFields, getInnerType, clear };