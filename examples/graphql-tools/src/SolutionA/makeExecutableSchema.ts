import { GraphQLSchema, GraphQLNamedType, GraphQLInputObjectType, GraphQLInputType, isInputObjectType, isNonNullType, isListType } from "graphql";
import { visitors, types as directiveTypes, MongoDirectivesContext } from "./directives";
import { getTypesCache, clearTypesCache, GraphQLPaginationType, GraphQLSortType } from "graphql-to-mongodb";
import { printType } from "graphql";
import { makeExecutableSchema, IExecutableSchemaDefinition } from "graphql-tools"

export default function <TContext>(config: IExecutableSchemaDefinition<TContext>): GraphQLSchema {
    clearTypesCache();
    MongoDirectivesContext.stage = "First";

    const configTypeDefs = Array.isArray(config.typeDefs) ? config.typeDefs : [config.typeDefs];
    
    makeExecutableSchema({
        ...config,
        typeDefs: [...configTypeDefs, directiveTypes],
        schemaDirectives: { ...config.schemaDirectives, ...visitors }
    })

    let typesCache = getTypesCache();
    resolveLazyFields(Object.keys(typesCache).map(_ => typesCache[_]).filter(isInputObjectType))
    typesCache = getTypesCache();
    typesCache[GraphQLPaginationType.name] = GraphQLPaginationType;
    typesCache[GraphQLSortType.name] = GraphQLSortType;
    const typesSdlRaw = Object
        .keys(typesCache)
        .map(key => printType(typesCache[key]))
        .join("\n");

    MongoDirectivesContext.stage = "Second";
    const stageTwoSchema = makeExecutableSchema({
        ...config,
        typeDefs: [...configTypeDefs, typesSdlRaw, directiveTypes],
        schemaDirectives: { ...config.schemaDirectives, ...visitors }
    })

    
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
            .filter(_ => !typesCache[_.name]))
    });
}

function innerType(type: GraphQLInputType): GraphQLInputType & GraphQLNamedType {
    if (isNonNullType(type) || isListType(type)) 
        return innerType(type.ofType);
    return type;
}