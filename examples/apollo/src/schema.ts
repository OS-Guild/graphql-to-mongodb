import { Db } from "mongodb";
import { gql } from "apollo-server-core";

export const types = gql`
type Name {
    first: String
    last: String
}

type Person {
    age: Int
    name: Name!
    fullName: String @mongoDependencies(paths: ["name"])
}

type Query {
    people: [Person] @mongoQueryArgs(type: "Person") @mongoQueryResolver(type: "Person")
}

type Mutation {
    updatePeople: Int @mongoUpdateArgs(type: "Person") @mongoUpdateResolver(type: "Person", updateOptions: { differentOutputType: true, validateUpdateArgs: true })
    insertPerson: String @mongoInsertArgs(type: "Person", key: "input")
    deletePeople: String @mongoFilterArgs(type: "Person", key: "filter") @mongoFilterResolver(type: "Person", key: "filter")
    clear: Int
}
`

export const resolvers = {
    Person: {
        fullName: (source) => {
            return [source.name.first, source.name.last].filter(_ => !!_).join(' ');
        }
    },
    Query: {
        people: async (filter, projection, options, obj, args, { db }: { db: Db }) =>
            await db.collection('people').find(filter, options).toArray()
    },
    Mutation: {
        updatePeople: async (filter, update, options: {}, projection, obj, args, { db }: { db: Db }) => {
            const result = await db.collection('people').updateMany(filter, update, options);
            return result.modifiedCount;
        },
        insertPerson: async (obj, args, { db }: { db: Db }) => {
            const result = await db.collection('people').insertOne(args.input);
            return JSON.stringify(result);
        },
        deletePeople: async (filter, obj, args, { db }: { db: Db }) => {
            const result = await db.collection('people').deleteMany(filter)
            return result.deletedCount;
        },
        clear: async (obj, args, { db }: { db: Db }) => {
            const result = await db.collection('people').deleteMany({})
            return result.deletedCount;
        }
    }
}
