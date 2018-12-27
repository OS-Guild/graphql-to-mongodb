import * as express from 'express';
import makeExecutableSchema from './SolutionA/makeExecutableSchema';
import { resolvers, types } from './schema';
import connect from './db';
import * as graphqlHTTP from 'express-graphql';

console.log("GraphQL starting...");

const app = express();

connect().then(db => app
    .use('/', graphqlHTTP({
        schema: makeExecutableSchema({ typeDefs: types, resolvers: resolvers as any }),
        context: { db },
        graphiql: true
    }))
    .listen(3000, () => {
        console.log('GraphQL listening on 3000')
    }));