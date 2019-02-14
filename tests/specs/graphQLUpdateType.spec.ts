import { getGraphQLUpdateType, getGraphQLSetOnInsertType, getGraphQLSetType, getGraphQLIncType, OVERWRITE, OVERWRITE_DESCRIPTION, FICTIVE_INC, FICTIVE_INC_DESCRIPTION } from "../../src/graphQLUpdateType";
import { expect } from "chai";
import { clearTypesCache } from "../../src/common";
import printInputType from "../utils/printInputType";
import { ObjectType, CharactersEnum } from "../utils/types";
import { GraphQLObjectType, GraphQLInputType, GraphQLInputObjectType, GraphQLInt, GraphQLString, GraphQLList, printType, GraphQLNonNull, GraphQLBoolean, GraphQLFloat, GraphQLID } from "graphql";

describe("graphQLUpdateType", () => {
    describe("getGraphQLUpdateType", () => {
        beforeEach(clearTypesCache);

        it("Should get update type", () => {
            // Arrange
            const nestedSetOnInsertType = new GraphQLInputObjectType({
                name: "NestedSetOnInsertType",
                fields: () => ({
                    stringScalar: { type: GraphQLString },
                    intScalar: { type: GraphQLInt },
                    floatScalar: { type: GraphQLFloat },
                    enumScalar: { type: CharactersEnum },

                    stringList: { type: new GraphQLList(GraphQLString) },
                    intList: { type: new GraphQLList(GraphQLInt) },
                    floatList: { type: new GraphQLList(GraphQLFloat) },
                    enumList: { type: new GraphQLList(CharactersEnum) },

                    nonNullScalar: { type: GraphQLString },
                    nonNullList: { type: new GraphQLList(GraphQLString) },
                    listOfNonNulls: { type: new GraphQLList(GraphQLString) },

                    recursive: { type: nestedSetOnInsertType }
                })
            })

            const nestedSetObjectType = new GraphQLInputObjectType({
                name: "NestedSetObjectType",
                fields: () => ({
                    stringScalar: { type: GraphQLString },
                    intScalar: { type: GraphQLInt },
                    floatScalar: { type: GraphQLFloat },
                    enumScalar: { type: CharactersEnum },

                    stringList: { type: new GraphQLList(GraphQLString) },
                    intList: { type: new GraphQLList(GraphQLInt) },
                    floatList: { type: new GraphQLList(GraphQLFloat) },
                    enumList: { type: new GraphQLList(CharactersEnum) },

                    nonNullScalar: { type: GraphQLString },
                    nonNullList: { type: new GraphQLList(GraphQLString) },
                    listOfNonNulls: { type: new GraphQLList(GraphQLString) },

                    recursive: { type: nestedSetObjectType },

                    [OVERWRITE]: { type: GraphQLBoolean, description: OVERWRITE_DESCRIPTION }
                })
            })

            const nestedSetListObjectType = new GraphQLInputObjectType({
                name: "NestedSetListObjectType",
                fields: () => ({
                    stringScalar: { type: GraphQLString },
                    intScalar: { type: GraphQLInt },
                    floatScalar: { type: GraphQLFloat },
                    enumScalar: { type: CharactersEnum },

                    stringList: { type: new GraphQLList(GraphQLString) },
                    intList: { type: new GraphQLList(GraphQLInt) },
                    floatList: { type: new GraphQLList(GraphQLFloat) },
                    enumList: { type: new GraphQLList(CharactersEnum) },

                    nonNullScalar: { type: GraphQLString },
                    nonNullList: { type: new GraphQLList(GraphQLString) },
                    listOfNonNulls: { type: new GraphQLList(GraphQLString) },

                    recursive: { type: nestedSetListObjectType }
                })
            })

            const nestedIncType = new GraphQLInputObjectType({
                name: "NestedIncType",
                fields: () => ({
                    intScalar: { type: GraphQLInt },
                    floatScalar: { type: GraphQLFloat },

                    recursive: { type: nestedIncType }
                })
            })

            const expectedType = new GraphQLInputObjectType({
                name: "ObjectUpdateType",
                fields: {
                    setOnInsert: {
                        type: new GraphQLInputObjectType({
                            name: "ObjectSetOnInsertType",
                            fields: {
                                _id: { type: GraphQLID },
                                
                                stringScalar: { type: GraphQLString },
                                intScalar: { type: GraphQLInt },
                                floatScalar: { type: GraphQLFloat },
                                enumScalar: { type: CharactersEnum },

                                stringList: { type: new GraphQLList(GraphQLString) },
                                intList: { type: new GraphQLList(GraphQLInt) },
                                floatList: { type: new GraphQLList(GraphQLFloat) },
                                enumList: { type: new GraphQLList(CharactersEnum) },

                                nested: { type: nestedSetOnInsertType },
                                nestedList: { type: new GraphQLList(nestedSetOnInsertType) },

                                nonNullScalar: { type: GraphQLString },
                                nonNullList: { type: new GraphQLList(GraphQLString) },
                                listOfNonNulls: { type: new GraphQLList(GraphQLString) }
                            }
                        })
                    },
                    set: {
                        type: new GraphQLInputObjectType({
                            name: "ObjectSetType",
                            fields: {
                                _id: { type: GraphQLID },

                                stringScalar: { type: GraphQLString },
                                intScalar: { type: GraphQLInt },
                                floatScalar: { type: GraphQLFloat },
                                enumScalar: { type: CharactersEnum },

                                stringList: { type: new GraphQLList(GraphQLString) },
                                intList: { type: new GraphQLList(GraphQLInt) },
                                floatList: { type: new GraphQLList(GraphQLFloat) },
                                enumList: { type: new GraphQLList(CharactersEnum) },

                                nested: { type: nestedSetObjectType },
                                nestedList: { type: new GraphQLList(nestedSetListObjectType) },

                                nonNullScalar: { type: GraphQLString },
                                nonNullList: { type: new GraphQLList(GraphQLString) },
                                listOfNonNulls: { type: new GraphQLList(GraphQLString) }
                            }
                        })
                    },
                    inc: {
                        type: new GraphQLInputObjectType({
                            name: "ObjectIncType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                floatScalar: { type: GraphQLFloat },

                                nested: { type: nestedIncType }
                            }
                        })
                    }
                }
            })

            // Act
            const updateType = getGraphQLUpdateType(ObjectType);

            // Assert
            expect(printType(updateType)).to.eql(printType(expectedType), "Base type should be correct");
            expect(printInputType(updateType)).to.eql(printInputType(expectedType), "Type schema should be correct");
        })
    });

    const tests: {
        name: string,
        function: (type: GraphQLObjectType) => GraphQLInputType,
        only?: boolean,
        cases: { description: string, type: GraphQLObjectType, expectedType: GraphQLInputType }[]
    }[] = [{
        name: "getGraphQLSetOnInsertType",
        function: getGraphQLSetOnInsertType,
        cases: [{
            description: "Should get non nested setOnInsert type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    intScalar: { type: GraphQLInt },
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetOnInsertType",
                fields: {
                    intScalar: { type: GraphQLInt },
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            })
        }, {
            description: "Should get nested setOnInsert type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    nested: {
                        type: new GraphQLObjectType({
                            name: "NestedType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        })
                    },
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetOnInsertType",
                fields: {
                    nested: {
                        type: new GraphQLInputObjectType({
                            name: "NestedSetOnInsertType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        })
                    }
                }
            })
        }, {
            description: "Should get nested setOnInsert type with non-nulls as nullable",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    intScalar: { type: new GraphQLNonNull(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetOnInsertType",
                fields: {
                    intScalar: { type: GraphQLInt }
                }
            })
        }]
    }, {
        name: "getGraphQLSetType",
        function: getGraphQLSetType,
        cases: [{
            description: "Should get non nested set type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    intScalar: { type: GraphQLInt },
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetType",
                fields: {
                    intScalar: { type: GraphQLInt },
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            })
        }, {
            description: "Should get nested set type with non-nulls as nullable",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    intScalar: { type: new GraphQLNonNull(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetType",
                fields: {
                    intScalar: { type: GraphQLInt }
                }
            })
        }, {
            description: "Should get nested set type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    nested: {
                        type: new GraphQLObjectType({
                            name: "NestedType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        })
                    },
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetType",
                fields: {
                    nested: {
                        type: new GraphQLInputObjectType({
                            name: "NestedSetObjectType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) },
                                [OVERWRITE]: { type: GraphQLBoolean, description: OVERWRITE_DESCRIPTION }
                            }
                        })
                    }
                }
            })
        }, {
            description: "Should get nested list set type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    nested: {
                        type: new GraphQLList(new GraphQLObjectType({
                            name: "NestedType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        }))
                    },
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeSetType",
                fields: {
                    nested: {
                        type: new GraphQLList(new GraphQLInputObjectType({
                            name: "NestedSetListObjectType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        }))
                    }
                }
            })
        }]
    }, {
        name: "getGraphQLIncType",
        function: getGraphQLIncType,
        cases: [{
            description: "Should get non nested inc type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    intScalar: { type: GraphQLInt },
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeIncType",
                fields: {
                    intScalar: { type: GraphQLInt }
                }
            })
        }, {
            description: "Should get nested inc type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    nested: {
                        type: new GraphQLObjectType({
                            name: "NestedType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                                stringScalar: { type: GraphQLString },
                                intList: { type: new GraphQLList(GraphQLInt) }
                            }
                        })
                    },
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeIncType",
                fields: {
                    nested: {
                        type: new GraphQLInputObjectType({
                            name: "NestedIncType",
                            fields: {
                                intScalar: { type: GraphQLInt },
                            }
                        })
                    },
                }
            })
        }, {
            description: "Should get fictive inc type",
            type: new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    stringScalar: { type: GraphQLString },
                    intList: { type: new GraphQLList(GraphQLInt) }
                }
            }),
            expectedType: new GraphQLInputObjectType({
                name: "SomeIncType",
                fields: {
                    [FICTIVE_INC]: { type: GraphQLInt, description: FICTIVE_INC_DESCRIPTION }
                }
            })
        }]
    }];

    tests.forEach(test => describe(test.name, () => {
        beforeEach(clearTypesCache);
        const itTest = test.only ? it.only : it;

        test.cases.forEach(_ => itTest(_.description, () => {
            // Act
            const updateType = test.function(_.type);

            // Assert
            expect(printType(updateType)).to.eql(printType(_.expectedType), "Base type should be correct");
            expect(printInputType(updateType)).to.eql(printInputType(_.expectedType), "Type schema should be correct");
        }));
    }));
});
