import { getGraphQLFilterType } from './graphQLFilterType'
import { getGraphQLUpdateType } from './graphQLMutationType'
import getMongoDbFilter from './mongoDbFilter'
import getMongoDbUpdate from './mongoDbUpdate'
import { GraphQLNonNull } from 'graphql'

function getMongoDbUpdateResolver(updateCallback, queryCallback) {
    if (!updateCallback) throw 'getMongoDbQueryResolver must recieve an updateCallback'
    
    return async (obj, args, context, metadata) => {
        const filter = getMongoDbFilter(args.filter);
        const mongoUpdate = getMongoDbUpdate(args.update)
        const updateResult = await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, obj, args, context, metadata);
        return queryCallback ? await queryCallback(filter, obj, args, context, metadata) : updateResult;
    };
}

function getGraphQLUpdateArgs(graphQLType) {
    return {
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) }
    };
}

export { getMongoDbUpdateResolver, getGraphQLUpdateArgs }