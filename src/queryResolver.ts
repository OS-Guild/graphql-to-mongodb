import { getMongoDbFilter, MongoDbFilter } from './mongoDbFilter';
import { getMongoDbProjection, MongoDbProjection, GetMongoDbProjectionOptions } from './mongoDbProjection';
import { getGraphQLFilterType } from './graphQLFilterType';
import { getGraphQLSortType } from './graphQLSortType';
import GraphQLPaginationType from './graphQLPaginationType';
import getMongoDbSort, { MongoDbSort } from "./mongoDbSort";
import { isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLInputObjectType, GraphQLField } from 'graphql';
import { GraphQLFieldsType } from './common';

export interface QueryCallback<TSource, TContext> {
    (
        filter: MongoDbFilter,
        projection: MongoDbProjection,
        options: MongoDbOptions,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};

export interface MongoDbOptions {
    sort?: MongoDbSort;
    limit?: number;
    skip?: number;
    projection?: MongoDbProjection;
}

export type QueryOptions = {
    differentOutputType?: boolean;
} & Partial<GetMongoDbProjectionOptions>;

const defaultOptions: Required<QueryOptions> = {
    differentOutputType: false,
    excludedFields: [],
    isResolvedField: (field: GraphQLField<any, any>) => !!field.resolve
};

export function getMongoDbQueryResolver<TSource, TContext>(
    graphQLType: GraphQLFieldsType,
    queryCallback: QueryCallback<TSource, TContext>,
    queryOptions?: QueryOptions): GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbQueryResolver must recieve a graphql type';
    if (typeof queryCallback !== 'function') throw 'getMongoDbQueryResolver must recieve a queryCallback function';
    const requiredQueryOptions = { ...defaultOptions, ...queryOptions };

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        const projection = requiredQueryOptions.differentOutputType ? undefined : getMongoDbProjection(info, graphQLType, requiredQueryOptions);
        const options: MongoDbOptions = { projection };
        if (args.sort) options.sort = getMongoDbSort(args.sort);
        if (args.pagination && args.pagination.limit) options.limit = args.pagination.limit;
        if (args.pagination && args.pagination.skip) options.skip = args.pagination.skip;

        return await queryCallback(filter, projection, options, source, args, context, info);
    }
}

export function getGraphQLQueryArgs(graphQLType: GraphQLFieldsType): { [key: string]: { type: GraphQLInputObjectType } } & {
    filter: { type: GraphQLInputObjectType },
    sort: { type: GraphQLInputObjectType },
    pagination: { type: GraphQLInputObjectType }
} {
    return {
        filter: { type: getGraphQLFilterType(graphQLType) },
        sort: { type: getGraphQLSortType(graphQLType) },
        pagination: { type: GraphQLPaginationType }
    };
}
