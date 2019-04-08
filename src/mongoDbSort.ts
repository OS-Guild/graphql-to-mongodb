import { addPrefixToProperties } from "./common";
import { FICTIVE_SORT } from "./graphQLSortType";

export type SortDirection = 1 | -1

export interface SortArg {
    [key: string]: SortArg | SortDirection;
};

export interface MongoDbSort {
    [key: string]: SortDirection;
};

function getMongoDbSort(sort: SortArg): MongoDbSort {
    return Object.keys(sort)
        .filter(key => key != FICTIVE_SORT)
        .reduce((agg, key) => {
            const value = sort[key];

            if (typeof value === 'number') {
                return { ...agg, [key]: value }
            }

            const nested = getMongoDbSort(value as SortArg);

            return { ...agg, ...addPrefixToProperties(nested, `${key}.`) }
        }, {});
}

export default getMongoDbSort;
