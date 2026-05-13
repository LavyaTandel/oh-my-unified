import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PERSIST_DIR = join(process.cwd(), '.opencode', 'oh-my-agents');

export function getPersistedData<T>(key: string, defaultValue: T): T {
  try {
    const filePath = join(PERSIST_DIR, `${key}.json`);
    if (!existsSync(filePath)) return defaultValue;
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

export function setPersistedData<T>(key: string, value: T): void {
  try {
    const filePath = join(PERSIST_DIR, `${key}.json`);
    if (!existsSync(PERSIST_DIR)) {
      existsSync(join(PERSIST_DIR, '..')) ||
        require('node:fs').mkdirSync(PERSIST_DIR, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(value, null, 2));
  } catch (err) {
    console.error(`[oh-my-agents] Failed to persist ${key}:`, err);
  }
}