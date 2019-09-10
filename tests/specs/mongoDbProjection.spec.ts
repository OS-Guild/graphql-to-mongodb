import { getMongoDbProjection } from "../../src/mongoDbProjection";
import { ObjectType } from "../utils/types";
import fieldResolve from "../utils/fieldResolve";
import { expect } from "chai";
import { GraphQLField } from "graphql";

describe("mongoDbProjection", () => {
    describe("getMongoDbProjection", () => {
        const tests: { description: string, query: string, expectedProjection: any, exckudedField?: string[], isResolvedField?: (field: GraphQLField<any, any>) => boolean }[] = [
            {
                description: "Should create projection for a simple request",
                query: `
                query {
                    test {
                        stringScalar
                        intScalar
                        floatScalar
                        enumScalar
                        stringList
                        intList
                        floatList
                        enumList
                    }
                }`,
                expectedProjection: {
                    "stringScalar": 1,
                    "intScalar": 1,
                    "floatScalar": 1,
                    "enumScalar": 1,
                    "stringList": 1,
                    "intList": 1,
                    "floatList": 1,
                    "enumList": 1,
                }
            }, {
                description: "Should create projection for a nested request",
                query: `
                query {
                    test {
                        nested {
                            stringScalar
                            intScalar
                            floatScalar
                            enumScalar
                            stringList
                            intList
                            floatList
                            enumList
                        }
                    }
                }`,
                expectedProjection: {
                    "nested.stringScalar": 1,
                    "nested.intScalar": 1,
                    "nested.floatScalar": 1,
                    "nested.enumScalar": 1,
                    "nested.stringList": 1,
                    "nested.intList": 1,
                    "nested.floatList": 1,
                    "nested.enumList": 1,
                }
            }, {
                description: "Should create projection for a request with fragments",
                query: `
                query {
                    test {
                        ...fieldsA
                        ...fieldsB
                    }
                }
        
                fragment fieldsA on Object {
                    stringScalar
                    intScalar
                    floatScalar
                    enumScalar
                }
        
                fragment fieldsB on Object {
                    stringScalar
                    intList
                    floatList
                    enumList
                    nested {
                        stringScalar
                        intScalar
                        floatScalar
                        enumScalar
                    }
                }`,
                expectedProjection: {
                    "stringScalar": 1,
                    "intScalar": 1,
                    "floatScalar": 1,
                    "enumScalar": 1,
                    "intList": 1,
                    "floatList": 1,
                    "enumList": 1,
                    "nested.stringScalar": 1,
                    "nested.intScalar": 1,
                    "nested.floatScalar": 1,
                    "nested.enumScalar": 1,
                }
            }, {
                description: "Should create projection for a request with dependent resolvers",
                query: `
                query {
                    test {
                        resolveSpecificDependencies
                    }
                }`,
                expectedProjection: {
                    "nested.stringScalar": 1,
                    "nested.intScalar": 1
                }
            }, {
                description: "Should create projection for a request with inline fragments",
                query: `
                query {
                    test {
                        nestedInterface {
                            stringScalar
                            ... on Nested {
                                typeSpecificScalar
                            }
                        }
                    }
                }`,
                expectedProjection: {
                    "nestedInterface.stringScalar": 1,
                    "nestedInterface.typeSpecificScalar": 1
                }
            }, {
                description: "Should not project a supposedly resolved field",
                query: `
                query {
                    test {
                        stringScalar
                        intScalar
                    }
                }`,
                expectedProjection: {
                    "intScalar": 1
                },
                isResolvedField: field => !!field.resolve || field.name === "stringScalar"
            }, {
                description: "Should create projection for a request",
                query: `
                query {
                    test {
                        stringScalar
                        intScalar
                        nested {
                            floatScalar
                            enumScalar
                        }
                        nestedList {
                            enumList
                            recursive {
                                stringList
                                recursive {
                                    intList
                                }
                            }
                        }
                        nestedInterface {
                            ... on Nested {
                                typeSpecificScalar
                            }
                        }
                        resolveCommonDependencies
                        ...fieldsA
                    }
                }
        
                fragment fieldsA on Object {
                    nestedList {
                        floatScalar
                        enumScalar
                    }
                }`,
                expectedProjection: {
                    "stringScalar": 1,
                    "intScalar": 1,
                    "nested": 1,
                    "nestedList.floatScalar": 1,
                    "nestedList.enumScalar": 1,
                    "nestedList.enumList": 1,
                    "nestedList.recursive.stringList": 1,
                    "nestedList.recursive.recursive.intList": 1,
                    "nestedInterface.typeSpecificScalar": 1
                }
            }
        ];

        tests.forEach(test => it(test.description, () => {
            // Arrange
            const query = test.query;
            const { info } = fieldResolve(ObjectType, query);

            // Act
            const projection = getMongoDbProjection(info, ObjectType, { isResolvedField: test.isResolvedField, excludedFields: test.exckudedField || [] });

            // Assert
            expect(projection).to.deep.equal(test.expectedProjection, "should produce a correct projection")
        }));
    });
});
