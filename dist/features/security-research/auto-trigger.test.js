import { describe, it, expect } from 'bun:test';
import { createSecurityAutoTrigger } from './auto-trigger';
describe('SecurityAutoTrigger', () => {
    it('detects sensitive file paths', () => {
        const t = createSecurityAutoTrigger();
        expect(t.shouldTrigger('app.config.json')).toBe(true);
        expect(t.shouldTrigger('app.secrets.yaml')).toBe(true);
        expect(t.shouldTrigger('app.env.ts')).toBe(true);
        expect(t.shouldTrigger('normal.ts')).toBe(false);
    });
    it('detects sensitive content', () => {
        const t = createSecurityAutoTrigger();
        expect(t.shouldTrigger('app.ts', 'const password = "secret"')).toBe(true);
        expect(t.shouldTrigger('auth.ts', 'encrypt(user.password)')).toBe(true);
        expect(t.shouldTrigger('api.ts', 'fetch("/api/data")')).toBe(true);
        expect(t.shouldTrigger('db.ts', 'query("SELECT * FROM users")')).toBe(true);
    });
    it('detects XSS patterns', () => {
        const t = createSecurityAutoTrigger();
        expect(t.shouldTrigger('ui.ts', 'element.innerHTML = userInput')).toBe(true);
        expect(t.shouldTrigger('app.ts', 'document.write(html)')).toBe(true);
    });
    it('detects eval patterns', () => {
        const t = createSecurityAutoTrigger();
        expect(t.shouldTrigger('parser.ts', 'eval(userInput)')).toBe(true);
        expect(t.shouldTrigger('dynamic.ts', 'new Function(code)')).toBe(true);
    });
    it('does not trigger on safe content', () => {
        const t = createSecurityAutoTrigger();
        expect(t.shouldTrigger('utils.ts', 'function add(a, b) { return a + b; }')).toBe(false);
        expect(t.shouldTrigger('styles.css', 'body { margin: 0; }')).toBe(false);
    });
    it('returns trigger result with details', () => {
        const t = createSecurityAutoTrigger();
        const result = t.detectSensitiveWrite('.env', 'DB_PASSWORD=secret');
        expect(result).not.toBeNull();
        expect(result?.triggered).toBe(true);
        expect(result?.severity).toBe('high');
        expect(result?.reason).toBeDefined();
    });
    it('returns stats', () => {
        const t = createSecurityAutoTrigger();
        const stats = t.getTriggerStats();
        expect(stats.patterns).toBeGreaterThan(5);
        expect(stats.severity.high).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=auto-trigger.test.js.map