import { UpdateArgs } from "./mongoDbUpdate";
import { GraphQLObjectType, GraphQLType, GraphQLNonNull, GraphQLList, GraphQLFieldMap, GraphQLError } from "graphql";
import { isNonNullType, getInnerType, flatten, isListType } from "./common";
import { OVERWRITE } from "./graphQLUpdateType";

export interface UpdateField {
    [key: string]: UpdateField | UpdateField[] | 1
}

export enum ShouldAssert {
    DefaultTrueRoot,
    True,
    False
}

export function validateUpdateArgs(updateArgs: UpdateArgs, graphQLType: GraphQLObjectType, overwrite: boolean): void {
    let errors: string[] = [];

    errors = errors.concat(validateNonNullableFieldsOuter(updateArgs, overwrite, graphQLType));

    if (errors.length > 0) {
        throw new GraphQLError(errors.join("\n"));
    }
}

function validateNonNullableFieldsOuter(updateArgs: UpdateArgs, overwrite: boolean, graphQLType: GraphQLObjectType): string[] {
    const shouldAssert: ShouldAssert = !!updateArgs.setOnInsert
        ? ShouldAssert.True
        : overwrite
            ? ShouldAssert.DefaultTrueRoot
            : ShouldAssert.False;

    return validateNonNullableFields(Object.keys(updateArgs).map(_ => updateArgs[_]), graphQLType, shouldAssert);
}

export function validateNonNullableFields(objects: object[], graphQLType: GraphQLObjectType, shouldAssert: ShouldAssert, path: string[] = []): string[] {
    const typeFields = graphQLType.getFields();

    const errors: string[] = shouldAssert === ShouldAssert.True ? validateNonNullableFieldsAssert(objects, typeFields, path) : [];

    const overwrite = objects.map(_ => _[OVERWRITE]).filter(_ => _)[0];
    shouldAssert = getShouldAssert(shouldAssert, overwrite);

    return [...errors, ...validateNonNullableFieldsTraverse(objects, typeFields, shouldAssert, path)];
}

export function validateNonNullableFieldsAssert(objects: object[], typeFields: GraphQLFieldMap<any, any>, path: string[] = []): string[] {
    return Object
        .keys(typeFields)
        .map(key => ({ key, type: typeFields[key].type }))
        .filter(field => isNonNullType(field.type))
        .reduce((agg, field) => {
            let fieldPath = [...path, field.key].join(".");
            const fieldValues = objects.map(_ => _[field.key]).filter(_ => _ !== undefined);
            if (field.type instanceof GraphQLNonNull) {
                if (fieldValues.some(_ => _ === null))
                    return [...agg, `Non-nullable field "${fieldPath}" is set to null`];
                if (fieldValues.length === 0)
                    return [...agg, `Missing non-nullable field "${fieldPath}"`];
            }
            if (isListType(field.type) && !validateNonNullListField(fieldValues, field.type)) {
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

export function validateNonNullableFieldsTraverse(objects: object[], typeFields: GraphQLFieldMap<any, any>, shouldAssert: ShouldAssert, path: string[] = []): string[] {
    let keys: string[] = Array.from(new Set(flatten(objects.map(_ => Object.keys(_)))));

    return keys.reduce((agg, key) => {
        const field = typeFields[key];
        const type = field.type;
        const innerType = getInnerType(type);

        if (!(innerType instanceof GraphQLObjectType) || field.resolve) {
            return agg;
        }

        const newPath = [...path, key];
        const values = objects.map(_ => _[key]).filter(_ => _);

        if (isListType(type)) {
            return [...agg, ...flatten(flattenListField(values, type).map(_ => validateNonNullableFields([_], innerType, ShouldAssert.True, newPath)))];
        } else {
            return [...agg, ...validateNonNullableFields(values, innerType, shouldAssert, newPath)];
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