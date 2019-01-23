import { getGraphQLFilterType } from './graphQLFilterType';
import { getGraphQLUpdateType } from './graphQLUpdateType';
import getMongoDbFilter from './mongoDbFilter';
import { getMongoDbUpdate } from './mongoDbUpdate';
import { validateUpdateArgs } from './mongoDbUpdateValidation';
import { GraphQLNonNull, isType, GraphQLResolveInfo, GraphQLFieldResolver, GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { getMongoDbProjection, MongoDbProjection } from './mongoDbProjection';

export interface UpdateCallback<TSource, TContext> {
    (
        filter: object,
        update: object,
        options: object,
        projection: MongoDbProjection | undefined,
        source: TSource,
        args: { [argName: string]: any },
        context: TContext,
        info: GraphQLResolveInfo
    ): Promise<any>
};

export interface UpdateOptions {
    differentOutputType?: boolean;
    validateUpdateArgs?: boolean;
    overwrite?: boolean;
};

const defaultOptions: Required<UpdateOptions> = {
    differentOutputType: false,
    validateUpdateArgs: false,
    overwrite: false
};

export function getMongoDbUpdateResolver<TSource, TContext>(
    graphQLType: GraphQLObjectType,
    updateCallback: UpdateCallback<TSource, TContext>,
    updateOptions?: UpdateOptions): GraphQLFieldResolver<TSource, TContext> {
    if (!isType(graphQLType)) throw 'getMongoDbUpdateResolver must recieve a graphql type';
    if (typeof updateCallback !== 'function') throw 'getMongoDbUpdateResolver must recieve an updateCallback';
    const requiredUpdateOptions: Required<UpdateOptions> = { ...defaultOptions, ...updateOptions };

    return async (source: TSource, args: { [argName: string]: any }, context: TContext, info: GraphQLResolveInfo): Promise<any> => {
        const filter = getMongoDbFilter(graphQLType, args.filter);
        if (requiredUpdateOptions.validateUpdateArgs) validateUpdateArgs(args.update, graphQLType, requiredUpdateOptions.overwrite);
        const mongoUpdate = getMongoDbUpdate(args.update, requiredUpdateOptions.overwrite);
        const projection = requiredUpdateOptions.differentOutputType ? undefined : getMongoDbProjection(info, graphQLType);
        return await updateCallback(filter, mongoUpdate.update, mongoUpdate.options, projection, source, args, context, info);
    };
}

export function getGraphQLUpdateArgs(graphQLType: GraphQLObjectType): { [key: string]: { type: GraphQLNonNull<GraphQLInputObjectType> } } & {
    filter: { type: GraphQLNonNull<GraphQLInputObjectType> },
    update: { type: GraphQLNonNull<GraphQLInputObjectType> }
} {
    return {
        filter: { type: new GraphQLNonNull(getGraphQLFilterType(graphQLType)) },
        update: { type: new GraphQLNonNull(getGraphQLUpdateType(graphQLType)) }
    };
}
