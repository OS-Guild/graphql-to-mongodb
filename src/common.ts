import { isType, GraphQLList, GraphQLScalarType, GraphQLEnumType, GraphQLType, GraphQLObjectType, GraphQLNonNull, GraphQLInputFieldConfigMap, Thunk, GraphQLFieldMap, GraphQLField, GraphQLArgument, GraphQLFieldResolver, FieldDefinitionNode } from 'graphql'

export const FICTIVE_INC = "FICTIVE_INC";
export const FICTIVE_SORT = "FICTIVE_SORT";

export interface cacheCallback<T> {
    (key): T
}

export function cache<T>(cacheObj: object, key: any, callback: cacheCallback<T>): T {
    let item: T = cacheObj[key];

    if (item === undefined) {
        item = callback(key);
        cacheObj[key] = item;
    }

    return item;
}

export function setSuffix(text: string, locate: string, replaceWith: string): string {
    const regex = new RegExp(`${locate}$`);
    return regex.test(text)
        ? text.replace(regex, replaceWith)
        : `${text}${replaceWith}`;
}

export interface FieldFilter {
    (name: string, field: { resolve?: Function, dependencies?: string[] }): Boolean
}

export interface TypeResolver<T extends GraphQLType> {
    (graphQLType: GraphQLType): T
}

export interface FieldMap<T extends GraphQLType> {
    [key: string]: Field<T, any, any> & { type: T }
}

export interface Field<TType extends GraphQLType,
    TSource,
    TContext,
    TArgs = { [argName: string]: any }
    > {
    name?: string;
    description?: string;
    type: TType;
    args?: GraphQLArgument[];
    resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    isDeprecated?: boolean;
    deprecationReason?: string;
    astNode?: FieldDefinitionNode;
    dependencies?: string[]
}

export function getTypeFields<T extends GraphQLType>(
    graphQLType: GraphQLObjectType,
    filter: FieldFilter = null,
    typeResolver: TypeResolver<T> = (type: T) => type,
    ...excludedFields: string[])
    : () => FieldMap<T> {
    return () => {
        const typeFields = graphQLType.getFields();

        const generatedFields: FieldMap<T> = {};

        Object.keys(typeFields)
            .filter(key => !excludedFields.includes(key))
            .filter(key => !filter || filter(key, typeFields[key]))
            .forEach(key => {
                const field = typeFields[key];
                const type = typeResolver(field.type);
                if (type) generatedFields[key] = { ...field, type: type }
            }); //, ...excludedFields

        return generatedFields;
    };
}

export function getUnresolvedFieldsTypes<T extends GraphQLType>(graphQLType: GraphQLObjectType, typeResolver: TypeResolver<T> = null, ...excludedFields: string[])
    : () => FieldMap<T> {
    return () => {
        const fields = getTypeFields(graphQLType, (key, field) => !field.resolve, typeResolver, ...excludedFields)();
        const fieldsTypes = {};
        Object.keys(fields).forEach(key => fieldsTypes[key] = { type: fields[key].type });
        return fieldsTypes;
    };
}

export function getInnerType(graphQLType: GraphQLType): GraphQLType {
    let innerType = graphQLType;

    while (innerType instanceof GraphQLList
        || innerType instanceof GraphQLNonNull) {
        innerType = innerType.ofType;
    }

    return innerType;
}

export function isListType(graphQLType: GraphQLType): boolean {
    let innerType = graphQLType;

    while (innerType instanceof GraphQLList
        || innerType instanceof GraphQLNonNull) {
        if (innerType instanceof GraphQLList) return true;
        innerType = innerType.ofType;
    }

    return false;
}

export function isScalarType(graphQLType: GraphQLType): boolean {
    return graphQLType instanceof GraphQLScalarType || graphQLType instanceof GraphQLEnumType;
}

export function clear(obj: object, ...excludedKeys: string[]): object {
    if (Array.isArray(obj)) {
        return obj.map(value => clear(value, ...excludedKeys));
    }

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

export function flatten<T>(nestedArray: T[][]) : T[] {
    return nestedArray.reduce((agg, b) => agg.concat(b), []);
}