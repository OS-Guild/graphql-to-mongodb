import { SchemaDirectiveVisitor, gql } from "apollo-server-express"
import { GraphQLField, GraphQLObjectType, GraphQLArgument, GraphQLNamedType, isNonNullType, isListType, GraphQLOutputType, isObjectType } from "graphql";
import { getGraphQLQueryArgs, getMongoDbQueryResolver, QueryOptions, getGraphQLUpdateArgs, getMongoDbUpdateResolver, UpdateOptions, getGraphQLInsertType, getGraphQLFilterType, getMongoDbFilter } from "graphql-to-mongodb";

export const types = gql`
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

        let queryArgs = getGraphQLQueryArgs(graphqlType);
        const args: GraphQLArgument[] = Object.keys(queryArgs).map(key => ({
            name: key,
            type: queryArgs[key].type,
            description: undefined,
            defaultValue: undefined,
            extensions: undefined,
            astNode: undefined
        }));

        field.args = [...field.args, ...args];
    }
}

export class MongoQueryResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, queryOptions: queryOptionsArg } = this.args as { type: string, queryOptions: QueryOptions }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        const queryOptions = {
            ...queryOptionsArg,
            isResolvedField: field => !field[resolverless],
            excludedFields: []
        };
        markResolverless(graphqlType);

        field.resolve = getMongoDbQueryResolver(graphqlType, field.resolve, queryOptions);
    }
}

export class MongoUpdateArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type } = this.args as { type: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        let updateArgs = getGraphQLUpdateArgs(graphqlType);
        const args: GraphQLArgument[] = Object.keys(updateArgs).map(key => ({
            name: key,
            type: updateArgs[key].type,
            description: undefined,
            defaultValue: undefined,
            extensions: undefined,
            astNode: undefined
        }));

        field.args = [...field.args, ...args];
    }
}

export class MongoUpdateResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, updateOptions: updateOptionsArg } = this.args as { type: string, updateOptions: UpdateOptions }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        const updateOptions = {
            ...updateOptionsArg,
            isResolvedField: field => !field[resolverless],
            excludedFields: []
        };
        markResolverless(graphqlType);

        field.resolve = getMongoDbUpdateResolver(graphqlType, field.resolve as any, updateOptions);
    }
}

export class MongoInsertArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        const insertType = getGraphQLInsertType(graphqlType);
        field.args = [...field.args, {
            name: key, type: insertType,
            description: undefined,
            defaultValue: undefined,
            extensions: undefined,
            astNode: undefined
        }];
    }
}

export class MongoFilterArgsVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        const filterType = getGraphQLFilterType(graphqlType);
        field.args = [...field.args, {
            name: key, type: filterType,
            description: undefined,
            defaultValue: undefined,
            extensions: undefined,
            astNode: undefined
        }];
    }
}

export class MongoFilterResolverVisitor extends SchemaDirectiveVisitor {
    public visitFieldDefinition(field: GraphQLField<any, any>) {
        const { type, key } = this.args as { type: string, key: string }
        const graphqlType = this.schema.getType(type);

        if (!(graphqlType instanceof GraphQLObjectType)) {
            throw `${this.name} directive requires type arg to be GraphQLObjectType`;
        }

        const resolve = field.resolve;

        field.resolve = ((source, args, context, info) => {
            const filter = getMongoDbFilter(graphqlType, args[key])
            return (resolve as any)(filter, source, args, context, info);
        }).bind(field);
    }
}

export const visitors = {
    mongoDependencies: MongoDependenciesVisitor,
    mongoQueryArgs: MongoQueryArgsVisitor,
    mongoQueryResolver: MongoQueryResolverVisitor,
    mongoUpdateArgs: MongoUpdateArgsVisitor,
    mongoUpdateResolver: MongoUpdateResolverVisitor,
    mongoInsertArgs: MongoInsertArgsVisitor,
    mongofilterArgs: MongoFilterArgsVisitor,
    mongoFilterResolver: MongoFilterResolverVisitor,
};

const resolverless = Symbol("resolverless");

const markResolverless = (type: GraphQLObjectType) => {
    const innerType = (type: GraphQLOutputType): GraphQLOutputType & GraphQLNamedType => {
        if (isNonNullType(type) || isListType(type))
            return innerType(type.ofType);
        return type;
    }

    const fields = type.getFields();

    Object.keys(fields).map(key => fields[key]).forEach(field => {
        if (!!field.resolve) return;
        if (field[resolverless] === true) return;
        field[resolverless] = true;
        const fieldType = innerType(field.type);
        if (isObjectType(fieldType)) {
            markResolverless(fieldType);
        }
    });
}
