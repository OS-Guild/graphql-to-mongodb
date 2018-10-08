import getMongoDbFilter from './mongoDbFilter';
import { getMongoDbProjection, MongoDbProjection } from './mongoDbProjection';
import { getGraphQLFilterType } from './graphQLFilterType';
import getGraphQLSortType from './graphQLSortType';
import GraphQLPaginationType from './graphQLPaginationType';
import getMongoDbSort, { MongoDbSort } from "./mongoDbSort";
import { isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLObjectType } from 'graphql';

export interface QueryCallback<TSource, TContext> {
    (
        filter: object,
        projection: MongoDbProjection,
        options: MongoDbOptions,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};

export interface QueryOptions {
    differentOutputType: boolean;
};

export interface MongoDbOptions {
    sort?: MongoDbSort;
    limit?: number;
    skip?: number;
    projection?: MongoDbProjection;
}

const defaultOptions: QueryOptions = {
    differentOutputType: false
};

export function getMongoDbQueryResolver<TSource, TContext>(
    graphQLType: GraphQLObjectType,
    queryCallback: QueryCallback<TSource, TContext>,
    queryOptions: QueryOptions = defaultOptions): GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbQueryResolver must recieve a graphql type'
    if (typeof queryCallback !== 'function') throw 'getMongoDbQueryResolver must recieve a queryCallback function'

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        const projection = queryOptions.differentOutputType ? undefined : getMongoDbProjection(info, graphQLType);
        const options: MongoDbOptions = {};
        if (args.sort) options.sort = getMongoDbSort(args.sort);
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