function getMongoDbUpdate(update) {
    return clear({
        update: {
            $setOnInsert: update.setOnInsert,
            $set: update.set ? flattenSet(update.set) : undefined,
            $inc: update.inc
        },
        options: update.setOnInsert ? { upsert: true } : undefined
    });
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

function clear(obj, ...excludedKeys) {
    return Object.keys(obj).reduce((cleared, key) => {
        let value = obj[key];
        if (value !== undefined &&
            value !== null &&
            !excludedKeys.includes(key)) {

            if (typeof value != 'object' ||
                value instanceof Date) {
                return { ...cleared, [key]: value }
            }

            const objectValue = clear(value, ...excludedKeys);

            if (Object.keys(objectValue).length > 0) {
                return { ...cleared, [key]: objectValue }
            }
        }

        return cleared;
    }, {});
}

export default getMongoDbUpdate;