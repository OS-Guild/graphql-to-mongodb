import { addPrefixToProperties, isPrimitive } from './common';
import { logOnError } from './logger';
import { OVERWRITE, FICTIVE_INC } from './graphQLUpdateType';

export enum SetOverwrite {
    DefaultTrueRoot,
    True,
    False
}

export interface UpdateArgs {
    setOnInsert?: object,
    set?: object,
    inc?: object,
}

export interface UpdateObj {
    $setOnInsert?: SetOnInsertObj
    $set?: SetObj
    $inc?: IncObj
}

export interface SetOnInsertObj {
    [key: string]: SetOnInsertObj | any
}

export interface SetObj {
    [key: string]: SetObj | any
}

export interface IncObj {
    [key: string]: number
}

export interface updateParams {
    update: UpdateObj,
    options?: { upsert?: boolean }
}

export const getMongoDbUpdate = logOnError((update: UpdateArgs, overwrite: boolean = false): updateParams => {
    const updateParams: updateParams = {
        update: {}
    };

    if (update.setOnInsert) {
        updateParams.update.$setOnInsert = update.setOnInsert;
        updateParams.options = { upsert: true };
    }

    if (update.set) {
        updateParams.update.$set = getMongoDbSet(update.set, overwrite ? SetOverwrite.DefaultTrueRoot : SetOverwrite.False);
    }

    if (update.inc) {
        updateParams.update.$inc = getMongoDbInc(update.inc);
    }

    return updateParams;
});

export function getMongoDbSet(set: object, setOverwrite: SetOverwrite): SetObj {
    return Object.keys(set).filter(_ => _ !== OVERWRITE).reduce((agg, key) => {
        const value = set[key];

        if (isPrimitive(value)) {
            if (value === undefined) return agg;
            return { ...agg, [key]: value };
        }

        if (Array.isArray(value)) {
            return { ...agg, [key]: value };
        }


        const childOverwrite = getOverwrite(setOverwrite, value[OVERWRITE]);
        const child = getMongoDbSet(value, childOverwrite);

        if (childOverwrite === SetOverwrite.False) {
            return { ...agg, ...addPrefixToProperties(child, `${key}.`) };
        }

        return { ...agg, [key]: child };
    }, {});
}

export function getOverwrite(current: SetOverwrite, input?: boolean): SetOverwrite {
    if (current === SetOverwrite.True) {
        return SetOverwrite.True;
    }

    if (typeof input !== "undefined") {
        return input ? SetOverwrite.True : SetOverwrite.False;
    }

    if (current === SetOverwrite.DefaultTrueRoot) {
        return SetOverwrite.True;
    }

    return current;
}

export function getMongoDbInc(inc: object): IncObj {
    return Object.keys(inc).filter(_ => _ !== FICTIVE_INC).reduce((agg, key) => {
        const value = inc[key];

        if (typeof value === "number") {
            return { ...agg, [key]: value }
        }

        const child = getMongoDbInc(value);

        if (Object.keys(child).length === 0) {
            return agg;
        }

        return { ...agg, ...addPrefixToProperties(child, `${key}.`) };
    }, {});
}
