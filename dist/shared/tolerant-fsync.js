// Tolerant fsync — attempts to sync, doesn't crash on failure
import { fsyncSync } from 'node:fs';
export function tolerantFsync(fd) {
    try {
        fsyncSync(fd);
    }
    catch { /* tolerate failure */ }
}
//# sourceMappingURL=tolerant-fsync.js.map