function getMongoDbUpdate(update) {
    return clear({
        update: {
            $setOnInsert: update.setOnInsert,
            $set: update.set,
            $inc: update.inc
        },
        options: update.setOnInsert ? { upsert: true } : undefined
    });
}

function clear(obj, ...excludedKeys) {
    return Object.keys(obj).reduce((cleared, key) => {
        let value = obj[key];
        if (value !== undefined && 
            value !== null &&
            !excludedKeys.includes(key)) {

            if (typeof value != 'object') {
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