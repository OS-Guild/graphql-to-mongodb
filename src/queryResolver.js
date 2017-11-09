import getMongoDbFilter from './mongoDbFilter'
import getMongoDbProjection from './mongoDbProjection'
import { getGraphQLFilterType } from './graphQLFilterType'
import getGraphQLSortType from './graphQLSortType'
import GraphQLPaginationType from './graphQLPaginationType'
import { isType } from 'graphql'
import { FICTIVE_SORT, clear } from './common';

function getMongoDbQueryResolver(graphQLType, queryCallback) {
    if (!isType(graphQLType)) throw 'getMongoDbQueryResolver must recieve a graphql type'
    if (typeof queryCallback !== 'function') throw 'getMongoDbQueryResolver must recieve a queryCallback function'

    return async (obj, args, context, metadata) => {
        const filter = getMongoDbFilter(args.filter);
        const projection = getMongoDbProjection(metadata.fieldNodes[0], graphQLType);
        const options = {};
        if (args.sort) options.sort = clear(args.sort, FICTIVE_SORT);
        if (args.pagination && args.pagination.limit) options.limit = args.pagination.limit;
        if (args.pagination && args.pagination.skip) options.skip = args.pagination.skip;

        return await queryCallback(filter, projection, options, obj, args, context, metadata);
    }
}

function getGraphQLQueryArgs(graphQLType) {
    return {
        filter: { type: getGraphQLFilterType(graphQLType) },
        sort: { type: getGraphQLSortType(graphQLType) },
        pagination: { type: GraphQLPaginationType }
    };
}

export { getMongoDbQueryResolver, getGraphQLQueryArgs };