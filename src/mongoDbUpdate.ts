import { FICTIVE_INC, clear } from './common';
import { logOnError } from './logger';

export interface UpdateArgs {
    setOnInsert?: any,
    set?: any,
    inc?: any,
}

export interface UpdateObj {
    $setOnInsert?: any
    $set?: any
    $inc?: any
}

export interface updateParams {
    update?: UpdateObj,
    options?: any
}

function getMongoDbUpdate(update: UpdateArgs): updateParams {
    return clear({
        update: {
            $setOnInsert: update.setOnInsert,
            $set: update.set ? flattenMongoDbSet(update.set) : undefined,
            $inc: update.inc
        },
        options: update.setOnInsert ? { upsert: true } : undefined
    }, FICTIVE_INC);
}

function flattenMongoDbSet(set: object, path: string[] = []): object {
    return Object.assign({}, ...Object.keys(set)
        .map(key => {
            const value = set[key];
            const newPath = [...path, key];

            if (typeof value != 'object' ||
                Array.isArray(value) ||
                value instanceof Date ||
                value === null) {
                return { [newPath.join(".")]: value }
            }

            return flattenMongoDbSet(value, newPath);
        }));
}

export default logOnError(getMongoDbUpdate);