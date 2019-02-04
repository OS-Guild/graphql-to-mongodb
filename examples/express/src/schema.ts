import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLNonNull, GraphQLList, GraphQLSchema } from "graphql";
import { getGraphQLQueryArgs, getMongoDbQueryResolver, getGraphQLUpdateArgs, getMongoDbUpdateResolver, getGraphQLInsertType, getGraphQLFilterType, getMongoDbFilter } from "graphql-to-mongodb";
import { Db } from "mongodb";
import { getMongoDbQueryField1, getMongoDbQueryField2 } from "./queryFieldUtil";

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
            resolve: (source) => [source.name.first, source.name.last].filter(_ => !!_).join(' '),
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
        },
        people1: getMongoDbQueryField1(PersonType, 'people'),
        people2: getMongoDbQueryField2(PersonType, ({ db }: { db: Db }) => db.collection('people')),
    })
})



const MutationType = new GraphQLObjectType({
    name: 'MutationType',
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
                const result = await db.collection('people').insertOne(args.input);
                return JSON.stringify(result);
            }
        },
        deletePeople: {
            type: GraphQLInt,
            args: { filter: { type: new GraphQLNonNull(getGraphQLFilterType(PersonType)) } },
            resolve: async (obj, args, { db }: { db: Db }) => {
                const filter = getMongoDbFilter(PersonType, args.filter);
                const result = await db.collection('people').deleteMany(filter)
                return result.deletedCount;
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
    mutation: MutationType
})

export default Schema;
