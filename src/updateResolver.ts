import { getGraphQLFilterType } from './graphQLFilterType';
import { getGraphQLUpdateType } from './graphQLUpdateType';
import { getMongoDbFilter, MongoDbFilter } from './mongoDbFilter';
import { getMongoDbUpdate, UpdateObj } from './mongoDbUpdate';
import { validateUpdateArgs } from './mongoDbUpdateValidation';
import { GraphQLNonNull, isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { getMongoDbProjection, MongoDbProjection, GetMongoDbProjectionOptions } from './mongoDbProjection';

export interface UpdateCallback<TSource, TContext> {
    (
        filter: MongoDbFilter,
        update: UpdateObj,
        options: { upsert?: boolean } | undefined,
        projection: MongoDbProjection | undefined,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};


export type UpdateOptions = {
    differentOutputType?: boolean;
    validateUpdateArgs?: boolean;
    overwrite?: boolean;
} & Partial<GetMongoDbProjectionOptions>;

const defaultOptions: Required<UpdateOptions> = {
    differentOutputType: false,
    validateUpdateArgs: false,
    overwrite: false,
    excludedFields: [],
    isResolvedField: undefined
};

export function getMongoDbUpdateResolver<TSource, TContext>(
    graphQLType: GraphQLObjectType,
    updateCallback: UpdateCallback<TSource, TContext>,
    updateOptions?: UpdateOptions): GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbUpdateResolver must recieve a graphql type';
    if (typeof updateCallback !== 'function') throw 'getMongoDbUpdateResolver must recieve an updateCallback';
    const requiredUpdateOptions = { ...defaultOptions, ...updateOptions };

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        if (requiredUpdateOptions.validateUpdateArgs) validateUpdateArgs(args.update, graphQLType, requiredUpdateOptions);
        const mongoUpdate = getMongoDbUpdate(args.update, requiredUpdateOptions.overwrite);
        const projection = requiredUpdateOptions.differentOutputType ? undefined : getMongoDbProjection(info, graphQLType, requiredUpdateOptions);
        return await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, projection, source, args, context, info);
    };
}

export function getGraphQLUpdateArgs(graphQLType: GraphQLObjectType): { [key: string]: { type: GraphQLNonNull<GraphQLInputObjectType> } } & {
    filter: { type: GraphQLNonNull<GraphQLInputObjectType> },
    update: { type: GraphQLNonNull<GraphQLInputObjectType> }
} {
    return {
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) as GraphQLNonNull<GraphQLInputObjectType> },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) as GraphQLNonNull<GraphQLInputObjectType> }
    };
}
