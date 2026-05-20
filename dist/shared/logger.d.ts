declare const LOG_LEVELS: readonly ["debug", "info", "warn", "error"];
type LogLevel = typeof LOG_LEVELS[number];
export declare function setLogLevel(level: LogLevel): void;
export declare function log(level: LogLevel, module: string, message: string, data?: unknown): void;
export declare const logger: {
    debug: (m: string, msg: string, d?: unknown) => void;
    info: (m: string, msg: string, d?: unknown) => void;
    warn: (m: string, msg: string, d?: unknown) => void;
    error: (m: string, msg: string, d?: unknown) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map