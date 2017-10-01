import { getGraphQLFilterType } from './graphQLFilterType'
import { getGraphQLUpdateType } from './graphQLMutationType'
import getMongoDbFilter from './mongoDbFilter'
import getMongoDbUpdate from './mongoDbUpdate'
import { GraphQLNonNull } from 'graphql'

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
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) }
    };
}

export { getMongoDbUpdateResolver, getGraphQLUpdateArgs }