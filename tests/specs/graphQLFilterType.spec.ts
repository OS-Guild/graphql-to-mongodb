import { expect } from "chai";
import { clearTypesCache } from "../../src/common";
import printInputType from "../utils/printInputType";
import { ObjectType, CharactersEnum } from "../utils/types";
import { GraphQLObjectType, GraphQLInputType, GraphQLInputObjectType, GraphQLInt, GraphQLString, GraphQLList, printType, GraphQLNonNull, GraphQLBoolean, GraphQLFloat, GraphQLEnumType } from "graphql";
import { getGraphQLFilterType } from "../../src/graphQLFilterType";

describe("graphQLFilterType", () => {
    describe("getGraphQLFilterType", () => {
        beforeEach(clearTypesCache);

        it("Should get a filter type", () => {
            // Arrange
            const oprType = new GraphQLEnumType({
                name: "Opr",
                values: {
                    EQL: { value: "$eq" },
                    GT: { value: "$gt" },
                    GTE: { value: "$gte" },
                    IN: { value: "$in" },
                    LT: { value: "$lt" },
                    LTE: { value: "$lte" },
                    NE: { value: "$ne" },
                    NIN: { value: "$nin" }
                }
            });

            const oprExistsType = new GraphQLEnumType({
                name: "OprExists",
                values: {
                    EXISTS: { value: "exists" },
                    NOT_EXISTS: { value: "not_exists" },
                }
            });

            const stringNotFilter = new GraphQLInputObjectType({
                name: "StringNotFilter",
                description: `Filter type for $not of String scalar`,
                fields: {
                    EQ: { type: GraphQLString, description: "$eq" },
                    GT: { type: GraphQLString, description: "$gt" },
                    GTE: { type: GraphQLString, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLString), description: "$in" },
                    LT: { type: GraphQLString, description: "$lt" },
                    LTE: { type: GraphQLString, description: "$lte" },
                    NE: { type: GraphQLString, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLString), description: "$eq" },

                    REGEX: { type: GraphQLString, description: "$regex" },
                    OPTIONS: { type: GraphQLString, description: "$options. Modifiers for the $regex expression. Field be ignored on its own" },
                } 
            });

            const stringFilter = new GraphQLInputObjectType({
                name: "StringFilter",
                description: `Filter type for String scalar`,
                fields: {
                    EQ: { type: GraphQLString, description: "$eq" },
                    GT: { type: GraphQLString, description: "$gt" },
                    GTE: { type: GraphQLString, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLString), description: "$in" },
                    LT: { type: GraphQLString, description: "$lt" },
                    LTE: { type: GraphQLString, description: "$lte" },
                    NE: { type: GraphQLString, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLString), description: "$eq" },

                    REGEX: { type: GraphQLString, description: "$regex" },
                    OPTIONS: { type: GraphQLString, description: "$options. Modifiers for the $regex expression. Field be ignored on its own" },

                    NOT: { type: stringNotFilter, description: "$not" },
                    
                    opr: { type: oprType, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    value: { type: GraphQLString, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    values: { type: new GraphQLList(GraphQLString), description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    NEQ: { type: GraphQLString, description: "DEPRECATED: use NE" }
                } 
            });

            const intNotFilter = new GraphQLInputObjectType({
                name: "IntNotFilter",
                description: `Filter type for $not of Int scalar`,
                fields: {
                    EQ: { type: GraphQLInt, description: "$eq" },
                    GT: { type: GraphQLInt, description: "$gt" },
                    GTE: { type: GraphQLInt, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLInt), description: "$in" },
                    LT: { type: GraphQLInt, description: "$lt" },
                    LTE: { type: GraphQLInt, description: "$lte" },
                    NE: { type: GraphQLInt, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLInt), description: "$eq" },
                } 
            });

            const intFilter = new GraphQLInputObjectType({
                name: "IntFilter",
                description: `Filter type for Int scalar`,
                fields: {
                    EQ: { type: GraphQLInt, description: "$eq" },
                    GT: { type: GraphQLInt, description: "$gt" },
                    GTE: { type: GraphQLInt, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLInt), description: "$in" },
                    LT: { type: GraphQLInt, description: "$lt" },
                    LTE: { type: GraphQLInt, description: "$lte" },
                    NE: { type: GraphQLInt, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLInt), description: "$eq" },

                    NOT: { type: intNotFilter, description: "$not" },
                    
                    opr: { type: oprType, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    value: { type: GraphQLInt, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    values: { type: new GraphQLList(GraphQLInt), description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    NEQ: { type: GraphQLInt, description: "DEPRECATED: use NE" }
                } 
            });

            const floatNotFilter = new GraphQLInputObjectType({
                name: "FloatNotFilter",
                description: `Filter type for $not of Float scalar`,
                fields: {
                    EQ: { type: GraphQLFloat, description: "$eq" },
                    GT: { type: GraphQLFloat, description: "$gt" },
                    GTE: { type: GraphQLFloat, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLFloat), description: "$in" },
                    LT: { type: GraphQLFloat, description: "$lt" },
                    LTE: { type: GraphQLFloat, description: "$lte" },
                    NE: { type: GraphQLFloat, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLFloat), description: "$eq" },
                } 
            });

            const floatFilter = new GraphQLInputObjectType({
                name: "FloatFilter",
                description: `Filter type for Float scalar`,
                fields: {
                    EQ: { type: GraphQLFloat, description: "$eq" },
                    GT: { type: GraphQLFloat, description: "$gt" },
                    GTE: { type: GraphQLFloat, description: "$gte" },
                    IN: { type: new GraphQLList(GraphQLFloat), description: "$in" },
                    LT: { type: GraphQLFloat, description: "$lt" },
                    LTE: { type: GraphQLFloat, description: "$lte" },
                    NE: { type: GraphQLFloat, description: "$ne" },
                    NIN: { type: new GraphQLList(GraphQLFloat), description: "$eq" },

                    NOT: { type: floatNotFilter, description: "$not" },
                    
                    opr: { type: oprType, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    value: { type: GraphQLFloat, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    values: { type: new GraphQLList(GraphQLFloat), description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    NEQ: { type: GraphQLFloat, description: "DEPRECATED: use NE" }
                } 
            });

            const charactersNotFilter = new GraphQLInputObjectType({
                name: "CharactersNotFilter",
                description: `Filter type for $not of Characters scalar`,
                fields: {
                    EQ: { type: CharactersEnum, description: "$eq" },
                    GT: { type: CharactersEnum, description: "$gt" },
                    GTE: { type: CharactersEnum, description: "$gte" },
                    IN: { type: new GraphQLList(CharactersEnum), description: "$in" },
                    LT: { type: CharactersEnum, description: "$lt" },
                    LTE: { type: CharactersEnum, description: "$lte" },
                    NE: { type: CharactersEnum, description: "$ne" },
                    NIN: { type: new GraphQLList(CharactersEnum), description: "$eq" },
                } 
            });

            const charactersFilter = new GraphQLInputObjectType({
                name: "CharactersFilter",
                description: `Filter type for Characters scalar`,
                fields: {
                    EQ: { type: CharactersEnum, description: "$eq" },
                    GT: { type: CharactersEnum, description: "$gt" },
                    GTE: { type: CharactersEnum, description: "$gte" },
                    IN: { type: new GraphQLList(CharactersEnum), description: "$in" },
                    LT: { type: CharactersEnum, description: "$lt" },
                    LTE: { type: CharactersEnum, description: "$lte" },
                    NE: { type: CharactersEnum, description: "$ne" },
                    NIN: { type: new GraphQLList(CharactersEnum), description: "$eq" },

                    NOT: { type: charactersNotFilter, description: "$not" },
                    
                    opr: { type: oprType, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    value: { type: CharactersEnum, description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    values: { type: new GraphQLList(CharactersEnum), description: "DEPRECATED: Switched to the more intuitive operator fields" },
                    NEQ: { type: CharactersEnum, description: "DEPRECATED: use NE" }
                } 
            });

            const nestedObjectFilterType =  new GraphQLInputObjectType({
                name: "NestedObjectFilterType",
                fields: () => ({
                    stringScalar: { type: stringFilter },
                    intScalar: { type: intFilter },
                    floatScalar: { type: floatFilter },
                    enumScalar: { type: charactersFilter },

                    stringList: { type: stringFilter },
                    intList: { type: intFilter },
                    floatList: { type: floatFilter },
                    enumList: { type: charactersFilter },

                    nonNullScalar: { type: stringFilter },
                    nonNullList: { type: stringFilter },
                    listOfNonNulls: { type: stringFilter },

                    recursive: { type: nestedObjectFilterType },

                    opr: { type: oprExistsType }
                })
            });

            const expectedType = new GraphQLInputObjectType({
                name: "ObjectFilterType",
                fields: () => ({
                    stringScalar: { type: stringFilter },
                    intScalar: { type: intFilter },
                    floatScalar: { type: floatFilter },
                    enumScalar: { type: charactersFilter },

                    stringList: { type: stringFilter },
                    intList: { type: intFilter },
                    floatList: { type: floatFilter },
                    enumList: { type: charactersFilter },

                    nested: { type: nestedObjectFilterType },
                    nestedList: { type: nestedObjectFilterType },

                    nonNullScalar: { type: stringFilter },
                    nonNullList: { type: stringFilter },
                    listOfNonNulls: { type: stringFilter },

                    OR: { type: new GraphQLList(expectedType) },
                    AND: { type: new GraphQLList(expectedType) },
                    NOR: { type: new GraphQLList(expectedType) },
                })
            })

            // Act
            const filterType = getGraphQLFilterType(ObjectType);

            // Assert
            expect(printType(filterType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(filterType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        })
    });
});