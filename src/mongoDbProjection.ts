import { getInnerType, flatten, addPrefixToProperties, GraphQLFieldsType } from './common';
import { isType, GraphQLResolveInfo, SelectionNode, FragmentSpreadNode, GraphQLField } from 'graphql';
import { logOnError } from './logger';

export interface MongoDbProjection {
    [key: string]: 1
};

export interface GetMongoDbProjectionOptions {
    isResolvedField: (field: GraphQLField<any, any>) => boolean;
    excludedFields: string[];
}

const defaultOptions: GetMongoDbProjectionOptions = {
    isResolvedField: ((field: GraphQLField<any, any>) => !!field.resolve),
    excludedFields: [],
}

export const getMongoDbProjection = logOnError((info: GraphQLResolveInfo, graphQLFieldsType: GraphQLFieldsType, options: GetMongoDbProjectionOptions = defaultOptions): MongoDbProjection => {
    if (!Object.keys(info).includes('fieldNodes')) throw 'First argument of "getMongoDbProjection" must be a GraphQLResolveInfo';
    if (!isType(graphQLFieldsType)) throw 'Second argument of "getMongoDbProjection" must be a GraphQLType';

    const nodes = flatten(info.fieldNodes.map(_ => [..._.selectionSet.selections]));

    const projection = getSelectedProjection(nodes, graphQLFieldsType, { info, fragments: {} }, {
        ...options,
        isResolvedField: options.isResolvedField || ((field: GraphQLField<any, any>) => !!field.resolve)
    });

    return omitRedundantProjection(projection);
});

function getSelectedProjection(
    selectionNodes: SelectionNode[],
    graphQLFieldsType: GraphQLFieldsType,
    extra: { info: GraphQLResolveInfo, fragments: { [key: string]: MongoDbProjection } },
    options: GetMongoDbProjectionOptions = defaultOptions): MongoDbProjection {
    const fields = graphQLFieldsType.getFields()

    return selectionNodes.reduce((projection, node) => {
        if (node.kind === 'Field') {
            if (node.name.value === '__typename' || options.excludedFields.includes(node.name.value)) return projection;

            const field = fields[node.name.value];

            if (options.isResolvedField(field)) {
                const dependencies: string[] = field["dependencies"] || [];
                const dependenciesProjection = dependencies.reduce((agg, dependency) => ({ ...agg, [dependency]: 1 }), {});
                return {
                    ...projection,
                    ...dependenciesProjection
                };
            }

            if (!node.selectionSet) return {
                ...projection,
                [node.name.value]: 1
            };

            const nested = getSelectedProjection([...node.selectionSet.selections], getInnerType(field.type) as GraphQLFieldsType, extra, options);

            return {
                ...projection,
                ...addPrefixToProperties(nested, `${node.name.value}.`)
            };
        } else if (node.kind === 'InlineFragment') {
            const type = extra.info.schema.getType(node.typeCondition.name.value);
            return {
                ...projection,
                ...getSelectedProjection([...node.selectionSet.selections], type as GraphQLFieldsType, extra, options)
            };
        } else if (node.kind === 'FragmentSpread') {
            return {
                ...projection,
                ...getFragmentProjection(node, graphQLFieldsType, extra, options)
            };
        }
    }, {});
}

function getFragmentProjection(
    fragmentSpreadNode: FragmentSpreadNode,
    graphQLFieldsType: GraphQLFieldsType,
    extra: { info: GraphQLResolveInfo, fragments: { [key: string]: MongoDbProjection } },
    options: GetMongoDbProjectionOptions = defaultOptions): MongoDbProjection {
    const fragmentName = fragmentSpreadNode.name.value;
    if (extra.fragments[fragmentName]) return extra.fragments[fragmentName];
    const fragmentNode = extra.info.fragments[fragmentName];
    extra.fragments[fragmentName] = getSelectedProjection([...fragmentNode.selectionSet.selections], graphQLFieldsType, extra, options);
    return extra.fragments[fragmentName];
}

function omitRedundantProjection(projection: MongoDbProjection) {
    return Object.keys(projection).reduce((proj, key) => {
        if (Object.keys(projection).some(otherKey =>
            otherKey !== key && new RegExp(`^${otherKey}[.]`).test(key))) {
            return proj;
        }
        return {
            ...proj,
            [key]: 1
        };
    }, {});
}