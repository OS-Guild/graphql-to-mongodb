export interface Log {
    (message?: any, ...optionalParams: any[]): void;
}

export interface Logger {
    error?: Log;
    warn?: Log;
}

let logger: Logger = {
    warn: (...args) => console.warn('\x1b[33m', 'graphql-to-mongodb warning:', '\x1b[0m', ...args),
    //error: (...args) => console.warn('\x1b[31m', 'graphql-to-mongodb error:', '\x1b[0m', ...args),
};

export function warn(message?: any, ...optionalParams: any[]): void {
    if (logger.warn) {
        logger.warn(message, ...optionalParams);
    }
}

function error(message?: any, ...optionalParams: any[]): void {
    if (logger.error) {
        logger.error(message, ...optionalParams);
    }
}

export function setLogger(loggerObject: Logger): void {
    logger = loggerObject || {};
}
export function getLogger(): Logger {
    return { ...logger };
}

export function logOnError<T extends (...arg: any[]) => any>(func: T): T {
    const wrappedFunction = (...args) => {
        try {
            return func(...args);
        } catch (exception) {
            error(exception);
            throw exception;
        }
    };
    
    return wrappedFunction as T;
}
