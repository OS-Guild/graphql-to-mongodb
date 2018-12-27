import { GraphQLSchema, GraphQLNamedType, GraphQLInputObjectType, GraphQLInputType, isInputObjectType, isNonNullType, isListType } from "graphql";
import { makeExecutableSchema, IExecutableSchemaDefinition } from "graphql-tools"
import { visitors, types as directiveTypes } from "./directives";
import { getTypesCache, clearTypesCache, GraphQLPaginationType, GraphQLSortType } from "graphql-to-mongodb";

export default function <TContext>(config: IExecutableSchemaDefinition<TContext>): GraphQLSchema {
    clearTypesCache();
    
    const configTypeDefs = Array.isArray(config.typeDefs) ? config.typeDefs : [config.typeDefs];
    
    const schema = makeExecutableSchema({
        ...config,
        typeDefs: [...configTypeDefs, directiveTypes],
        schemaDirectives: { ...config.schemaDirectives, ...visitors }
    })

    let typesCache = getTypesCache();
    resolveLazyFields(Object.keys(typesCache).map(_ => typesCache[_]).filter(isInputObjectType))
    typesCache = getTypesCache();
    typesCache[GraphQLPaginationType.name] = GraphQLPaginationType;
    typesCache[GraphQLSortType.name] = GraphQLSortType;
    
    const getTypeMap = schema.getTypeMap;
    schema.getTypeMap = (() => ({ ...getTypeMap.apply(schema), ...typesCache })).bind(schema);
    
    // OR (schema as any)._typeMap = { ...(schema as any)._typeMap, ...typesCache }
    
    return schema;
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