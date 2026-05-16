import type { PluginContext } from '../plugin/types';

let logger: {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
} | null = null;

export function initLogger(sessionId: string) {
  const prefix = `[oh-my-unified:${sessionId}]`;
  const debug = process.env.DEBUG?.includes('oh-my-unified');
  logger = {
    info: (msg: string, meta?: Record<string, unknown>) => {
      if (debug) process.stderr.write(`${prefix} INFO: ${msg} ${JSON.stringify(meta || '')}\n`);
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
      process.stderr.write(`${prefix} WARN: ${msg} ${JSON.stringify(meta || '')}\n`);
    },
    error: (msg: string, meta?: Record<string, unknown>) => {
      process.stderr.write(`${prefix} ERROR: ${msg} ${JSON.stringify(meta || '')}\n`);
    },
    debug: (msg: string, meta?: Record<string, unknown>) => {
      if (debug) process.stderr.write(`${prefix} DEBUG: ${msg} ${JSON.stringify(meta || '')}\n`);
    },
  };
}

export function log(msg: string, meta?: Record<string, unknown>) {
  logger?.info(msg, meta);
}