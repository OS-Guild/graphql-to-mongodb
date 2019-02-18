import { parse, execute, GraphQLSchema, GraphQLObjectType, GraphQLFieldConfigArgumentMap, GraphQLOutputType, GraphQLResolveInfo, Source } from "graphql"

export interface ResolveArgs {
    args: any
    info: GraphQLResolveInfo
};

export default (type: GraphQLOutputType, query: string, args?: GraphQLFieldConfigArgumentMap, fieldName: string = "test"): ResolveArgs => {
    let resolveArgs: ResolveArgs;

    const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: "RootQuery",
            fields: () => ({
                [fieldName]: {
                    type,
                    args,
                    resolve: (obj, args, context, info) => {
                        resolveArgs = { args, info };
                    }
                }
            })
        })
    });

    const source = new Source(query, 'GraphQL request');
    const document = parse(source);

    execute(schema, document);

    return resolveArgs;
};
