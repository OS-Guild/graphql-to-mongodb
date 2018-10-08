import { getMongoDbProjection, getRequestedFields, getProjection, getResolveFieldsDependencies, mergeProjectionAndResolveDependencies, ProjectionField, MongoDbProjection } from "../../src/mongoDbProjection";
import { ObjectType } from "../utils/types";
import fieldResolve from "../utils/fieldResolve";
import { expect } from "chai";

describe("mongoDbProjection", () => {
    const queries = {
        simple: `
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
        nested: `
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
        fragments: `
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
        resolvers: `
        query {
            test {
                resolveSpecificDependencies
            }
        }`,
        full: `
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
        }`
    };

    describe("getMongoDbProjection", () => {
        const tests: { description: string, query: string, expectedProjection: any }[] = [
            {
                description: "Should create projection for a simple request",
                query: queries.simple,
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
                query: queries.nested,
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
                query: queries.fragments,
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
                query: queries.resolvers,
                expectedProjection: {
                    "nested.stringScalar": 1,
                    "nested.intScalar": 1
                }
            }, {
                description: "Should create projection for a request",
                query: queries.full,
                expectedProjection: {
                    "stringScalar": 1,
                    "intScalar": 1,
                    "nested": 1,
                    "nestedList.floatScalar": 1,
                    "nestedList.enumScalar": 1,
                    "nestedList.enumList": 1,
                }
            }
        ];

        tests.forEach(test => it(test.description, () => {
            // Arrange
            const query = test.query;
            const { info } = fieldResolve(ObjectType, query);

            // Act
            const projection = getMongoDbProjection(info, ObjectType);

            // Assert
            expect(test.expectedProjection).to.deep.equal(projection, "should produce a correct projection")
        }));
    });
    describe("getRequestedFields", () => {
        const tests: { description: string, query: string, expecteFields: ProjectionField }[] = [
            {
                description: "Should get fields of a simple request",
                query: queries.simple,
                expecteFields: {
                    stringScalar: 1,
                    intScalar: 1,
                    floatScalar: 1,
                    enumScalar: 1,
                    stringList: 1,
                    intList: 1,
                    floatList: 1,
                    enumList: 1,
                }
            }, {
                description: "Should get fields of a nested request",
                query: queries.nested,
                expecteFields: {
                    nested: {
                        stringScalar: 1,
                        intScalar: 1,
                        floatScalar: 1,
                        enumScalar: 1,
                        stringList: 1,
                        intList: 1,
                        floatList: 1,
                        enumList: 1,
                    }
                }
            }, {
                description: "Should get fields of a request with fragments",
                query: queries.fragments,
                expecteFields: {
                    stringScalar: 1,
                    intScalar: 1,
                    floatScalar: 1,
                    enumScalar: 1,
                    intList: 1,
                    floatList: 1,
                    enumList: 1,
                    nested: {
                        stringScalar: 1,
                        intScalar: 1,
                        floatScalar: 1,
                        enumScalar: 1,
                    }
                }
            }, {
                description: "Should get fields of a request",
                query: queries.full,
                expecteFields: {
                    stringScalar: 1,
                    intScalar: 1,
                    nested: {
                        floatScalar: 1,
                        enumScalar: 1,
                    },
                    nestedList: {
                        enumList: 1,
                        floatScalar: 1,
                        enumScalar: 1,
                    },
                    resolveCommonDependencies: 1
                }
            }
        ];

        tests.forEach(test => it(test.description, () => {
            // Arrange
            const query = test.query;
            const { info } = fieldResolve(ObjectType, query);

            // Act
            const fields = getRequestedFields(info);

            // Assert
            expect(test.expecteFields).to.deep.equal(fields, "should derivce correct requested fields")
        }));
    });
    describe("getProjection", () => {
        const tests: { description: string, fieldNode: ProjectionField, expectedProjection: MongoDbProjection }[] = [
            {
                description: "Should get projection of a simple request",
                fieldNode: {
                    stringScalar: 1,
                    enumScalar: 1,
                    intList: 1,
                    enumList: 1,
                },
                expectedProjection: {
                    "stringScalar": 1,
                    "enumScalar": 1,
                    "intList": 1,
                    "enumList": 1
                }
            },
            {
                description: "Should get projection of a nested request",
                fieldNode: {
                    nested: {
                        stringScalar: 1,
                        enumScalar: 1,
                        intList: 1,
                        enumList: 1,
                    },
                    nestedList: {
                        stringScalar: 1,
                        enumScalar: 1,
                        intList: 1,
                        enumList: 1,
                    }
                },
                expectedProjection: {
                    "nested.stringScalar": 1,
                    "nested.enumScalar": 1,
                    "nested.intList": 1,
                    "nested.enumList": 1,
                    "nestedList.stringScalar": 1,
                    "nestedList.enumScalar": 1,
                    "nestedList.intList": 1,
                    "nestedList.enumList": 1
                }
            },
            {
                description: "Should get projection of a request with resolvers",
                fieldNode: {
                    intScalar: 1,
                    resolveSpecificDependencies: 1,
                    resolveCommonDependencies: 1,
                    resolveObject: 1
                },
                expectedProjection: {
                    "intScalar": 1
                }
            },
            {
                description: "Should get projection",
                fieldNode: {
                    enumScalar: 1,
                    intList: 1,
                    nested: {
                        floatScalar: 1,
                    },
                    resolveSpecificDependencies: 1,
                },
                expectedProjection: {
                    "enumScalar": 1,
                    "intList": 1,
                    "nested.floatScalar": 1,
                }
            },
        ];

        tests.forEach(test => it(test.description, () => {
            // Act
            const projection = getProjection(test.fieldNode, ObjectType);

            // Assert
            expect(test.expectedProjection).to.deep.equal(projection, "should produce correct projection")
        }));
    });
    describe("getResolveFieldsDependencies", () => {
        const tests: { description: string, fieldNode: ProjectionField, expectedDependencies: string[] }[] = [{
            description: "Should get resolve fields dependencies of scalars",
            fieldNode: {
                resolveSpecificDependencies: 1
            },
            expectedDependencies: ["nested.stringScalar", "nested.intScalar"]
        }, {
            description: "Should get resolve fields dependencies of objects",
            fieldNode: {
                resolveObject: 1
            },
            expectedDependencies: ["stringScalar"]
        }, {
            description: "Should get resolve fields dependencies of nested",
            fieldNode: {
                nested: {
                    resolveScalar: 1
                }
            },
            expectedDependencies: ["nested.stringScalar"]
        }, {
            description: "Should get resolve fields dependencies",
            fieldNode: {
                resolveSpecificDependencies: 1,
                resolveCommonDependencies: 1,
                resolveObject: 1,
                nested: {
                    resolveScalar: 1
                }
            },
            expectedDependencies: ["nested.stringScalar", "nested.intScalar", "nested", "stringScalar", "nested.stringScalar"]
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const dependencies = getResolveFieldsDependencies(test.fieldNode, ObjectType);

            // Assert
            expect(test.expectedDependencies).to.deep.equal(dependencies, "Should extract correct resolver dependencies");
        }));
    });
    describe("mergeProjectionAndResolveDependencies", () => {
        const tests: { description: string, projection: MongoDbProjection, resolverDependencies: string[], expectedProjection: MongoDbProjection }[] = [{
            description: "Should merge and replace projection of shorther dependencies",
            projection: {
                "nested.stringScalar": 1
            },
            resolverDependencies: [
                "nested"
            ],
            expectedProjection: {
                "nested": 1
            }
        }, {
            description: "Should ignore projection of existing dependencies",
            projection: {
                "stringScalar": 1
            },
            resolverDependencies: [
                "stringScalar"
            ],
            expectedProjection: {
                "stringScalar": 1
            }
        }, {
            description: "Should ignore projection of longer dependencies",
            projection: {
                "nested": 1
            },
            resolverDependencies: [
                "nested.stringScalar"
            ],
            expectedProjection: {
                "nested": 1
            }
        }, {
            description: "Should merge projection and dependencies",
            projection: {
                "stringScalar": 1,
                "nested.floatScalar": 1,
                "nested.stringScalar": 1,
                "nestedList.intScalar": 1,
                "someNested": 1
            },
            resolverDependencies: [
                "enumScalar",
                "nested",
                "nestedList.intList",
                "someNested.inner"
            ],
            expectedProjection: {
                "stringScalar": 1,
                "enumScalar": 1,
                "nested": 1,
                "nestedList.intScalar": 1,
                "nestedList.intList": 1,
                "someNested": 1
            }
        }]

        tests.forEach(test => it(test.description, () => {
            // Act
            const actualProjection = mergeProjectionAndResolveDependencies(test.projection, test.resolverDependencies);

            // Assert
            expect(test.expectedProjection).to.deep.equal(actualProjection, "Should merge projection and dependencies correctly");
        }));
    });
});