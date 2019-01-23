import { FICTIVE_SORT } from "./common";

export type SortDirection = 1 | -1

export interface SortArg {
    [key: string]: SortArg | SortDirection;
};

export interface MongoDbSort {
    [key: string]: SortDirection;
};

function getMongoDbSort(sort: SortArg, path: string[] = []): MongoDbSort {
    return Object.assign({}, ...Object.keys(sort)
        .filter(key => key != FICTIVE_SORT)
        .map(key => {
            const value = sort[key];
            const newPath = [...path, key];

            if (typeof value === 'number') {
                return { [newPath.join(".")]: value }
            }

            return getMongoDbSort(value as SortArg, newPath);
        }));
}

export default getMongoDbSort;
