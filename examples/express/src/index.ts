import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import schema from './schema';
import connect from './db';

console.log("GraphQL starting...");

const app = express();

connect().then(db => app
    .use('/', graphqlHTTP({
        schema,
        context: { db },
        graphiql: true
    }))
    .listen(3000, () => {
        console.log('GraphQL listening on 3000')
    }));
