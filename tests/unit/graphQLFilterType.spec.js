import assert from 'assert';
import { getGraphQLFilterType, clearTypeCache, OprType, OprEqType, OprExistsType } from '../../src/graphQLFilterType'
import {
    GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLInt,
    GraphQLBoolean, GraphQLInputObjectType, GraphQLSchema, GraphQLScalarType, GraphQLEnumType
} from 'graphql';

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
        if (type instanceof GraphQLNonNull) {
            return { ...structure, [key]: type.ofType.toString() };
        }
        if (type instanceof GraphQLList) {
            return { ...structure, [key]: type.ofType.toString() };
        }

        return { ...structure, [key]: getFieldStructure(type) };

    }, {});
}