import { UpdateArgs } from "./mongoDbUpdate";
import { GraphQLObjectType, GraphQLType, GraphQLNonNull, GraphQLList, GraphQLFieldMap, GraphQLField, GraphQLError } from "graphql";
import { isNonNullField, getInnerType, flatten, isListField } from "./common";
import { OVERWRITE } from "./graphQLUpdateType";

export interface UpdateField {
    [key: string]: UpdateField | UpdateField[] | 1
}

export enum ShouldAssert {
    DefaultTrueRoot,
    True,
    False
}

export interface ValidateUpdateArgsOptions {
    overwrite: boolean;
    isResolvedField?: (field: GraphQLField<any, any>) => boolean;
}

const defaultOptions: ValidateUpdateArgsOptions = {
    overwrite: false,
};

export function validateUpdateArgs(updateArgs: UpdateArgs, graphQLType: GraphQLObjectType, options: ValidateUpdateArgsOptions = defaultOptions): void {
    let errors: string[] = [];

    errors = errors.concat(validateNonNullableFieldsOuter(updateArgs, graphQLType, options));

    if (errors.length > 0) {
        throw new GraphQLError(errors.join("\n"));
    }
}

function validateNonNullableFieldsOuter(
    updateArgs: UpdateArgs,
    graphQLType: GraphQLObjectType,
    { overwrite, isResolvedField }: ValidateUpdateArgsOptions): string[] {
    const shouldAssert: ShouldAssert = !!updateArgs.setOnInsert
        ? ShouldAssert.True
        : overwrite
            ? ShouldAssert.DefaultTrueRoot
            : ShouldAssert.False;

    return validateNonNullableFields(Object.keys(updateArgs).map(_ => updateArgs[_]), graphQLType, shouldAssert, isResolvedField);
}

export function validateNonNullableFields(
    objects: object[],
    graphQLType: GraphQLObjectType,
    shouldAssert: ShouldAssert,
    isResolvedField: ((field: GraphQLField<any, any>) => boolean) = (field: GraphQLField<any, any>) => !!field.resolve,
    path: string[] = []): string[] {
    const typeFields = graphQLType.getFields();

    const errors: string[] = shouldAssert === ShouldAssert.True ? validateNonNullableFieldsAssert(objects, typeFields, path) : [];

    const overwrite = objects.map(_ => _[OVERWRITE]).filter(_ => _)[0];
    shouldAssert = getShouldAssert(shouldAssert, overwrite);

    return [...errors, ...validateNonNullableFieldsTraverse(objects, typeFields, shouldAssert, isResolvedField, path)];
}

export function validateNonNullableFieldsAssert(objects: object[], typeFields: GraphQLFieldMap<any, any>, path: string[] = []): string[] {
    return Object
        .keys(typeFields)
        .map(key => ({ key, type: typeFields[key].type }))
        .filter(field => isNonNullField(field.type) && (field.key !== '_id' || path.length > 0))
        .reduce((agg, field) => {
            let fieldPath = [...path, field.key].join(".");
            const fieldValues = objects.map(_ => _[field.key]).filter(_ => _ !== undefined);
            if (field.type instanceof GraphQLNonNull) {
                if (fieldValues.some(_ => _ === null))
                    return [...agg, `Non-nullable field "${fieldPath}" is set to null`];
                if (fieldValues.length === 0)
                    return [...agg, `Missing non-nullable field "${fieldPath}"`];
            }
            if (isListField(field.type) && !validateNonNullListField(fieldValues, field.type)) {
                return [...agg, `Non-nullable element of array "${fieldPath}" is set to null`];
            }

            return agg;
        }, []);
}

export function validateNonNullListField(fieldValues: object[], type: GraphQLType): boolean {
    if (type instanceof GraphQLNonNull) {
        if (fieldValues.some(_ => _ === null)) {
            return false;
        }

        return validateNonNullListField(fieldValues, type.ofType);
    }

    if (type instanceof GraphQLList) {
        return validateNonNullListField(flatten(fieldValues.filter(_ => _) as object[][]), type.ofType);
    }

    return true;
}

export function getShouldAssert(current: ShouldAssert, input?: boolean): ShouldAssert {
    if (current === ShouldAssert.True) {
        return ShouldAssert.True;
    }

    if (typeof input !== "undefined") {
        return input ? ShouldAssert.True : ShouldAssert.False;
    }

    if (current === ShouldAssert.DefaultTrueRoot) {
        return ShouldAssert.True;
    }

    return current;
}

export function validateNonNullableFieldsTraverse(
    objects: object[],
    typeFields: GraphQLFieldMap<any, any>,
    shouldAssert: ShouldAssert,
    isResolvedField: (field: GraphQLField<any, any>) => boolean = (field: GraphQLField<any, any>) => !!field.resolve,
    path: string[] = []): string[] {
    let keys: string[] = Array.from(new Set(flatten(objects.map(_ => Object.keys(_)))));

    return keys.reduce((agg, key) => {
        const field = typeFields[key];
        const type = field.type;
        const innerType = getInnerType(type);

        if (!(innerType instanceof GraphQLObjectType) || isResolvedField(field)) {
            return agg;
        }

        const newPath = [...path, key];
        const values = objects.map(_ => _[key]).filter(_ => _);

        if (isListField(type)) {
            return [...agg, ...flatten(flattenListField(values, type).map(_ => validateNonNullableFields([_], innerType, ShouldAssert.True, isResolvedField, newPath)))];
        } else {
            return [...agg, ...validateNonNullableFields(values, innerType, shouldAssert, isResolvedField, newPath)];
        }
    }, []);
}

export function flattenListField(objects: object[], type: GraphQLType): object[] {
    if (type instanceof GraphQLNonNull) {
        return flattenListField(objects, type.ofType);
    }

    if (type instanceof GraphQLList) {
        return flattenListField(flatten(objects as object[][]).filter(_ => _), type.ofType);
    }

    return objects;
}
