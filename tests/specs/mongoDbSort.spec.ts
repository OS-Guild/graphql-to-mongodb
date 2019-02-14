import { expect } from "chai";
import getMongoDbSort, { SortArg, MongoDbSort } from "../../src/mongoDbSort";

describe("mongoDbSort", () => {
    describe("getMongoDbSort", () => {
        const tests: { name: string, sortArg: SortArg, expectedMongoDbSort: MongoDbSort }[] = [{
            name: "Should parse scalar sort",
            sortArg: {
                stringScalar: 1
            },
            expectedMongoDbSort: {
                stringScalar: 1
            }
        }, {
            name: "Should parse nested sort",
            sortArg: {
                nested: {
                    stringScalar: 1
                }
            },
            expectedMongoDbSort: {
                "nested.stringScalar": 1
            }
        }, {
            name: "Should parse sort arg",
            sortArg: {
                nested: {
                    stringScalar: 1
                },
                stringScalar: -1,
                nestedAlso: {
                    floatScalar: -1
                }
            },
            expectedMongoDbSort: {
                "nested.stringScalar": 1,
                "stringScalar": -1,
                "nestedAlso.floatScalar": -1
            }
        }];

        tests.forEach(test => it(test.name, () => {
            // Act
            const actualMongoDbSort = getMongoDbSort(test.sortArg);

            // Assert
            expect(actualMongoDbSort).to.deep.equal(test.expectedMongoDbSort, "Actual mongodb sort object does not match expected");
        }));
    });
});
