import { gql, IExecutableSchemaDefinition, IResolvers, makeExecutableSchema } from "apollo-server-express";
import {
    GraphQLEnumValue,
    GraphQLInputObjectType,
    GraphQLInputType,
    GraphQLNamedType,
    GraphQLSchema,
    isEnumType,
    isInputObjectType,
    isListType,
    isNonNullType,
    printType
} from "graphql";
import { clearTypesCache, getTypesCache, GraphQLPaginationType, GraphQLSortType } from "graphql-to-mongodb";
import { MongoDirectivesContext, types as directiveTypes, visitors } from "./directives";

export default function <TContext>(config: IExecutableSchemaDefinition<TContext>): GraphQLSchema {
    config.resolvers = config.resolvers || {};

    clearTypesCache();
    MongoDirectivesContext.stage = "First";

    const configTypeDefs = Array.isArray(config.typeDefs) ? config.typeDefs : [config.typeDefs];

    makeExecutableSchema({
        ...config,
        typeDefs: [...configTypeDefs, directiveTypes],
        schemaDirectives: { ...config.schemaDirectives, ...visitors }
    });

    let typesCache = getTypesCache();
    resolveLazyFields(Object.keys(typesCache).map(_ => typesCache[_]).filter(isInputObjectType));
    typesCache = getTypesCache();
    typesCache[GraphQLPaginationType.name] = GraphQLPaginationType;
    typesCache[GraphQLSortType.name] = GraphQLSortType;
    const typesSdlRaw = Object
        .keys(typesCache)
        .map(key => printType(typesCache[key]))
        .join("\n");

    const typesSdl = gql(typesSdlRaw);

    const cachedTypeKeys: string[] = Object.keys(typesCache);

    for (const key of cachedTypeKeys) {
        const enumType = typesCache[key];

        if (!isEnumType(enumType)) {
            continue;
        }

        config.resolvers[key] = enumType.getValues().reduce((resolver: IResolvers, value: GraphQLEnumValue) => {
            resolver[value.name] = value.value;
            return resolver;
        }, {});
    }

    MongoDirectivesContext.stage = "Second";

    const stageTwoSchema = makeExecutableSchema({
        ...config,
        typeDefs: [...configTypeDefs, typesSdl, directiveTypes],
        schemaDirectives: { ...config.schemaDirectives, ...visitors }
    });

    return stageTwoSchema;
}

function resolveLazyFields(types: GraphQLInputObjectType[]) {
    types.forEach(type => {
        const typesCache = getTypesCache();
        const fields = type.getFields();
        resolveLazyFields(Object
            .keys(fields)
            .map(key => innerType(fields[key].type))
            .filter(isInputObjectType)
            .filter(_ => !typesCache[_.name]));
    });
}

function innerType(type: GraphQLInputType): GraphQLInputType & GraphQLNamedType {
    if (isNonNullType(type) || isListType(type)) {
        return innerType(type.ofType);
    }
    return type;
}
