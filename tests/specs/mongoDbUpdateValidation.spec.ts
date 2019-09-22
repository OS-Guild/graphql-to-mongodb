import { ObjectType } from "../utils/types";
import { validateUpdateArgs, validateNonNullableFields, validateNonNullableFieldsAssert, validateNonNullListField, validateNonNullableFieldsTraverse, flattenListField, ShouldAssert } from "../../src/mongoDbUpdateValidation";
import { expect } from "chai";
import { GraphQLObjectType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLString, GraphQLField } from "graphql";
import { UpdateArgs } from "../../src/mongoDbUpdate";

describe("mongoDbUpdateValidation", () => {
    describe("validateUpdateArgs", () => {
        const tests: { description: string, type: GraphQLObjectType, updateArgs: UpdateArgs, expectedErrors: string[] }[] = [{
            description: "Should invalidate non-null on upsert",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    stringScalar: "x",
                },
                set: {
                    nonNullScalar: null
                }
            },
            expectedErrors: ["Missing non-nullable field \"nonNullList\"", "Non-nullable field \"nonNullScalar\" is set to null"]
        }, {
            description: "Should ignore non-null on update",
            type: ObjectType,
            updateArgs: {
                set: {
                    nonNullScalar: null
                }
            },
            expectedErrors: []
        }, {
            description: "Should invalidate non-null on update list item",
            type: ObjectType,
            updateArgs: {
                set: {
                    nonNullScalar: null,
                    nestedList: [{
                    }]
                }
            },
            expectedErrors: ["Missing non-nullable field \"nestedList.nonNullList\"", "Missing non-nullable field \"nestedList.nonNullScalar\""]
        }, {
            description: "Should validate update correct non-null",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    stringScalar: "x",
                },
                set: {
                    nonNullScalar: "x",
                    nonNullList: []
                }
            },
            expectedErrors: []
        }];

        tests.forEach(test => it(test.description, () => {
            // Arrange
            let error;

            // Act
            try {
                validateUpdateArgs(test.updateArgs, test.type, { overwrite: false });
            } catch (err) {
                error = err;
            }

            // Assert
            if (test.expectedErrors.length > 0) {
                expect(error, "error object expected").to.not.be.undefined;

                const errorString: string = typeof error == "string" ? error : (error as Error).message;
                const errors = errorString.split("\n");
                expect(errors).to.have.members(test.expectedErrors, "Should detect correct errors");
            } else {
                if (error) throw error
            }
        }));
    });

    describe("validateNonNullableFields", () => {
        const tests: { description: string, type: GraphQLObjectType, updateArgs: UpdateArgs, expectedErrors: string[] }[] = [{
            description: "Should invalidate root fields",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    stringScalar: "x",
                },
                set: {
                    nonNullScalar: null
                }
            },
            expectedErrors: ["Missing non-nullable field \"nonNullList\"", "Non-nullable field \"nonNullScalar\" is set to null"]
        }, {
            description: "Should invalidate nested fields",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    stringScalar: "x",
                    nested: {
                        stringScalar: "x",
                    }
                },
                set: {
                    nonNullScalar: "x",
                    nonNullList: [],
                    nested: {
                        nonNullList: []
                    }
                }
            },
            expectedErrors: ["Missing non-nullable field \"nested.nonNullScalar\""]
        }, {
            description: "Should invalidate full hierarchy",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    stringScalar: "x",
                    nested: {
                        stringScalar: "x",
                    },
                    listOfNonNulls: ["x", null],
                    nestedList: [{
                        nonNullScalar: "x"
                    }]
                },
                set: {
                    nonNullList: null,
                    nested: {
                        nonNullList: []
                    }
                }
            },
            expectedErrors: [
                "Missing non-nullable field \"nonNullScalar\"",
                "Non-nullable field \"nonNullList\" is set to null",
                "Non-nullable element of array \"listOfNonNulls\" is set to null",
                "Missing non-nullable field \"nested.nonNullScalar\"",
                "Missing non-nullable field \"nestedList.nonNullList\""
            ]
        }, {
            description: "Should validate valid update args",
            type: ObjectType,
            updateArgs: {
                setOnInsert: {
                    nested: {
                        nonNullScalar: "x",
                    },
                    nonNullList: [],
                    listOfNonNulls: ["x"]
                },
                set: {
                    nonNullScalar: "x",
                    nested: {
                        nonNullList: []
                    }
                }
            },
            expectedErrors: []
        }];

        tests.forEach(test => it(test.description, () => {
            // Arrange
            const objects = Object.keys(test.updateArgs).map(_ => test.updateArgs[_]);

            // Act
            const errors = validateNonNullableFields(objects, test.type, ShouldAssert.True);

            // Assert
            expect(errors).to.have.members(test.expectedErrors, "Should detect correct errors");
        }));
    });

    describe("validateNonNullableFieldsAssert", () => {
        const tests: { description: string, objects: object[], type: GraphQLObjectType, path?: string[], expectedErrors: string[] }[] = [{
            description: "Should invalidate a missing non-nullable field",
            type: ObjectType,
            objects: [{ stringScalar: "x" }, { nonNullList: [] }],
            expectedErrors: ["Missing non-nullable field \"nonNullScalar\""]
        }, {
            description: "Should invalidate a nulled non-nullable field",
            type: ObjectType,
            objects: [{ stringScalar: "x", nonNullScalar: null }, { nonNullList: [] }],
            expectedErrors: ["Non-nullable field \"nonNullScalar\" is set to null"]
        }, {
            description: "Should invalidate a null element of a list of non-nullables",
            type: ObjectType,
            objects: [{ stringScalar: "x", nonNullScalar: 'x' }, { nonNullList: [], listOfNonNulls: [null] }],
            expectedErrors: ["Non-nullable element of array \"listOfNonNulls\" is set to null"]
        }, {
            description: "Should add perfix path to error",
            type: ObjectType,
            objects: [{ stringScalar: "x" }, { nonNullList: [] }],
            path: ["nested"],
            expectedErrors: ["Missing non-nullable field \"nested._id\"", "Missing non-nullable field \"nested.nonNullScalar\""]
        }, {
            description: "Should concat multiple errors",
            type: ObjectType,
            objects: [{ stringScalar: "x" }, { nonNullList: null }],
            expectedErrors: ["Missing non-nullable field \"nonNullScalar\"", "Non-nullable field \"nonNullList\" is set to null"]
        }, {
            description: "Should validate valid update args, and ignore non-null root _id",
            type: ObjectType,
            objects: [{ stringScalar: "x", nonNullScalar: 'x' }, { nonNullList: [] }],
            expectedErrors: []
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const errors = validateNonNullableFieldsAssert(test.objects, test.type.getFields(), test.path);

            // Assert
            expect(errors).to.have.members(test.expectedErrors, "Should detect correct errors");
        }));
    });

    describe("validateNonNullListField", () => {
        const tests: { description: string, values: object[], type: GraphQLType, expectedResult: boolean }[] = [{
            description: "Should invalidate a nulled non-nullable list",
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            values: [[], null, ["X"]],
            expectedResult: false
        }, {
            description: "Should invalidate a list of non-nullables with a null element",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
            values: [["x", null], ["X"]],
            expectedResult: false
        }, {
            description: "Should invalidate a list of a list of non-nullables with a null element",
            type: new GraphQLList(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            values: [[["x", null]], []],
            expectedResult: false
        }, {
            description: "Should validate a non-nullable list",
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            values: [[null], []],
            expectedResult: true
        }, {
            description: "Should validate a list of non-nullables",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
            values: [null, ["x"], null],
            expectedResult: true
        }, {
            description: "Should validate a list of a list of non-nullables",
            type: new GraphQLList(new GraphQLList(new GraphQLNonNull(GraphQLString))),
            values: [null, [null, ["x"]]],
            expectedResult: true
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const result = validateNonNullListField(test.values, test.type);

            // Assert
            expect(test.expectedResult).to.equal(result);
        }));
    });

    describe("validateNonNullableFieldsTraverse", () => {
        const tests: { description: string, objects: object[], type: GraphQLObjectType, path?: string[], isResolvedField?: (field: GraphQLField<any, any>) => boolean, expectedErrors: string[] }[] = [{
            description: 'Should invalidate field in nested object',
            type: ObjectType,
            objects: [{ nested: { nonNullList: [] } }, { nested: { stringScalar: "x" } }],
            expectedErrors: ["Missing non-nullable field \"nested.nonNullScalar\""]
        }, {
            description: 'Should invalidate field in a nested list',
            type: ObjectType,
            objects: [{ nestedList: [null, { nonNullList: [] }] }],
            expectedErrors: ["Missing non-nullable field \"nestedList.nonNullScalar\""]
        }, {
            description: 'Should invalidate fields in multiple objects',
            type: ObjectType,
            objects: [{ nestedList: [{ nonNullList: [] }], nested: { stringScalar: 'x' } }, { nested: { nonNullScalar: null } }],
            expectedErrors: [
                "Missing non-nullable field \"nestedList.nonNullScalar\"",
                "Non-nullable field \"nested.nonNullScalar\" is set to null",
                "Missing non-nullable field \"nested.nonNullList\""
            ]
        }, {
            description: 'Should validate a valid update',
            type: ObjectType,
            objects: [{ nested: { nonNullList: [] } }, { nested: { nonNullScalar: "x" } }],
            expectedErrors: []
        }, {
            description: 'Should validate at traverse end',
            type: ObjectType,
            objects: [{ stringScalar: 'x' }],
            expectedErrors: []
        }];

        tests.forEach(test => it(test.description, () => {
            // act
            const errors = validateNonNullableFieldsTraverse(test.objects, test.type.getFields(), ShouldAssert.True, test.isResolvedField, test.path);

            // Assert
            expect(errors).to.have.members(test.expectedErrors, "Should detect correct errors");
        }));
    });

    describe("flattenListField", () => {
        const tests: { description: string, type: GraphQLType, objects: object[], expectedResult: object[] }[] = [{
            description: "Should flatten list",
            type: new GraphQLList(ObjectType),
            objects: [[{ stringScalar: "a" }, { stringScalar: "b" }], [{ stringScalar: "c" }]],
            expectedResult: [{ stringScalar: "a" }, { stringScalar: "b" }, { stringScalar: "c" }]
        }, {
            description: "Should flatten nested list",
            type: new GraphQLList(new GraphQLList(ObjectType)),
            objects: [[[{ stringScalar: "a" }, { stringScalar: "b" }], [{ stringScalar: "c" }]], [[{ stringScalar: "d" }]]],
            expectedResult: [{ stringScalar: "a" }, { stringScalar: "b" }, { stringScalar: "c" }, { stringScalar: "d" }]
        }, {
            description: "Should filter nulls",
            type: new GraphQLList(new GraphQLList(ObjectType)),
            objects: [[[null, { stringScalar: "a" }, null, { stringScalar: "b" }, null], null, [{ stringScalar: "c" }]], [[{ stringScalar: "d" }], null]],
            expectedResult: [{ stringScalar: "a" }, { stringScalar: "b" }, { stringScalar: "c" }, { stringScalar: "d" }]
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const result = flattenListField(test.objects, test.type);

            // Assert
            expect(result).to.deep.equal(test.expectedResult, "Should flatten list field correctly");
        }));
    });
});
