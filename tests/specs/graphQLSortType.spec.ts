import { expect } from "chai";
import { clearTypesCache } from "../../src/common";
import printInputType from "../utils/printInputType";
import { ObjectType, InterfaceType } from "../utils/types";
import { GraphQLInputObjectType, GraphQLString, GraphQLList, printType, GraphQLEnumType, GraphQLObjectType } from "graphql";
import { getGraphQLSortType, FICTIVE_SORT_DESCRIPTION, FICTIVE_SORT } from "../../src/graphQLSortType";

describe("graphQLSortType.spec", () => {
    describe("getGraphQLSortType", () => {
        beforeEach(clearTypesCache);

        it("Should get a sort type from object", () => {
            // Arrange
            const sortTypeEnum = new GraphQLEnumType({
                name: 'SortType',
                values: {
                    ASC: { value: 1 },
                    DESC: { value: -1 }
                }
            });

            const nestedSortType = new GraphQLInputObjectType({
                name: "NestedSortType",
                fields: () => ({
                    stringScalar: { type: sortTypeEnum },
                    intScalar: { type: sortTypeEnum },
                    floatScalar: { type: sortTypeEnum },
                    enumScalar: { type: sortTypeEnum },

                    nonNullScalar: { type: sortTypeEnum },

                    recursive: { type: nestedSortType },
                })
            });

            const expectedType = new GraphQLInputObjectType({
                name: "ObjectSortType",
                fields: () => ({
                    _id: { type: sortTypeEnum },

                    stringScalar: { type: sortTypeEnum },
                    intScalar: { type: sortTypeEnum },
                    floatScalar: { type: sortTypeEnum },
                    enumScalar: { type: sortTypeEnum },

                    nested: { type: nestedSortType },

                    nonNullScalar: { type: sortTypeEnum },
                })
            })

            // Act
            const sortType = getGraphQLSortType(ObjectType);

            // Assert
            expect(printType(sortType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(sortType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        })

        it("Should get a sort type from interface", () => {
            // Arrange
            const sortTypeEnum = new GraphQLEnumType({
                name: 'SortType',
                values: {
                    ASC: { value: 1 },
                    DESC: { value: -1 }
                }
            });

            const nestedObjectSortType = new GraphQLInputObjectType({
                name: "NestedSortType",
                fields: () => ({
                    stringScalar: { type: sortTypeEnum },
                    intScalar: { type: sortTypeEnum },
                    floatScalar: { type: sortTypeEnum },
                    enumScalar: { type: sortTypeEnum },

                    nonNullScalar: { type: sortTypeEnum },

                    recursive: { type: nestedObjectSortType },
                })
            });

            const nestedInterfaceSortType = new GraphQLInputObjectType({
                name: "NestedInterfaceSortType",
                fields: () => ({
                    stringScalar: { type: sortTypeEnum },
                    intScalar: { type: sortTypeEnum },
                    floatScalar: { type: sortTypeEnum },
                    enumScalar: { type: sortTypeEnum },

                    nonNullScalar: { type: sortTypeEnum },

                    recursive: { type: nestedObjectSortType },
                })
            });

            const expectedType = new GraphQLInputObjectType({
                name: "InterfaceSortType",
                fields: () => ({
                    stringScalar: { type: sortTypeEnum },
                    intScalar: { type: sortTypeEnum },
                    floatScalar: { type: sortTypeEnum },
                    enumScalar: { type: sortTypeEnum },

                    nested: { type: nestedInterfaceSortType },

                    nonNullScalar: { type: sortTypeEnum },
                })
            })

            // Act
            const sortType = getGraphQLSortType(InterfaceType);

            // Assert
            expect(printType(sortType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(sortType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        })

        it("Should get fictive sort type", () => {
            // Arrange
            const type = new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    stringList: { type: new GraphQLList(GraphQLString) }
                }
            });

            const sortTypeEnum = new GraphQLEnumType({
                name: 'SortType',
                values: {
                    ASC: { value: 1 },
                    DESC: { value: -1 }
                }
            });

            const expectedType = new GraphQLInputObjectType({
                name: "SomeSortType",
                fields: () => ({
                    [FICTIVE_SORT]: { type: sortTypeEnum, description: FICTIVE_SORT_DESCRIPTION },
                })
            })

            // Act
            const sortType = getGraphQLSortType(type);

            // Assert
            expect(printType(sortType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(sortType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        });

        it("Should get nested fictive sort type", () => {
            // Arrange
            const type = new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    nested: {
                        type: new GraphQLObjectType({
                            name: "NestedType",
                            fields: {
                                stringList: { type: new GraphQLList(GraphQLString) }
                            }
                        })
                    }
                }
            });

            const sortTypeEnum = new GraphQLEnumType({
                name: 'SortType',
                values: {
                    ASC: { value: 1 },
                    DESC: { value: -1 }
                }
            });

            const expectedType = new GraphQLInputObjectType({
                name: "SomeSortType",
                fields: () => ({
                    nested: {
                        type: new GraphQLInputObjectType({
                            name: "NestedSortType",
                            fields: {
                                [FICTIVE_SORT]: { type: sortTypeEnum, description: FICTIVE_SORT_DESCRIPTION }
                            }
                        })
                    }
                })
            })

            // Act
            const sortType = getGraphQLSortType(type);

            // Assert
            expect(printType(sortType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(sortType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        });
    });
});
