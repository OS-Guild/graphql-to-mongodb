import assert from 'assert';
import getMongoDbFilter from '../../src/mongoDbFilter'
import { OprType, OprEqType, OprExistsType } from '../../src/graphQLFilterType'
import {
    GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt,
    GraphQLBoolean, GraphQLInputObjectType, GraphQLSchema, GraphQLScalarType, GraphQLEnumType
} from 'graphql';

describe('graphql filter', () => {

    it('should create scalar filter', () => {
        const graphQLFilter = {
            someEQL: {
                opr: OprType._enumConfig.values.EQL.value,
                value: "some-eql"
            },
            someGT: {
                opr: OprType._enumConfig.values.GT.value,
                value: "some-gt"
            },
            someGTE: {
                opr: OprType._enumConfig.values.GTE.value,
                value: "some-gte"
            },
            someIN: {
                opr: OprType._enumConfig.values.IN.value,
                values: ["some-in", "another-in"]
            },
            someLT: {
                opr: OprType._enumConfig.values.LT.value,
                value: "some-lt"
            },
            someLTE: {
                opr: OprType._enumConfig.values.LTE.value,
                value: "some-lte"
            },
            someNE: {
                opr: OprType._enumConfig.values.NE.value,
                value: "some-ne"
            },
            someNIN: {
                opr: OprType._enumConfig.values.NIN.value,
                values: ["some-nin", "another-nin"]
            },
        };

        const expectedMongoDbFilter = {
            someEQL: { $eq: "some-eql" },
            someGT: { $gt: "some-gt" },
            someGTE: { $gte: "some-gte" },
            someIN: { $in: ["some-in", "another-in"] },
            someLT: { $lt: "some-lt" },
            someLTE: { $lte: "some-lte" },
            someNE: { $ne: "some-ne" },
            someNIN: { $nin: ["some-nin", "another-nin"] }
        }

        const resultMongoDbFilter = getMongoDbFilter(graphQLFilter);

        assert.deepStrictEqual(resultMongoDbFilter, expectedMongoDbFilter);
    });

    it('should collapse hierarchy', () => {
        const graphQLFilter = {
            someField: {
                opr: OprType._enumConfig.values.EQL.value,
                value: "someValue"
            },
            nested: {
                someNestedField: {
                    opr: OprType._enumConfig.values.NE.value,
                    value: "someNestedValue"
                },
                anotherNestedField: {
                    opr: OprType._enumConfig.values.NE.value,
                    value: "anotherNestedValue"
                }
            }
        };

        const expectedMongoDbFilter = {
            someField: { $eq: "someValue" },
            "nested.someNestedField": { $ne: "someNestedValue" },
            "nested.anotherNestedField": { $ne: "anotherNestedValue" },
        }

        const resultMongoDbFilter = getMongoDbFilter(graphQLFilter);

        assert.deepStrictEqual(resultMongoDbFilter, expectedMongoDbFilter);
    });

    it('should handle exists operator in nested objects', () => {
        const graphQLFilter = {
            nestedExists: {
                opr: OprExistsType._enumConfig.values.EXISTS.value
            },
            nestedNotExists: {
                opr: OprExistsType._enumConfig.values.NOT_EXISTS.value
            }
        };

        const expectedMongoDbFilter = {
            nestedExists: { $exists: true },
            nestedNotExists: { $exists: false }
        }

        const resultMongoDbFilter = getMongoDbFilter(graphQLFilter);

        assert.deepStrictEqual(resultMongoDbFilter, expectedMongoDbFilter);
    });



    it('should handle OR and AND operators at root', () => {
        const graphQLFilter = {
            OR: [
                {
                    someField: {
                        opr: OprType._enumConfig.values.EQL.value,
                        value: "someValue"
                    }
                }, {
                    someField: {
                        opr: OprType._enumConfig.values.NE.value,
                        value: "someOtherValue"
                    }
                }, {
                    AND: [
                        {
                            someField: {
                                opr: OprType._enumConfig.values.GT.value,
                                value: "thirdValue"
                            }
                        }, {
                            someField: {
                                opr: OprType._enumConfig.values.LTE.value,
                                value: "fourthValue"
                            }
                        }]
                }],
            AND: [
                {
                    someField: {
                        opr: OprType._enumConfig.values.EQL.value,
                        value: "someValue"
                    }
                }, {
                    someField: {
                        opr: OprType._enumConfig.values.NE.value,
                        value: "someOtherValue"
                    }
                }, {
                    OR: [
                        {
                            someField: {
                                opr: OprType._enumConfig.values.GT.value,
                                value: "thirdValue"
                            }
                        }, {
                            someField: {
                                opr: OprType._enumConfig.values.LTE.value,
                                value: "fourthValue"
                            }
                        }]
                }]
        };

        const expectedMongoDbFilter = {
            $or: [
                { someField: { $eq: "someValue" } },
                { someField: { $ne: "someOtherValue" } },
                {
                    $and: [
                        { someField: { $gt: "thirdValue" } },
                        { someField: { $lte: "fourthValue" } },
                    ]
                }
            ],
            $and: [
                { someField: { $eq: "someValue" } },
                { someField: { $ne: "someOtherValue" } },
                {
                    $or: [
                        { someField: { $gt: "thirdValue" } },
                        { someField: { $lte: "fourthValue" } },
                    ]
                }
            ]
        }

        const resultMongoDbFilter = getMongoDbFilter(graphQLFilter);

        assert.deepStrictEqual(resultMongoDbFilter, expectedMongoDbFilter);
    });
});