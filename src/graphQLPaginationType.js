import { GraphQLInputObjectType, GraphQLList, GraphQLInt, GraphQLNonNull, GraphQLBoolean } from 'graphql';

const GraphQLPaginationType = new GraphQLInputObjectType({
    name: "GraphQLPaginationType",
    fields: {
        limit: { type: GraphQLInt },
        skip: { type: GraphQLInt }
    }
});

export default GraphQLPaginationType;