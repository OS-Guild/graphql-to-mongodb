let logger = {
    warn: (...args) => console.warn('\x1b[33m', 'graphql-to-mongodb warning:', '\x1b[0m', ...args)
    //error: console.error;
};

function warn() {
    if (typeof logger.warn === 'function') {
        logger.warn.apply(this, arguments);
    }
}

function error() {
    if (typeof logger.error === 'function') {
        logger.error.apply(this, arguments);
    }
}

function setLogger(loggerObject) {
    logger = loggerObject || {};
}

function logError(func) {
    return (...args) => {
        try {
            return func.apply(this, args);
        } catch (exception) {
            error('graphql-to-mongodb internal exception:', exception);
            throw exception;
        }
    }
}

export { warn, setLogger, logError }