import { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLEnumType, GraphQLFloat, GraphQLNonNull, GraphQLInterfaceType, GraphQLID } from "graphql";

export const CharactersEnum = new GraphQLEnumType({
    name: "Characters",
    values: {
        A: { value: "A" },
        B: { value: "B" },
        C: { value: "C" },
    }
});



export const NestedInterfaceType = new GraphQLInterfaceType({
    name: "NestedInterface",
    fields: () => ({
        stringScalar: { type: GraphQLString },
        intScalar: { type: GraphQLInt },
        floatScalar: { type: GraphQLFloat },
        enumScalar: { type: CharactersEnum },

        stringList: { type: new GraphQLList(GraphQLString) },
        intList: { type: new GraphQLList(GraphQLInt) },
        floatList: { type: new GraphQLList(GraphQLFloat) },
        enumList: { type: new GraphQLList(CharactersEnum) },
        
        nonNullScalar: { type: new GraphQLNonNull(GraphQLString) },
        nonNullList: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        listOfNonNulls: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },

        recursive: { type: NestedType },

        resolveScalar: {
            type: GraphQLString,
            resolve: obj => obj.stringScalar,
            dependencies: ["stringScalar"]
        },
        resolveObject: {
            type: NestedType,
            resolve: obj => ({ stringScalar: obj.stringScalar }),
            dependencies: ["stringScalar"]
        },
    })
});

export const NestedType = new GraphQLObjectType({
    name: "Nested",
    fields: () => ({
        stringScalar: { type: GraphQLString },
        intScalar: { type: GraphQLInt },
        floatScalar: { type: GraphQLFloat },
        enumScalar: { type: CharactersEnum },

        stringList: { type: new GraphQLList(GraphQLString) },
        intList: { type: new GraphQLList(GraphQLInt) },
        floatList: { type: new GraphQLList(GraphQLFloat) },
        enumList: { type: new GraphQLList(CharactersEnum) },
        
        nonNullScalar: { type: new GraphQLNonNull(GraphQLString) },
        nonNullList: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        listOfNonNulls: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },

        recursive: { type: NestedType },

        resolveScalar: {
            type: GraphQLString,
            resolve: obj => obj.stringScalar,
            dependencies: ["stringScalar"]
        },
        resolveObject: {
            type: NestedType,
            resolve: obj => ({ stringScalar: obj.stringScalar }),
            dependencies: ["stringScalar"]
        },
        
        typeSpecificScalar: { type: GraphQLString },
    }),
    interfaces: [NestedInterfaceType]
});

export const ObjectType = new GraphQLObjectType({
    name: "Object",
    fields: () => ({
        _id: { type: new GraphQLNonNull(GraphQLID) },

        stringScalar: { type: GraphQLString },
        intScalar: { type: GraphQLInt },
        floatScalar: { type: GraphQLFloat },
        enumScalar: { type: CharactersEnum },

        stringList: { type: new GraphQLList(GraphQLString) },
        intList: { type: new GraphQLList(GraphQLInt) },
        floatList: { type: new GraphQLList(GraphQLFloat) },
        enumList: { type: new GraphQLList(CharactersEnum) },

        nested: { type: NestedType },
        nestedList: { type: new GraphQLList(NestedType) },
        nestedInterface: { type: NestedInterfaceType },

        nonNullScalar: { type: new GraphQLNonNull(GraphQLString) },
        nonNullList: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        listOfNonNulls: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },

        resolveSpecificDependencies: {
            type: GraphQLString,
            resolve: obj => `${obj.nested.stringScalar} ${obj.nested.intScalar}`,
            dependencies: ["nested.stringScalar", "nested.intScalar"]
        },
        resolveCommonDependencies: {
            type: GraphQLString,
            resolve: obj => `${obj.nested.stringScalar} ${obj.nested.intScalar}`,
            dependencies: ["nested"]
        },
        resolveObject: {
            type: NestedType,
            resolve: obj => ({ stringScalar: obj.stringScalar }),
            dependencies: ["stringScalar"]
        },
    })
});

export const InterfaceType = new GraphQLInterfaceType({
    name: "Interface",
    fields: () => ({
        stringScalar: { type: GraphQLString },
        intScalar: { type: GraphQLInt },
        floatScalar: { type: GraphQLFloat },
        enumScalar: { type: CharactersEnum },

        stringList: { type: new GraphQLList(GraphQLString) },
        intList: { type: new GraphQLList(GraphQLInt) },
        floatList: { type: new GraphQLList(GraphQLFloat) },
        enumList: { type: new GraphQLList(CharactersEnum) },

        nested: { type: NestedInterfaceType },
        nestedList: { type: new GraphQLList(NestedInterfaceType) },

        nonNullScalar: { type: new GraphQLNonNull(GraphQLString) },
        nonNullList: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        listOfNonNulls: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },

        resolveSpecificDependencies: {
            type: GraphQLString,
            resolve: obj => `${obj.nested.stringScalar} ${obj.nested.intScalar}`,
            dependencies: ["nested.stringScalar", "nested.intScalar"]
        },
        resolveCommonDependencies: {
            type: GraphQLString,
            resolve: obj => `${obj.nested.stringScalar} ${obj.nested.intScalar}`,
            dependencies: ["nested"]
        },
        resolveObject: {
            type: NestedInterfaceType,
            resolve: obj => ({ stringScalar: obj.stringScalar }),
            dependencies: ["stringScalar"]
        },
    })
});
