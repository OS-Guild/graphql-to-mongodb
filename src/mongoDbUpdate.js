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
        .filter(key => obj[key])
        .map(key => {
            const value = obj[key];
            const newPath = [...path, key];

            if (typeof value != 'object' ||
                value instanceof Date) {
                return { [newPath.join(".")]: value }
            }

            return flattenSet(value, newPath);
        }));
}

export default getMongoDbUpdate;