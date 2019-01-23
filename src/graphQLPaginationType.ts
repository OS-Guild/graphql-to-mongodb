import { GraphQLInputObjectType, GraphQLInt } from "graphql";

export default new GraphQLInputObjectType({
    name: "PaginationType",
    fields: {
        limit: { type: GraphQLInt },
        skip: { type: GraphQLInt }
    }
});
