import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLList, GraphQLSchema } from "graphql";
import { getGraphQLQueryArgs, getMongoDbQueryResolver, getGraphQLUpdateArgs, getMongoDbUpdateResolver, getGraphQLInsertType } from "graphql-to-mongodb";
import { Db } from "mongodb";

const PersonType = new GraphQLObjectType({
    name: 'PersonType',
    fields: () => ({
        age: { type: GraphQLInt },
        name: {
            type: new GraphQLNonNull(new GraphQLObjectType({
                name: 'NameType',
                fields: () => ({
                    first: { type: GraphQLString },
                    last: { type: GraphQLString }
                })
            }))
        },
        fullName: {
            type: GraphQLString,
            resolve: (source) => `${source.name.first} ${source.name.last}`,
            dependencies: ['name']
        }
    })
})

const QueryType = new GraphQLObjectType({
    name: 'QueryType',
    fields: () => ({
        people: {
            type: new GraphQLList(PersonType),
            args: getGraphQLQueryArgs(PersonType) as any,
            resolve: getMongoDbQueryResolver(PersonType,
                async (filter, projection, options, obj, args, { db }: { db: Db }) => {
                    return await db.collection('people').find(filter, { ...options, projection }).toArray();
                })
        }
    })
})



const MutationTyoe = new GraphQLObjectType({
    name: 'MutationTyoe',
    fields: () => ({
        updatePeople: {
            type: GraphQLInt,
            args: getGraphQLUpdateArgs(PersonType) as any,
            resolve: getMongoDbUpdateResolver(PersonType,
                async (filter, update, options, projection, obj, args, { db }: { db: Db }) => {
                    const result = await db.collection('people').updateMany(filter, update, options);
                    return result.modifiedCount;
                }, {
                    differentOutputType: true,
                    validateUpdateArgs: true
                })
        },
        insertPerson: {
            type: GraphQLString,
            args: { input: { type: getGraphQLInsertType(PersonType) } },
            resolve: async (obj, args, { db }: { db: Db }) => {
                const result = await db.collection('people').insert(args.input);
                return JSON.stringify(result);
            }
        },
        clear: {
            type: GraphQLInt,
            resolve: async (obj, args, { db }: { db: Db }) => {
                const result = await db.collection('people').deleteMany({})
                return result.deletedCount;
            }
        }
    })
})

const Schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationTyoe
})

export default Schema;