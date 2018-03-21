import { GraphQLInputObjectType, GraphQLList, GraphQLEnumType, GraphQLNonNull, GraphQLScalarType, GraphQLObjectType, GraphQLInputFieldConfigMap, GraphQLInputType, GraphQLFieldMap } from 'graphql';
import { cache, setSuffix, getUnresolvedFieldsTypes, getTypeFields, FieldMap } from './common';
import { warn } from './logger';

const filterTypesCache = {};
const objectFilterTypesCache = {};
const scalarFilterTypesCache = {};
const warnedIndependentResolvers = {};

export const OprType = new GraphQLEnumType({
    name: 'Opr',
    values: {
        EQL: { value: "$eq" },
        GT: { value: "$gt" },
        GTE: { value: "$gte" },
        IN: { value: "$in" },
        LT: { value: "$lt" },
        LTE: { value: "$lte" },
        NE: { value: "$ne" },
        NIN: { value: "$nin" }
    }
});

export const OprExistsType = new GraphQLEnumType({
    name: 'OprExists',
    values: {
        EXISTS: { value: "exists" },
        NOT_EXISTS: { value: "not_exists" },
    }
});

export function getGraphQLFilterType(type: GraphQLObjectType, ...excludedFields: string[]): GraphQLInputObjectType {
    const filterTypeName = setSuffix(type.name, 'Type', 'FilterType');

    return cache(filterTypesCache, filterTypeName, () => new GraphQLInputObjectType({
        name: filterTypeName,
        fields: getOrAndFields(type, ...excludedFields)
    }));
}

function getOrAndFields(type: GraphQLObjectType, ...excludedFields: string[]): () => FieldMap<GraphQLInputType> {
    return () => {
        const generatedFields = getUnresolvedFieldsTypes(type, getGraphQLObjectFilterType, ...excludedFields)();
        warnIndependentResolveFields(type);

        generatedFields['OR'] = { type: new GraphQLList(getGraphQLFilterType(type, ...excludedFields)) };
        generatedFields['AND'] = { type: new GraphQLList(getGraphQLFilterType(type, ...excludedFields)) };

        return generatedFields;
    };
}

function getGraphQLObjectFilterType(
    type: GraphQLScalarType | GraphQLEnumType | GraphQLNonNull<any> | GraphQLObjectType | GraphQLList<any>,
    ...excludedFields: string[]): GraphQLInputType {
    if (type instanceof GraphQLScalarType ||
        type instanceof GraphQLEnumType) {
        return getGraphQLScalarFilterType(type);
    }

    if (type instanceof GraphQLNonNull) {
        return getGraphQLObjectFilterType(type.ofType);
    }

    if (type instanceof GraphQLList) {
        return getGraphQLObjectFilterType(type.ofType);
    }

    const typeName = setSuffix(type.name, 'Type', 'ObjectFilterType');
    return cache(objectFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        fields: getInputObjectTypeFields(type, ...excludedFields)
    }));
}

function getInputObjectTypeFields(type: GraphQLObjectType, ...excludedFields: string[]): () => FieldMap<GraphQLInputType> {
    return () => {
        const generatedFields = getUnresolvedFieldsTypes(type, getGraphQLObjectFilterType, ...excludedFields)();
        warnIndependentResolveFields(type);

        generatedFields['opr'] = { type: OprExistsType };

        return generatedFields;
    };
}

function getGraphQLScalarFilterType(scalarType: GraphQLScalarType | GraphQLEnumType): GraphQLInputObjectType {
    const typeName = scalarType.toString() + "Filter";

    return cache(scalarFilterTypesCache, typeName, () => new GraphQLInputObjectType({
        name: typeName,
        fields: getGraphQLScalarFilterTypeFields(scalarType)
    }));
}

function getGraphQLScalarFilterTypeFields(scalarType: GraphQLScalarType | GraphQLEnumType) {
    return {
        opr: { type: OprType, deprecationReason: 'Switched to the more intuitive operator fields' },
        value: { type: scalarType, deprecationReason: 'Switched to the more intuitive operator fields' },
        values: { type: new GraphQLList(scalarType), deprecationReason: 'Switched to the more intuitive operator fields' },
        EQ: { type: scalarType },
        GT: { type: scalarType },
        GTE: { type: scalarType },
        IN: { type: new GraphQLList(scalarType) },
        LT: { type: scalarType },
        LTE: { type: scalarType },
        NEQ: { type: scalarType },
        NIN: { type: new GraphQLList(scalarType) }
    };
}

function warnIndependentResolveFields(type: GraphQLObjectType): void {
    cache(warnedIndependentResolvers, type.toString(), () => {
        const fields =
            getTypeFields(type, (key, field) =>
                field.resolve && !Array.isArray(field.dependencies))();

        Object.keys(fields).forEach(key =>
            warn(`Field ${key} of type ${type} has a resolve function and no dependencies`));

        return 1;
    });
}

export function clearTypeCache(): void {
    for (var member in filterTypesCache) delete filterTypesCache[member];
    for (var member in objectFilterTypesCache) delete objectFilterTypesCache[member];
    for (var member in scalarFilterTypesCache) delete scalarFilterTypesCache[member];
}