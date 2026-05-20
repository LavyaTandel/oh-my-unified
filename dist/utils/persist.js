import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const PERSIST_DIR = join(process.cwd(), '.opencode', 'oh-my-unified');
export function getPersistedData(key, defaultValue) {
    try {
        const filePath = join(PERSIST_DIR, `${key}.json`);
        if (!existsSync(filePath))
            return defaultValue;
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return defaultValue;
    }
}
export function setPersistedData(key, value) {
    try {
        const filePath = join(PERSIST_DIR, `${key}.json`);
        if (!existsSync(PERSIST_DIR)) {
            existsSync(join(PERSIST_DIR, '..')) ||
                require('node:fs').mkdirSync(PERSIST_DIR, { recursive: true });
        }
        writeFileSync(filePath, JSON.stringify(value, null, 2));
    }
    catch (err) {
        console.error(`[oh-my-unified] Failed to persist ${key}:`, err);
    }
}
//# sourceMappingURL=persist.js.map