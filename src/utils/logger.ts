import type { PluginContext } from '../plugin/types';

let logger: {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
} | null = null;

export function initLogger(sessionId: string) {
  const prefix = `[oh-my-unified:${sessionId}]`;
  logger = {
    info: (msg: string, meta?: Record<string, unknown>) => {
      console.log(`${prefix} INFO: ${msg}`, meta || '');
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
      console.warn(`${prefix} WARN: ${msg}`, meta || '');
    },
    error: (msg: string, meta?: Record<string, unknown>) => {
      console.error(`${prefix} ERROR: ${msg}`, meta || '');
    },
    debug: (msg: string, meta?: Record<string, unknown>) => {
      if (process.env.DEBUG?.includes('oh-my-unified')) {
        console.debug(`${prefix} DEBUG: ${msg}`, meta || '');
      }
    },
  };
}

export function log(msg: string, meta?: Record<string, unknown>) {
  logger?.info(msg, meta);
}