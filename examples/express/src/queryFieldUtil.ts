import { GraphQLObjectType, GraphQLList } from "graphql";
import { getGraphQLQueryArgs, getMongoDbQueryResolver } from "graphql-to-mongodb";
import { Collection, Db } from "mongodb";

export const getMongoDbQueryField1 = (type: GraphQLObjectType, collectionName: string) => ({
    type: new GraphQLList(type),
    args: getGraphQLQueryArgs(type) as any,
    resolve: getMongoDbQueryResolver(type,
        async (filter, projection, options, obj, args, { db }: { db: Db }) => {
            return await db.collection(collectionName).find(filter, { ...options, projection }).toArray();
        })
})

export const getMongoDbQueryField2 = (type: GraphQLObjectType, getCollection: (context: any) => Collection) => ({
    type: new GraphQLList(type),
    args: getGraphQLQueryArgs(type) as any,
    resolve: getMongoDbQueryResolver(type,
        async (filter, projection, options, obj, args, context) => {
            return await getCollection(context).find(filter, { ...options, projection }).toArray();
        })
})