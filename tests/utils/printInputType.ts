import { printSchema, GraphQLInputType, GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";

const FICTIVE_FIELD = "FICTIVE_FIELD";
const FICTIVE_QUERY = "FICTIVE_QUERY";

function buildFictiveSchema(inputType: GraphQLInputType): GraphQLSchema {
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: FICTIVE_QUERY,
            fields: () => ({
                [FICTIVE_FIELD]: {
                    type: GraphQLString,
                    args: { input: { type: inputType } }
                }
            })
        })
    })
}

function trimFictiveParts(schema: string, inputType: GraphQLInputType): string {
    return schema
        .replace(new RegExp(`schema[\\n\\s]*\\{[\\n\\s]*query:[\\n\\s]*${FICTIVE_QUERY}[\\n\\s]*\\}`), "")
        .replace(new RegExp(`type[\\n\\s]*${FICTIVE_QUERY}[\\n\\s]*\\{[\\n\\s]*${FICTIVE_FIELD}\\(input:[\\n\\s]*${inputType.toString()}\\)[\\n\\s]*:[\\n\\s]*String[\\n\\s]*\\}`), "")
}

export default function printInputType(inputType: GraphQLInputType): string {
    return trimFictiveParts(
        printSchema(
            buildFictiveSchema(inputType), { commentDescriptions: true }
        ),
        inputType
    );
}
