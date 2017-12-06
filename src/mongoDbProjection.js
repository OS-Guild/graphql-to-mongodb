import { getTypeFields, getInnerType } from './common';
import { isType } from 'graphql';
import { logError } from './logger';

function getMongoDbProjection(fieldNodes, graphQLType, ...excludedFields) {
    if (!Array.isArray(fieldNodes)) throw 'First argument of "getMongoDbProjection" must be an array';
    if (!isType(graphQLType)) throw 'Second argument of "getMongoDbProjection" must be a GraphQLType';
    
    const fieldNode = mergeAndSimplifyNodes(fieldNodes);
    const projection = getProjection(fieldNode, graphQLType, [], ...excludedFields);
    const resolveFields = getResolveFields(fieldNode, graphQLType);
    const resolveFieldsDependencies = [].concat(...Object.keys(resolveFields).map(_ => resolveFields[_]));
    return mergeProjectionAndResolveDependencies(projection, resolveFieldsDependencies);
}

function mergeAndSimplifyNodes(nodes) {
    const getFieldNodeFields = fieldNode => fieldNode.selectionSet.selections.filter(_ => _.kind == 'Field');
    const getFieldName = fieldNode => fieldNode.name.value;
    const isFieldNodeScalar = fieldNode => !fieldNode.selectionSet;

    const nodesFields = nodes
        .map(getFieldNodeFields)
        .map(_ => _.reduce((seed, curr) => ({ ...seed, [getFieldName(curr)]: curr }), {}));

    const fieldsDictionary = {};

    nodesFields.forEach(nodeFields =>
        Object.keys(nodeFields).forEach(key => {
            if (fieldsDictionary[key]) {
                fieldsDictionary[key].push(nodeFields[key])
            } else {
                fieldsDictionary[key] = [nodeFields[key]];
            }
        }));

    const node = {};

    Object.keys(fieldsDictionary).forEach(key => {
        const fieldNodes = fieldsDictionary[key];
        if (isFieldNodeScalar(fieldNodes[0])) {
            node[key] = 1;
        } else {
            node[key] = mergeAndSimplifyNodes(fieldNodes);
        }
    });

    return node;
}

function getProjection(fieldNode, graphQLType, path, ...excludedFields) {
    const typeFields = getTypeFields(graphQLType)();

    return Object.assign({}, ...Object.keys(fieldNode)
        .filter(key => key !== "__typename"
            && !excludedFields.includes(key)
            && !typeFields[key].resolve)
        .map(key => {
            const newPath = [...path, key];
            const field = fieldNode[key];

            if (field === 1) {
                return { [newPath.join(".")]: 1 };
            }

            return getProjection(field, getInnerType(typeFields[key].type), newPath);
        }));
}

function getResolveFields(fieldNode, graphQLType, path = []) {
    const typeFields = getTypeFields(graphQLType)();

    return Object.assign({}, ...Object.keys(fieldNode)
        .filter(key => key !== "__typename")
        .map(key => {
            const newPath = [...path, key];
            const field = fieldNode[key];
            const typeField = typeFields[key];

            if (typeField.resolve) {
                return {
                    [newPath.join(".")]: Array.isArray(typeField.dependencies)
                        ? typeField.dependencies
                        : []
                };
            }
            if (field === 1) {
                return {};
            }

            return getResolveFields(field, getInnerType(typeField.type), newPath);
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

export default logError(getMongoDbProjection)