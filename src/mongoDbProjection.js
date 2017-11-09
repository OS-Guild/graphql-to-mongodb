function getMongoDbProjection(fieldNode, graphQLType, ...excludedFields) {
    const projection = flattenProjection(fieldNode, graphQLType, [], ...excludedFields);
    const resolveFields = getResolveFields(fieldNode, graphQLType);
    const resolveFieldsDependencies = [].concat(...Object.keys(resolveFields).map(_ => resolveFields[_]));
    return mergeProjectionAndResolveDependencies(projection, resolveFieldsDependencies);
}

function flattenProjection(fieldNode, graphQLType, path = [], ...excludedFields) {
    const typeFields = getTypeFields(graphQLType);

    return Object.assign({}, ...getFieldNodeFields(fieldNode)
        .filter(field => {
            const name = getFieldName(field);

            return name != "__typename"
                && !excludedFields.includes(name)
                && !typeFields[name].resolve;
        })
        .map(field => {
            const name = getFieldName(field);
            const newPath = [...path, name];

            if (isFieldNodeScalar(field)) {
                return { [newPath.join(".")]: 1 };
            }

            return flattenProjection(field, getInnerGraphQLType(typeFields[name].type), newPath);
        }));
}

function getFieldNodeFields(fieldNode) {
    return fieldNode.selectionSet.selections.filter(_ => _.kind == 'Field');
}

function isFieldNodeScalar(fieldNode) {
    return !fieldNode.selectionSet;
}

function getTypeFields(graphQLType) {
    return typeof graphQLType._typeConfig.fields === "function"
        ? graphQLType._typeConfig.fields()
        : graphQLType._typeConfig.fields;
}

function getFieldName(fieldNode) {
    return fieldNode.name.value;
}

function getInnerGraphQLType(graphQLType) {
    let type = graphQLType;

    while (type.ofType) {
        type = type.ofType;
    }

    return type;
}

function getResolveFields(fieldNode, graphQLType) {
    return flattenResolve(fieldNode, graphQLType, []);
}

function flattenResolve(fieldNode, graphQLType, path = []) {
    const typeFields = getTypeFields(graphQLType);

    return Object.assign({}, ...getFieldNodeFields(fieldNode)
        .filter(field => getFieldName(field) != "__typename")
        .map(field => {
            const name = getFieldName(field);
            const newPath = [...path, name];

            const typeField = typeFields[name];

            if (typeField.resolve) {
                return {
                [newPath.join(".")]: Array.isArray(typeField.dependencies)
                    ? typeField.dependencies
                    : []
                };
            }
            if (isFieldNodeScalar(field)) {
                return {};
            }

            return flattenResolve(field, getInnerGraphQLType(typeField.type), newPath);
        }));
}

function mergeProjectionAndResolveDependencies(projection, resolveDependencies) {

    const newProjection = { ...projection };

    for (var i = 0; i < resolveDependencies.length; i++) {
        const dependency = resolveDependencies[i];

        const projectionKeys = Object.keys(newProjection);

        if (projectionKeys.includes(dependency)) {
            continue;
        }

        if (projectionKeys.some(key => new RegExp(`^${key}.`).test(dependency))) {
            continue;
        }

        const regex = new RegExp(`^${dependency}.`)

        projectionKeys
            .filter(key => regex.test(key))
            .forEach(key => delete newProjection[key]);

        newProjection[dependency] = 1;
    }

    return newProjection;
}

export default getMongoDbProjection