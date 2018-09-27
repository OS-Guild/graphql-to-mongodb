export interface Log {
    (message?: any, ...optionalParams: any[]): void;
}

export interface Logger {
    error?: Log;
    warn?: Log;
}

let logger: Logger = {
    warn: (...args) => console.warn('\x1b[33m', 'graphql-to-mongodb warning:', '\x1b[0m', ...args),
    //error: console.error
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

export function logOnError<T>(func: T): T {
    const wrappedFunction = (...args) => {
        try {
            return (func as any)(...args);
        } catch (exception) {
            error('graphql-to-mongodb internal exception:', exception);
            throw exception;
        }
    };
    return wrappedFunction as any;
}