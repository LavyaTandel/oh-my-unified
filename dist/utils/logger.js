let logger = null;
export function initLogger(sessionId) {
    const prefix = `[oh-my-unified:${sessionId}]`;
    const debug = process.env.DEBUG?.includes('oh-my-unified');
    logger = {
        info: (msg, meta) => {
            if (debug)
                process.stderr.write(`${prefix} INFO: ${msg} ${JSON.stringify(meta || '')}\n`);
        },
        warn: (msg, meta) => {
            process.stderr.write(`${prefix} WARN: ${msg} ${JSON.stringify(meta || '')}\n`);
        },
        error: (msg, meta) => {
            process.stderr.write(`${prefix} ERROR: ${msg} ${JSON.stringify(meta || '')}\n`);
        },
        debug: (msg, meta) => {
            if (debug)
                process.stderr.write(`${prefix} DEBUG: ${msg} ${JSON.stringify(meta || '')}\n`);
        },
    };
}
export function log(msg, meta) {
    logger?.info(msg, meta);
}
//# sourceMappingURL=logger.js.map