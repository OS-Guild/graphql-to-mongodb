import { getGraphQLFilterType } from './graphQLFilterType'
import { getGraphQLUpdateType } from './graphQLMutationType'
import getMongoDbFilter from './mongoDbFilter'
import getMongoDbUpdate from './mongoDbUpdate'

function getMongoDbUpdateResolver(updateCallback, queryCallback) {
    return async (obj, args, context, metadata) => {
        const filter = getMongoDbFilter(args.filter);
        const mongoUpdate = getMongoDbUpdate(args.update)
        await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, obj, args, context, metadata);
        return queryCallback ? await queryCallback(filter, obj, args, context, metadata) : undefined;
    };
}

function getGraphQLUpdateArgs(graphQLType) {
    return {
        filter: { type: getGraphQLFilterType(graphQLType) },
        update: { type: getGraphQLUpdateType(graphQLType) }
    };
}

export { getMongoDbUpdateResolver, getGraphQLUpdateArgs }