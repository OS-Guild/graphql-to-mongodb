import getMongoDbFilter from './mongoDbFilter';
import getMongoDbProjection from './mongoDbProjection';
import { getGraphQLFilterType } from './graphQLFilterType';
import getGraphQLSortType from './graphQLSortType';
import GraphQLPaginationType from './graphQLPaginationType';
import { isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLObjectType } from 'graphql';
import { FICTIVE_SORT, clear } from './common';

export interface QueryCallback<TSource, TContext> {
    (
        filter: object,
        projection: object,
        options: object,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};

export interface QueryOptions {
    differentOutputType: boolean
};

const defaultOptions: QueryOptions = {
    differentOutputType: false
};

export function getMongoDbQueryResolver<TSource, TContext>(graphQLType: GraphQLObjectType, queryCallback: QueryCallback<TSource, TContext>, queryOptions: QueryOptions = defaultOptions)
    : GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbQueryResolver must recieve a graphql type'
    if (typeof queryCallback !== 'function') throw 'getMongoDbQueryResolver must recieve a queryCallback function'

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        let projection = queryOptions.differentOutputType ? null : getMongoDbProjection(info.fieldNodes, graphQLType);
        const options: { sort?: object, limit?: number, skip?: number } = {};
        if (args.sort) options.sort = clear(args.sort, FICTIVE_SORT);
        if (args.pagination && args.pagination.limit) options.limit = args.pagination.limit;
        if (args.pagination && args.pagination.skip) options.skip = args.pagination.skip;

        return await queryCallback(filter, projection, options, source, args, context, info);
    }
}

export function getGraphQLQueryArgs(graphQLType: GraphQLObjectType): object {
    return {
        filter: { type: getGraphQLFilterType(graphQLType) },
        sort: { type: getGraphQLSortType(graphQLType) },
        pagination: { type: GraphQLPaginationType }
    };
}