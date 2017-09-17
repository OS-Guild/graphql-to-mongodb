import assert from 'assert';
import { getGraphQLFilterType, clearTypeCache, OprType, OprEqType, OprExistsType } from '../../src/graphQLFilterType'
import getMongoDbFilter from '../../src/mongoDbFilter'
import {
    GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt,
    GraphQLBoolean, GraphQLInputObjectType, GraphQLSchema, GraphQLScalarType, GraphQLEnumType
} from 'graphql';

describe('graphql filter', () => {
    describe('getGraphQLFilterType', () => {

        beforeEach(clearTypeCache);

        it('Should create a basic AND, OR, field layout, AND and OR are self refferencing lists, and the simple field uses a scalar input', () => {
            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someField: { type: GraphQLString }
                }
            });

            const stringInputType = new GraphQLInputObjectType({
                name: "StringInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someField: { type: stringInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType);
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });

        it('Should work with all scalars, each type gets a coresponding scalar input type', () => {
            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someString: { type: GraphQLString },
                    someInt: { type: GraphQLInt },
                    someBool: { type: GraphQLBoolean }
                }
            });

            const stringInputType = new GraphQLInputObjectType({
                name: "StringInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const intInputType = new GraphQLInputObjectType({
                name: "IntInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLInt },
                    values: { type: new GraphQLList(GraphQLInt) }
                }
            });

            const boolInputType = new GraphQLInputObjectType({
                name: "BooleanInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLBoolean },
                    values: { type: new GraphQLList(GraphQLBoolean) }
                }
            });

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someString: { type: stringInputType },
                    someInt: { type: intInputType },
                    someBool: { type: boolInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType);
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });

        it('Should work with non-nullable and list scalars, non-nullables are treated as nullables and lists get the reduced InArray scalar input type', () => {

            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someList: { type: new GraphQLList(GraphQLString) },
                    someNullable: { type: new GraphQLNonNull(GraphQLString) },
                }
            });

            const stringInputType = new GraphQLInputObjectType({
                name: "StringInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const stringInArrayInputType = new GraphQLInputObjectType({
                name: "StringInArrayInput",
                fields: {
                    opr: { type: OprEqType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someList: { type: stringInArrayInputType },
                    someNullable: { type: stringInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType);
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });

        it('Should work with nested types, nested types also get an opr OprExists field', () => {

            const getSomeNestedType = () => new GraphQLObjectType({
                name: "SomeNestedType",
                fields: {
                    someString: { type: GraphQLString },
                    someInt: { type: GraphQLInt },
                    someBool: { type: GraphQLBoolean },
                    someList: { type: new GraphQLList(GraphQLString) },
                    someNullable: { type: new GraphQLNonNull(GraphQLString) }
                }
            });

            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someNested: { type: getSomeNestedType() },
                }
            });

            const stringInputType = new GraphQLInputObjectType({
                name: "StringInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const stringEqInputType = new GraphQLInputObjectType({
                name: "StringEqInput",
                fields: {
                    opr: { type: OprEqType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const intInputType = new GraphQLInputObjectType({
                name: "IntInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLInt },
                    values: { type: new GraphQLList(GraphQLInt) }
                }
            });

            const boolInputType = new GraphQLInputObjectType({
                name: "BooleanInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLBoolean },
                    values: { type: new GraphQLList(GraphQLBoolean) }
                }
            });

            const expectedNestedInputType = new GraphQLInputObjectType({
                name: "SomeNestedInputType",
                fields: () => ({
                    opr: { type: OprExistsType },
                    someString: { type: stringInputType },
                    someInt: { type: intInputType },
                    someBool: { type: boolInputType },
                    someList: { type: stringEqInputType },
                    someNullable: { type: stringInputType },
                })
            })

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someNested: { type: expectedNestedInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType);
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });

        it('Should work with nested type lists, all fields in nested lists recieve the reduced InArray scalar input type', () => {

            const getSomeNestedType = () => new GraphQLObjectType({
                name: "SomeNestedType",
                fields: {
                    someString: { type: GraphQLString },
                    someInt: { type: GraphQLInt },
                    someBool: { type: GraphQLBoolean },
                    someList: { type: new GraphQLList(GraphQLString) },
                    someNullable: { type: new GraphQLNonNull(GraphQLString) }
                }
            });

            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someNested: { type: new GraphQLList(getSomeNestedType()) },
                }
            });

            const stringEqInputType = new GraphQLInputObjectType({
                name: "StringEqInput",
                fields: {
                    opr: { type: OprEqType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const intEqInputType = new GraphQLInputObjectType({
                name: "IntEqInput",
                fields: {
                    opr: { type: OprEqType },
                    value: { type: GraphQLInt },
                    values: { type: new GraphQLList(GraphQLInt) }
                }
            });

            const booleanEqInputType = new GraphQLInputObjectType({
                name: "BooleanEqInput",
                fields: {
                    opr: { type: OprEqType },
                    value: { type: GraphQLBoolean },
                    values: { type: new GraphQLList(GraphQLBoolean) }
                }
            });

            const expectedNestedInputType = new GraphQLInputObjectType({
                name: "SomeNestedInputType",
                fields: () => ({
                    opr: { type: OprExistsType },
                    someString: { type: stringEqInputType },
                    someInt: { type: intEqInputType },
                    someBool: { type: booleanEqInputType },
                    someList: { type: stringEqInputType },
                    someNullable: { type: stringEqInputType },
                })
            })

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someNested: { type: expectedNestedInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType);
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });

        it('Should ignore exluded root fields and fields with resolvers', () => {

            const getSomeNestedType = () => new GraphQLObjectType({
                name: "SomeNestedType",
                fields: {
                    someField: { type: GraphQLString },
                    someNestedFieldWithResolver: { type: GraphQLString, resolve: (obj, args, { db }) => (null) },
                }
            });

            const getSomeType = () => new GraphQLObjectType({
                name: "SomeType",
                fields: {
                    someField: { type: GraphQLString },
                    someFieldWithResolver: { type: GraphQLString, resolve: (obj, args, { db }) => (null) },
                    someNested: { type: getSomeNestedType() },
                }
            });

            const stringInputType = new GraphQLInputObjectType({
                name: "StringInput",
                fields: {
                    opr: { type: OprType },
                    value: { type: GraphQLString },
                    values: { type: new GraphQLList(GraphQLString) }
                }
            });

            const expectedNestedInputType = new GraphQLInputObjectType({
                name: "SomeNestedInputType",
                fields: () => ({
                    opr: { type: OprExistsType },
                    someField: { type: stringInputType }
                })
            })

            const expectedFilterType = new GraphQLInputObjectType({
                name: "SomeFilterType",
                fields: () => ({
                    someNested: { type: expectedNestedInputType },
                    OR: { type: new GraphQLList(expectedFilterType) },
                    AND: { type: new GraphQLList(expectedFilterType) }
                })
            })

            let someType = getSomeType();
            const resultFilterType = getGraphQLFilterType(someType, "someField");
            resolveTypes(someType, resultFilterType);

            resolveTypes(getSomeType(), expectedFilterType);

            assert.deepStrictEqual(getFieldStructure(resultFilterType), getFieldStructure(expectedFilterType));
        });
    });

    describe('getMongoDbFilter', () => {

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
});

function resolveTypes(someType, filterType) {
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'RootQueryType',
            fields: {
                entity: {
                    type: someType,
                    args: { filter: { type: filterType } },
                    resolve: async (obj, { filter }, { db }) => ({})
                }
            }
        })
    })
}

function getFieldStructure(filterType, typeCaache = []) {
    const index = typeCaache.findIndex(_ => _ === filterType);
    if (index > -1) return typeCaache[index];
    typeCaache.push(filterType.toString());

    return Object.keys(filterType._fields).reduce((structure, key) => {
        const type = filterType._fields[key].type;

        if (type instanceof GraphQLScalarType ||
            type instanceof GraphQLEnumType) {
            return { ...structure, [key]: type.toString() };
        }
        if (type instanceof GraphQLList) {
            return { ...structure, [key]: type.ofType.toString() };
        }

        return { ...structure, [key]: getFieldStructure(type) };

    }, {});
}