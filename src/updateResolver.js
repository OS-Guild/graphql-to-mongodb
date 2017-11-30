import { getGraphQLFilterType } from './graphQLFilterType'
import { getGraphQLUpdateType } from './graphQLMutationType'
import getMongoDbFilter from './mongoDbFilter'
import getMongoDbUpdate from './mongoDbUpdate'
import { GraphQLNonNull, isType } from 'graphql'
import getMongoDbProjection from './mongoDbProjection'

function getMongoDbUpdateResolver(graphQLType, updateCallback) {
    if (!isType(graphQLType)) throw 'getMongoDbUpdateResolver must recieve a graphql type';
    if (typeof updateCallback !== 'function') throw 'getMongoDbUpdateResolver must recieve an updateCallback';
    
    return async (obj, args, context, metadata) => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        const mongoUpdate = getMongoDbUpdate(args.update);
        const projection = getMongoDbProjection(metadata.fieldNodes, graphQLType);
        return await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, projection, obj, args, context, metadata);
    };
}

function getGraphQLUpdateArgs(graphQLType) {
    return {
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) }
    };
}

export { getMongoDbUpdateResolver, getGraphQLUpdateArgs }