const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
let currentLevel = 'info';
export function setLogLevel(level) { currentLevel = level; }
export function log(level, module, message, data) {
    if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(currentLevel))
        return;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
    if (data) {
        console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    }
    else {
        console.log(`${prefix} ${message}`);
    }
}
export const logger = {
    debug: (m, msg, d) => log('debug', m, msg, d),
    info: (m, msg, d) => log('info', m, msg, d),
    warn: (m, msg, d) => log('warn', m, msg, d),
    error: (m, msg, d) => log('error', m, msg, d),
};
//# sourceMappingURL=logger.js.map