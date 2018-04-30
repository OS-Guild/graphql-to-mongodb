import { getGraphQLFilterType } from './graphQLFilterType';
import { getGraphQLUpdateType } from './graphQLMutationType';
import getMongoDbFilter from './mongoDbFilter';
import getMongoDbUpdate from './mongoDbUpdate';
import { GraphQLNonNull, isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLObjectType } from 'graphql';
import getMongoDbProjection from './mongoDbProjection';

export interface UpdateCallback<TSource, TContext> {
    (
        filter: object,
        update: object,
        options: object,
        projection: object,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};

export interface UpdateOptions {
    differentOutputType: boolean
};

const defaultOptions: UpdateOptions = {
    differentOutputType: false
};

export function getMongoDbUpdateResolver<TSource, TContext>(graphQLType: GraphQLObjectType, updateCallback: UpdateCallback<TSource, TContext>, updateOptions: UpdateOptions = defaultOptions)
    : GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbUpdateResolver must recieve a graphql type';
    if (typeof updateCallback !== 'function') throw 'getMongoDbUpdateResolver must recieve an updateCallback';

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        const mongoUpdate = getMongoDbUpdate(args.update);
        let projection = updateOptions.differentOutputType ? null : getMongoDbProjection(info.fieldNodes, graphQLType);
        return await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, projection, source, args, context, info);
    };
}

export function getGraphQLUpdateArgs(graphQLType: GraphQLObjectType): object {
    return {
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) }
    };
}