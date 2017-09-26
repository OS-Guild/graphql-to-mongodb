function flatten(object, ...excludedFields) {
    return Object.assign({}, ...inner_flatten(object, [], ...excludedFields));
};

function inner_flatten(object, path, ...excludedFields) {
    return [].concat(
        ...Object.keys(object)
            .filter(key => !excludedFields.includes(key))
            .map(key => {

                if (key == 'opr') {
                    return { [path.join(".")]: toMongoExistsFilter(object[key]) };
                }

                const newPath = [...path, key];

                if (typeof object[key] === 'object') {

                    if (isScalarInputType(object[key])) {
                        return { [newPath.join(".")]: toMongoScalarFilter(object[key]) };
                    }

                    return inner_flatten(object[key], newPath);
                }

                return { [newPath.join(".")]: object[key] };
            })
    );
}

function isScalarInputType(object) {
    return object.opr && !["exists", "not_exists"].includes(object.opr);
}

function toMongoScalarFilter(object) {
    const mongoFieldFilter = {};

    if (["$in", "$nin"].includes(object.opr)) {
        mongoFieldFilter[object.opr] = object.values || [];
    } else {
        mongoFieldFilter[object.opr] = object.value;
    }

    return mongoFieldFilter;
}

function toMongoExistsFilter(exists) {
    return { $exists: exists == "exists" ? true : false };
}

function getMongoDbFilter(graphQlFilter = {}) {

    const filter = flatten(graphQlFilter, "OR", "AND");

    if (graphQlFilter["OR"]) {
        filter["$or"] = graphQlFilter["OR"].map(_ => getMongoDbFilter(_));
    }
    if (graphQlFilter["AND"]) {
        filter["$and"] = graphQlFilter["AND"].map(_ => getMongoDbFilter(_));
    }

    return filter;
}

export default getMongoDbFilter;