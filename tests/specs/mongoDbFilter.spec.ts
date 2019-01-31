import { expect } from "chai";
import { getMongoDbFilter, MongoDbFilter, GraphQLFilter } from "../../src/mongoDbFilter";
import { ObjectType } from "../utils/types";
import { setLogger, getLogger } from "../../src/logger";

describe("mongoDbFilter", () => {
    describe("getMongoDbFilter", () => {
        let logger;
        before(() => { logger = getLogger(); setLogger({}) })
        after(() => { setLogger(logger) })

        const tests: { name: string, graphQLFilter: GraphQLFilter, expectedMongoDbFilter: MongoDbFilter }[] = [{
            name: "Should parse deprecated scalar filter",
            graphQLFilter: {
                stringScalar: {
                    opr: "$eq",
                    value: "some-eql",
                    NEQ: "some-neq"
                },
                intScalar: {
                    opr: "$gt",
                    value: "some-gt"
                },
                floatScalar: {
                    opr: "$gte",
                    value: "some-gte"
                },
                enumScalar: {
                    opr: "$in",
                    values: ["some-in", "another-in"]
                },
                stringList: {
                    opr: "$lt",
                    value: "some-lt"
                },
                intList: {
                    opr: "$lte",
                    value: "some-lte"
                },
                floatList: {
                    opr: "$ne",
                    value: "some-ne"
                },
                enumList: {
                    opr: "$nin",
                    values: ["some-nin", "another-nin"]
                },
            },
            expectedMongoDbFilter: {
                stringScalar: { $eq: "some-eql", $ne: "some-neq" },
                intScalar: { $gt: "some-gt" },
                floatScalar: { $gte: "some-gte" },
                enumScalar: { $in: ["some-in", "another-in"] },
                stringList: { $lt: "some-lt" },
                intList: { $lte: "some-lte" },
                floatList: { $ne: "some-ne" },
                enumList: { $nin: ["some-nin", "another-nin"] }
            }
        }, {
            name: "Should parse scalar filter",
            graphQLFilter: {
                stringScalar: {
                    EQ: "some-eql"
                },
                intScalar: {
                    GT: "some-gt"
                },
                floatScalar: {
                    GTE: "some-gte"
                },
                enumScalar: {
                    IN: ["some-in", "another-in"]
                },
                stringList: {
                    LT: "some-lt"
                },
                intList: {
                    LTE: "some-lte"
                },
                floatList: {
                    NE: "some-ne"
                },
                enumList: {
                    NIN: ["some-nin", "another-nin"]
                },
            },
            expectedMongoDbFilter: {
                stringScalar: { $eq: "some-eql" },
                intScalar: { $gt: "some-gt" },
                floatScalar: { $gte: "some-gte" },
                enumScalar: { $in: ["some-in", "another-in"] },
                stringList: { $lt: "some-lt" },
                intList: { $lte: "some-lte" },
                floatList: { $ne: "some-ne" },
                enumList: { $nin: ["some-nin", "another-nin"] }
            }
        }, {
            name: "Should parse scalar not filter",
            graphQLFilter: {
                stringScalar: {
                    NOT: { EQ: "some-eql" }
                },
                intScalar: {
                    NOT: { GT: "some-gt" }
                },
                floatScalar: {
                    NOT: { GTE: "some-gte" }
                },
                enumScalar: {
                    NOT: { IN: ["some-in", "another-in"] }
                },
                stringList: {
                    NOT: { LT: "some-lt" }
                },
                intList: {
                    NOT: { LTE: "some-lte" }
                },
                floatList: {
                    NOT: { NE: "some-ne" }
                },
                enumList: {
                    NOT: { NIN: ["some-nin", "another-nin"] }
                },
            },
            expectedMongoDbFilter: {
                stringScalar: { $not: { $eq: "some-eql" } },
                intScalar: { $not: { $gt: "some-gt" } },
                floatScalar: { $not: { $gte: "some-gte" } },
                enumScalar: { $not: { $in: ["some-in", "another-in"] } },
                stringList: { $not: { $lt: "some-lt" } },
                intList: { $not: { $lte: "some-lte" } },
                floatList: { $not: { $ne: "some-ne" } },
                enumList: { $not: { $nin: ["some-nin", "another-nin"] } }
            }
        }, {
            name: "Should parse regex",
            graphQLFilter: {
                stringScalar: {
                    REGEX: "someValue"
                },
                stringList: {
                    REGEX: "someValueWithOptions",
                    OPTIONS: "im"
                },
                nested: {
                    stringScalar: {
                        NOT: { REGEX: "someValue" }
                    },
                    stringList: {
                        NOT: { REGEX: "someValueWithOptions", OPTIONS: "im" }
                    }
                }
            },
            expectedMongoDbFilter: {
                stringScalar: { $regex: "someValue" },
                stringList: { $regex: "someValueWithOptions", $options: "im" },
                "nested.stringScalar": { $not: /someValue/g },
                "nested.stringList": { $not: /someValueWithOptions/gim },
            }
        }, {
            name: "Should parse scalar list",
            graphQLFilter: {
                stringList: {
                    EQ: "someValue"
                },
                nested: {
                    floatList: {
                        NE: "someNestedValue"
                    }
                }
            },
            expectedMongoDbFilter: {
                stringList: { $eq: "someValue" },
                "nested.floatList": { $ne: "someNestedValue" },
            }
        }, {
            name: "Should parse nested objects",
            graphQLFilter: {
                stringScalar: {
                    EQ: "someValue"
                },
                nested: {
                    stringScalar: {
                        NE: "someNestedValue"
                    },
                    intScalar: {
                        NE: "anotherNestedValue"
                    }
                }
            },
            expectedMongoDbFilter: {
                stringScalar: { $eq: "someValue" },
                "nested.stringScalar": { $ne: "someNestedValue" },
                "nested.intScalar": { $ne: "anotherNestedValue" },
            }
        }, {
            name: "Should parse exists operator in nested objects",
            graphQLFilter: {
                nested: {
                    opr: "exists",
                    stringScalar: { EQ: "someValue" },
                    recursive: {
                        opr: "not_exists",
                        recursive: {
                            recursive: {
                                stringScalar: { EQ: "deep" },
                            }
                        }
                    }
                }
            },
            expectedMongoDbFilter: {
                nested: { $exists: true },
                "nested.stringScalar": { $eq: "someValue" },
                "nested.recursive": { $exists: false },
                "nested.recursive.recursive.recursive.stringScalar": { $eq: "deep" },
            }
        }, {
            name: "Should parse OR and AND operators at root",
            graphQLFilter: {
                OR: [
                    {
                        stringScalar: {
                            EQ: "someValue"
                        }
                    }, {
                        stringScalar: {
                            NE: "someOtherValue"
                        }
                    }, {
                        AND: [
                            {
                                stringScalar: {
                                    GT: "thirdValue"
                                }
                            }, {
                                stringScalar: {
                                    LTE: "fourthValue"
                                }
                            }]
                    }],
                AND: [
                    {
                        stringScalar: {
                            EQ: "someValue"
                        }
                    }, {
                        stringScalar: {
                            NE: "someOtherValue"
                        }
                    }, {
                        OR: [
                            {
                                stringScalar: {
                                    GT: "thirdValue"
                                }
                            }, {
                                stringScalar: {
                                    LTE: "fourthValue"
                                }
                            }]
                    }]
            },
            expectedMongoDbFilter: {
                $or: [
                    { stringScalar: { $eq: "someValue" } },
                    { stringScalar: { $ne: "someOtherValue" } },
                    {
                        $and: [
                            { stringScalar: { $gt: "thirdValue" } },
                            { stringScalar: { $lte: "fourthValue" } },
                        ]
                    }
                ],
                $and: [
                    { stringScalar: { $eq: "someValue" } },
                    { stringScalar: { $ne: "someOtherValue" } },
                    {
                        $or: [
                            { stringScalar: { $gt: "thirdValue" } },
                            { stringScalar: { $lte: "fourthValue" } },
                        ]
                    }
                ]
            }
        }, {
            name: "Should parse object list",
            graphQLFilter: {
                nestedList: {
                    opr: "exists",
                    stringScalar: { EQ: "someValue" }
                }
            },
            expectedMongoDbFilter: {
                nestedList: {
                    $elemMatch: {
                        $exists: true,
                        stringScalar: { $eq: "someValue" }
                    }
                }
            }
        }];

        tests.forEach(test => it(test.name, () => {
            // Act
            const actualMongoDbFilter = getMongoDbFilter(ObjectType, test.graphQLFilter);

            // Assert
            expect(actualMongoDbFilter).to.deep.equal(test.expectedMongoDbFilter, "Actual mongodb filter object does not match expected");
        }));

        it("Should throw exception for a non-solitary REGEX opeartor in a NOT operator", () => {
            // Arrange
            const graphQLFilter = {
                stringScalar: {
                    NOT: {
                        REGEX: "SomeRegex",
                        EQ: "SomeValue"
                    }
                }
            }

            // Act
            const action = () => getMongoDbFilter(ObjectType, graphQLFilter);

            // Assert
            expect(action).to.throw();
        })
    });
});