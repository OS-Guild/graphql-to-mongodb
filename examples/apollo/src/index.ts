import * as express from 'express';
import createApolloSchema from './SolutionA/makeExecutableSchema';
import { resolvers, types } from './schema';
import connect from './db';
import { ApolloServer } from 'apollo-server-express';

console.log("GraphQL starting...");

connect().then(db => {
    const apolloServer = new ApolloServer({
        schema: createApolloSchema({ typeDefs: types, resolvers: resolvers as any }),
        introspection: true,
        context: { db }
    });

    const app = express();

    apolloServer.applyMiddleware({ app, path: '/' });

    app.listen(3000, () => {
        console.log('GraphQL listening on 3000')
    });
})
