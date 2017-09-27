import getMongoDbFilter from './mongoDbFilter'
import getMongoDbProjection from './mongoDbProjection'
import { getGraphQLFilterType } from './graphQLFilterType'
import getGraphQLSortType from './graphQLSortType'
import GraphQLPaginationType from './graphQLPaginationType'

function getMongoDbQueryResolver(graphQLType, typeResolveDependencies, queryCallback, internalLimit = 1000) {
    return async (obj, args, context, metadata) => {
        const filter = getMongoDbFilter(args.filter);
        const projection = getMongoDbProjection(metadata.fieldNodes[0], graphQLType, typeResolveDependencies);
        const options = {};
        if (args.sort) options.sort = args.sort;
        if (args.pagination && args.pagination.limit) options.limit = args.pagination.limit;

        if (args.pagination && args.pagination.internal) {
            if (!options.limit) options.limit = internalLimit;
            options.skip = 0;
            let total = [];

            let page = await queryCallback(filter, projection, options, obj, args, context, metadata);

            while (page.length == options.limit)
            {
                total = total.concat(page);
                options.skip += options.limit;
                page = await queryCallback(filter, projection, options, obj, args, context, metadata);
            }

            total = total.concat(page);

            return total;
        } else {
            if (args.pagination.skip) options.skip = args.pagination.skip;

            return await queryCallback(filter, projection, options, obj, args, context, metadata);
        }
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