import { createRequire } from 'node:module';
let DatabaseImpl;
if (typeof globalThis.Bun !== 'undefined') {
    const req = createRequire(import.meta.url);
    DatabaseImpl = req('bun:sqlite').Database;
}
else {
    const req = createRequire(import.meta.url);
    let usable = false;
    try {
        const mod = req('better-sqlite3');
        const BDatabase = mod.default ?? mod;
        // Test if the native module actually works (ABI check)
        const testDb = new BDatabase(':memory:');
        testDb.prepare('SELECT 1').get();
        testDb.close();
        usable = true;
        // Wrap to add bun:sqlite-compatible db.run(sql, ...params) method
        DatabaseImpl = class extends BDatabase {
            run(sql, ...params) {
                const stmt = this.prepare(sql);
                if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) {
                    return stmt.run(params[0]);
                }
                return stmt.run(...params);
            }
        };
    }
    catch {
        // better-sqlite3 unavailable or ABI mismatch — no-op stub
        if (!usable) {
            DatabaseImpl = class {
                constructor(_path) { }
                run() { return { changes: 0, lastInsertRowid: 0 }; }
                prepare() {
                    return {
                        run: () => ({ changes: 0, lastInsertRowid: 0 }),
                        get: () => undefined,
                        all: () => [],
                    };
                }
                close() { }
            };
        }
    }
}
const TypedDatabase = DatabaseImpl;
export { TypedDatabase as Database };
//# sourceMappingURL=sqlite.js.map