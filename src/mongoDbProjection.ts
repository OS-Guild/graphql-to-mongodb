import { getTypeFields, getInnerType, cache, flatten } from './common';
import { isType, FieldNode, GraphQLObjectType, GraphQLResolveInfo, SelectionNode, FragmentSpreadNode } from 'graphql';
import { logOnError } from './logger';

export interface MongoDbProjection {
    [key: string]: 1
};

interface Field {
    [key: string]: Field | 1
}

interface FieldGraph {
    [key: string]: FieldGraph[] | 1
}

interface FragmentDictionary {
    [key: string]: FieldGraph[]
}

function getMongoDbProjection(info: GraphQLResolveInfo, graphQLType: GraphQLObjectType, ...excludedFields: string[]): MongoDbProjection {
    return logOnError(() => {
        if (!Object.keys(info).includes('fieldNodes')) throw 'First argument of "getMongoDbProjection" must be a GraphQLResolveInfo';
        if (!isType(graphQLType)) throw 'Second argument of "getMongoDbProjection" must be a GraphQLType';

        const selections = flatten(info.fieldNodes.map(_ => _.selectionSet.selections));
        const simplifiedNodes = simplifyNodes({ selections: selections }, info);
        const field = mergeNodes(simplifiedNodes);

        const projection = getProjection(field, graphQLType, [], ...excludedFields);

        const resolveFieldsDependencies = getResolveFieldsDependencies(field, graphQLType);
        return mergeProjectionAndResolveDependencies(projection, resolveFieldsDependencies);
    });
}

function simplifyNodes(selectionSetNode: { selections: SelectionNode[] }, info: GraphQLResolveInfo, dictionary: FragmentDictionary = {}): FieldGraph[] {
    const fieldGraphs: FieldGraph[] = [];
    const fieldGraph: FieldGraph = {};
    fieldGraphs.push(fieldGraph);

    selectionSetNode.selections.forEach(selectionNode => {
        if (selectionNode.kind === 'FragmentSpread') {
            const fragmentSpreadNode = selectionNode as FragmentSpreadNode;
            const fragment = buildFragment(fragmentSpreadNode.name.value, info, dictionary);
            fragment.forEach(_ => fieldGraphs.push(_));
        } else if (selectionNode.kind === 'Field') {
            const fieldNode = selectionNode as FieldNode;
            const fieldName = fieldNode.name.value;
            const fieldGraphValue = fieldGraph[fieldName];
            if (fieldGraphValue !== 1) {
                if (!fieldNode.selectionSet) {
                    fieldGraph[fieldName] = 1;
                } else {
                    const simplifiedNodes = simplifyNodes(fieldNode.selectionSet, info, dictionary);
                    fieldGraph[fieldName] = (fieldGraphValue || []).concat(simplifiedNodes);
                }
            }
        }
    });

    return fieldGraphs;
}

function buildFragment(fragmentName: string, info: GraphQLResolveInfo, dictionary: FragmentDictionary): FieldGraph[] {
    return cache(dictionary, fragmentName, (): FieldGraph[] => {
        const fragmentDescription = info.fragments[fragmentName];
        return simplifyNodes(fragmentDescription.selectionSet, info, dictionary);
    });
}

function mergeNodes(fieldGraphs: FieldGraph[]): Field {
    const mergedGraph: FieldGraph = {};

    fieldGraphs.forEach(fieldGraph => Object.keys(fieldGraph).forEach(fieldName => {
        const mergedField = mergedGraph[fieldName];
        if (mergedField !== 1) {
            const fieldValue = fieldGraph[fieldName];
            if (fieldValue === 1) {
                mergedGraph[fieldName] = 1;
            } else {
                mergedGraph[fieldName] = (mergedField || []).concat(fieldValue);
            }
        }
    }));

    return Object.keys(mergedGraph).reduce((agg, fieldName) => {
        const fieldValue = mergedGraph[fieldName];
        return { ...agg, [fieldName]: fieldValue === 1 ? 1 : mergeNodes(fieldValue) };
    }, {});
}

function getProjection(fieldNode: Field, graphQLType: GraphQLObjectType, path: string[] = [], ...excludedFields: string[]): MongoDbProjection {
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

            return getProjection(field, getInnerType(typeFields[key].type) as GraphQLObjectType, newPath);
        }));
}

function getResolveFieldsDependencies(fieldNode: Field, graphQLType: GraphQLObjectType): string[] {
    const typeFields = getTypeFields(graphQLType)();

    return Object.keys(fieldNode)
        .filter(key => key !== "__typename")
        .reduce((agg, key) => {
            const field = fieldNode[key];
            const typeField = typeFields[key];

            if (field === 1) {
                if (typeField.resolve && Array.isArray(typeField.dependencies)) {
                    return [...agg, ...typeField.dependencies];
                }
                return agg;
            }

            return [...agg, ...getResolveFieldsDependencies(field, getInnerType(typeField.type) as GraphQLObjectType)];
        }, []);
}

function mergeProjectionAndResolveDependencies(projection: MongoDbProjection, resolveDependencies: string[]): MongoDbProjection {

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