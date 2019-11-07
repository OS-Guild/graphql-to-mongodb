import { GraphQLField, GraphQLObjectType, GraphQLArgument, GraphQLInputType } from "graphql";
import { getGraphQLQueryArgs, getMongoDbQueryResolver, QueryOptions, getGraphQLUpdateArgs, getMongoDbUpdateResolver, UpdateOptions, getGraphQLInsertType, getGraphQLFilterType, getMongoDbFilter } from "graphql-to-mongodb";
import { SchemaDirectiveVisitor } from "graphql-tools"

export const types = `
input QueryOptions {
    differentOutputType: Boolean
}

input UpdateOptions {
    differentOutputType: Boolean
    validateUpdateArgs: Boolean
    overwrite: Boolean
}

directive @mongoDependencies(paths: [String!]!) on FIELD_DEFINITION
directive @mongoQueryArgs(type: String!) on FIELD_DEFINITION
directive @mongoQueryResolver(type: String!, queryOptions: QueryOptions) on FIELD_DEFINITION
directive @mongoUpdateArgs(type: String!) on FIELD_DEFINITION
directive @mongoUpdateResolver(type: String!, updateOptions: UpdateOptions) on FIELD_DEFINITION
directive @mongoInsertArgs(type: String!, key: String!) on FIELD_DEFINITION
directive @mongoFilterArgs(type: String!, key: String!) on FIELD_DEFINITION
directive @mongoFilterResolver(type: String!, key: String!) on FIELD_DEFINITION
`;

export class MongoDirectivesContext {
    public static stage: "First" | "Second";
}

export class MongoDependenciesVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { paths } = this.args as { paths: string[] }
        field["dependencies"] = paths;
    }
}

export class MongoQueryArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type } = this.args as { type: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "First") {
            getGraphQLQueryArgs(graphqlType);
        }

        if (MongoDirectivesContext.stage === "Second") {
            let queryArgs = getGraphQLQueryArgs(graphqlType);
            const args: GraphQLArgument[] = Object.keys(queryArgs).map(key => ({
                name: key,
                type: this.schema.getType(queryArgs[key].type.name) as GraphQLInputType,
                description: undefined,
                defaultValue: undefined,
                extensions: undefined,
                astNode: undefined
            }));

            field.args = [...field.args, ...args];
        }
    }
}

export class MongoQueryResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, queryOptions } = this.args as { type: string, queryOptions: QueryOptions }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "Second") {
            field.resolve = getMongoDbQueryResolver(graphqlType, field.resolve, queryOptions);
        }
    }
}

export class MongoUpdateArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type } = this.args as { type: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "First") {
            getGraphQLUpdateArgs(graphqlType);
        }

        if (MongoDirectivesContext.stage === "Second") {
            let updateArgs = getGraphQLUpdateArgs(graphqlType);
            const args: GraphQLArgument[] = Object.keys(updateArgs).map(key => ({
                name: key,
                type: this.schema.getType(updateArgs[key].type.ofType.name) as GraphQLInputType,
                description: undefined,
                defaultValue: undefined,
                extensions: undefined,
                astNode: undefined
            }));

            field.args = [...field.args, ...args];
        }
    }
}

export class MongoUpdateResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, updateOptions } = this.args as { type: string, updateOptions: UpdateOptions }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "Second") {
            field.resolve = getMongoDbUpdateResolver(graphqlType, field.resolve as any, updateOptions);
        }
    }
}

export class MongoInsertArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "First") {
            getGraphQLInsertType(graphqlType);
        }

        if (MongoDirectivesContext.stage === "Second") {
            const insertType = getGraphQLInsertType(graphqlType);
            field.args = [...field.args, {
                name: key, type: this.schema.getType(insertType.name) as GraphQLInputType,
                description: undefined,
                defaultValue: undefined,
                extensions: undefined,
                astNode: undefined
            }];
        }
    }
}

export class MongoFilterArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "First") {
            getGraphQLFilterType(graphqlType);
        }

        if (MongoDirectivesContext.stage === "Second") {
            const filterType = getGraphQLFilterType(graphqlType);
            field.args = [...field.args, {
                name: key, type: this.schema.getType(filterType.name) as GraphQLInputType,
                description: undefined,
                defaultValue: undefined,
                extensions: undefined,
                astNode: undefined
            }];
        };
    }
}

export class MongoFilterResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        if (MongoDirectivesContext.stage === "Second") {
            const resolve = field.resolve;

            field.resolve = ((source, args, context, info) => {
                const filter = getMongoDbFilter(graphqlType, args[key])
                return (resolve as any)(filter, source, args, context, info);
            }).bind(field);
        }
    }
}

export const visitors = {
    mongoDependencies: MongoDependenciesVisitor,
    mongoQueryArgs: MongoQueryArgsVisitor,
    mongoQueryResolver: MongoQueryResolverVisitor,
    mongoUpdateArgs: MongoUpdateArgsVisitor,
    mongoUpdateResolver: MongoUpdateResolverVisitor,
    mongoInsertArgs: MongoInsertArgsVisitor,
    mongoFilterArgs: MongoFilterArgsVisitor,
    mongoFilterResolver: MongoFilterResolverVisitor,
};
