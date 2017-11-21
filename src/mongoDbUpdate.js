import { FICTIVE_INC, clear } from './common';

function getMongoDbUpdate(update) {
    return clear({
        update: {
            $setOnInsert: update.setOnInsert,
            $set: update.set ? flattenSet(update.set) : undefined,
            $inc: update.inc
        },
        options: update.setOnInsert ? { upsert: true } : undefined
    }, FICTIVE_INC);
}

function flattenSet(obj, path = []) {
    return Object.assign({}, ...Object.keys(obj)
        .map(key => {
            const value = obj[key];
            const newPath = [...path, key];

            if (typeof value != 'object' ||
                Array.isArray(value) ||
                value instanceof Date ||
                value === null) {
                return { [newPath.join(".")]: value }
            }

            return flattenSet(value, newPath);
        }));
}

export default getMongoDbUpdate;