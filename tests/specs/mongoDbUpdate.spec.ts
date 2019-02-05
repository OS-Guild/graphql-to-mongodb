import { getMongoDbUpdate, getMongoDbSet, getOverwrite, getMongoDbInc, SetOverwrite, IncObj, UpdateArgs, updateParams } from "../../src/mongoDbUpdate";
import { OVERWRITE, FICTIVE_INC } from "../../src/graphQLUpdateType";
import { expect } from "chai";

describe("mongoDbUpdate", () => {
    describe("getMongoDbUpdate", () => {
        const tests: { description: string, update: UpdateArgs, overwrite?: boolean, expected: updateParams }[] = [{
            description: "Should set upsert true when setOnInsert exists",
            update: {
                setOnInsert: {}
            },
            expected: {
                options: {
                    upsert: true
                },
                update: {
                    $setOnInsert: {}
                }
            }
        }, {
            description: "Should not set upsert true when setOnInsert doesn't exist",
            update: {
                set: {}
            },
            expected: {
                update: {
                    $set: {}
                }
            }
        }, {
            description: "Should get moongo db update params",
            update: {
                setOnInsert: {
                    object: {
                        scalar: 1
                    }
                },
                set: {
                    scalar: 1,
                    list: [2],
                    nested: {
                        scalar: 3,
                        nestedOverwrite: {
                            scalar: 4,
                            [OVERWRITE]: true,
                        }
                    },
                    nestedOverwrite: {
                        scalar: 5,
                        [OVERWRITE]: true,
                        nestedNested: {
                            scalar: 6,
                            [OVERWRITE]: false,
                        }
                    }
                },
                inc: {
                    intScalar: 2,
                    [FICTIVE_INC]: 3,
                    nested: {
                        intScalar: 4,
                        [FICTIVE_INC]: 5
                    },
                }
            },
            expected: {
                update: {
                    $setOnInsert: {
                        object: {
                            scalar: 1
                        }
                    },
                    $set: {
                        scalar: 1,
                        list: [2],
                        "nested.scalar": 3,
                        "nested.nestedOverwrite": {
                            scalar: 4
                        },
                        nestedOverwrite: {
                            scalar: 5,
                            nestedNested: {
                                scalar: 6
                            }
                        }
                    },
                    $inc: {
                        intScalar: 2,
                        "nested.intScalar": 4
                    }
                },
                options: {
                    upsert: true
                }
            }
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const mongoDbSet = getMongoDbUpdate(test.update, test.overwrite);

            // Assert
            expect(mongoDbSet).to.deep.equal(test.expected, "Should return expected update object");
        }));
    });

    describe("getMongoDbSet", () => {
        const now = Date();

        const tests: { description: string, set: object, setOverwrite: SetOverwrite, expected: object }[] = [{
            description: "Should get primitive fields",
            set: {
                intScalar: 1,
                stringScalar: "string",
                nullable: null,
                date: now,
                Boolean: false,
                undefined: undefined,
                [OVERWRITE]: false
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                intScalar: 1,
                stringScalar: "string",
                nullable: null,
                date: now,
                Boolean: false
            }
        }, {
            description: "Should get list fields",
            set: {
                emptyList: [],
                intList: [1],
                stringListList: [["asd"], []],
                emptyListList: [[], []]
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                emptyList: [],
                intList: [1],
                stringListList: [["asd"], []],
                emptyListList: [[], []]
            }
        }, {
            description: "Should get nested fields",
            set: {
                nested: {
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    undefined: undefined,
                    intList: [1],
                    stringListList: [["asd"], []]
                }
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                "nested.intScalar": 1,
                "nested.stringScalar": "string",
                "nested.nullable": null,
                "nested.date": now,
                "nested.Boolean": false,
                "nested.intList": [1],
                "nested.stringListList": [["asd"], []]
            }
        }, {
            description: "Should get nested list fields",
            set: {
                nested: [{
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    undefined: undefined,
                    intList: [1],
                    stringListList: [["asd"], []]
                }]
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                nested: [{
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    undefined: undefined,
                    intList: [1],
                    stringListList: [["asd"], []]
                }]
            }
        }, {
            description: "Should get overwrite nested item",
            set: {
                nested: {
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    undefined: undefined,
                    [OVERWRITE]: true,
                    intList: [1],
                    stringListList: [["asd"], []]
                }
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                nested: {
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    intList: [1],
                    stringListList: [["asd"], []]
                }
            }
        }, {
            description: "Should get overwrite nested nested item",
            set: {
                root: {
                    nested: {
                        intScalar: 1,
                        stringScalar: "string",
                        nullable: null,
                        date: now,
                        Boolean: false,
                        undefined: undefined,
                        [OVERWRITE]: true,
                        intList: [1],
                        stringListList: [["asd"], []]
                    }
                }
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                "root.nested": {
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    intList: [1],
                    stringListList: [["asd"], []]
                }
            }
        }, {
            description: "Should not overwrite nested when default true and set to false",
            set: {
                nested: {
                    intScalar: 1,
                    stringScalar: "string",
                    nullable: null,
                    date: now,
                    Boolean: false,
                    undefined: undefined,
                    [OVERWRITE]: false,
                    intList: [1],
                    stringListList: [["asd"], []]
                },
                otherNested: {
                    intScalar: 1,
                }
            },
            setOverwrite: SetOverwrite.DefaultTrueRoot,
            expected: {
                "nested.intScalar": 1,
                "nested.stringScalar": "string",
                "nested.nullable": null,
                "nested.date": now,
                "nested.Boolean": false,
                "nested.intList": [1],
                "nested.stringListList": [["asd"], []],
                otherNested: {
                    intScalar: 1,
                }
            }
        }, {
            description: "Should overwrite nested nested when default true and set to false",
            set: {
                nested: {
                    nestedNested: {
                        intScalar: 1,
                        stringScalar: "string",
                        nullable: null,
                        date: now,
                        Boolean: false,
                        undefined: undefined,
                        [OVERWRITE]: false,
                        intList: [1],
                        stringListList: [["asd"], []]
                    }
                }
            },
            setOverwrite: SetOverwrite.DefaultTrueRoot,
            expected: {
                nested: {
                    nestedNested: {
                        intScalar: 1,
                        stringScalar: "string",
                        nullable: null,
                        date: now,
                        Boolean: false,
                        intList: [1],
                        stringListList: [["asd"], []]
                    }
                }
            }
        }, {
            description: "Should get mongo set object",
            set: {
                scalar: 1,
                list: [2],
                nested: {
                    scalar: 3,
                    nestedOverwrite: {
                        scalar: 4,
                        [OVERWRITE]: true,
                    }
                },
                nestedOverwrite: {
                    scalar: 5,
                    [OVERWRITE]: true,
                    nestedNested: {
                        scalar: 6,
                        [OVERWRITE]: false,
                    }
                }
            },
            setOverwrite: SetOverwrite.False,
            expected: {
                scalar: 1,
                list: [2],
                "nested.scalar": 3,
                "nested.nestedOverwrite": {
                    scalar: 4
                },
                nestedOverwrite: {
                    scalar: 5,
                    nestedNested: {
                        scalar: 6
                    }
                }
            }
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const mongoDbSet = getMongoDbSet(test.set, test.setOverwrite);

            // Assert
            expect(mongoDbSet).to.deep.equal(test.expected, "Should return expected set object");
        }));
    });

    describe("getOverwrite", () => {
        const tests: { setOverwrite: SetOverwrite, input: boolean | undefined, expectedOverwrite: SetOverwrite }[] = [
            { setOverwrite: SetOverwrite.DefaultTrueRoot, input: undefined, expectedOverwrite: SetOverwrite.True },
            { setOverwrite: SetOverwrite.DefaultTrueRoot, input: false, expectedOverwrite: SetOverwrite.False },
            { setOverwrite: SetOverwrite.DefaultTrueRoot, input: true, expectedOverwrite: SetOverwrite.True },
            { setOverwrite: SetOverwrite.True, input: undefined, expectedOverwrite: SetOverwrite.True },
            { setOverwrite: SetOverwrite.True, input: false, expectedOverwrite: SetOverwrite.True },
            { setOverwrite: SetOverwrite.True, input: true, expectedOverwrite: SetOverwrite.True },
            { setOverwrite: SetOverwrite.False, input: undefined, expectedOverwrite: SetOverwrite.False },
            { setOverwrite: SetOverwrite.False, input: false, expectedOverwrite: SetOverwrite.False },
            { setOverwrite: SetOverwrite.False, input: true, expectedOverwrite: SetOverwrite.True },
        ];

        const description = (test: { setOverwrite: SetOverwrite, input: boolean | undefined, expectedOverwrite: SetOverwrite }) =>
            `For SetOverwrite: "${SetOverwrite[test.setOverwrite]}" and input: "${test.input}" should return "${SetOverwrite[test.expectedOverwrite]}"`;

        tests.forEach(test => it(description(test), () => {
            // Act
            const overwrite = getOverwrite(test.setOverwrite, test.input);

            // Assert
            expect(SetOverwrite[overwrite]).to.eql(SetOverwrite[test.expectedOverwrite], "Should return expected overwrite");
        }));
    });

    describe("getMongoDbInc", () => {
        const tests: { description: string, incArg: object, expected: IncObj }[] = [{
            description: "Should handle empty object",
            incArg: {},
            expected: {}
        }, {
            description: "Should ignore FICTIVE_INC",
            incArg: { [FICTIVE_INC]: "asd" },
            expected: {}
        }, {
            description: "Should get root fields",
            incArg: { intScalar: 2 },
            expected: { intScalar: 2 }
        }, {
            description: "Should get nested fields",
            incArg: { nested: { intScalar: 2 } },
            expected: { "nested.intScalar": 2 }
        }, {
            description: "Should get mongo inc object",
            incArg: {
                intScalar: 2,
                [FICTIVE_INC]: 3,
                nested: {
                    intScalar: 4,
                    [FICTIVE_INC]: 5
                },
            },
            expected: { intScalar: 2, "nested.intScalar": 4 }
        }];

        tests.forEach(test => it(test.description, () => {
            // Act
            const incObj = getMongoDbInc(test.incArg);

            // Assert
            expect(incObj).to.deep.equal(test.expected, "Should return expected inc object");
        }));
    });
});
