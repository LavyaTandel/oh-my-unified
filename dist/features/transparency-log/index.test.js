import { describe, test, expect, beforeEach } from 'bun:test';
import { createTransparencyLog } from './index';
describe('TransparencyLog', () => {
    let log;
    beforeEach(() => {
        log = createTransparencyLog();
    });
    test('records and retrieves entries', () => {
        log.record({
            type: 'model_routing',
            sessionId: 's1',
            message: 'Routed to nemotron-3-super-free',
            details: { agent: 'odin', reason: 'planning' },
            confidence: 0.85,
        });
        const entries = log.getRecent();
        expect(entries.length).toBe(1);
        expect(entries[0].type).toBe('model_routing');
        expect(entries[0].sessionId).toBe('s1');
        expect(entries[0].confidence).toBe(0.85);
    });
    test('queries by type', () => {
        log.record({ type: 'model_routing', sessionId: 's1', message: 'routing 1' });
        log.record({ type: 'agent_selection', sessionId: 's1', message: 'selection 1' });
        log.record({ type: 'model_routing', sessionId: 's2', message: 'routing 2' });
        const routingEntries = log.query({ type: 'model_routing' });
        expect(routingEntries.length).toBe(2);
    });
    test('queries by session', () => {
        log.record({ type: 'model_routing', sessionId: 's1', message: 's1 entry' });
        log.record({ type: 'model_routing', sessionId: 's2', message: 's2 entry' });
        const s1Entries = log.getBySession('s1');
        expect(s1Entries.length).toBe(1);
        expect(s1Entries[0].sessionId).toBe('s1');
    });
    test('queries with limit', () => {
        for (let i = 0; i < 100; i++) {
            log.record({ type: 'model_routing', sessionId: 's1', message: `entry ${i}` });
        }
        const entries = log.query({ limit: 10 });
        expect(entries.length).toBe(10);
        expect(entries[0].message).toBe('entry 90');
    });
    test('queries with time filter', () => {
        const oldTime = Date.now() - 10000; // 10 seconds ago
        log.record({ type: 'model_routing', sessionId: 's1', message: 'old', timestamp: oldTime });
        log.record({ type: 'model_routing', sessionId: 's1', message: 'new' });
        const recentEntries = log.query({ since: Date.now() - 5000 });
        expect(recentEntries.length).toBe(1);
        expect(recentEntries[0].message).toBe('new');
    });
    test('formats log output', () => {
        log.record({
            type: 'model_routing',
            sessionId: 's1',
            message: 'Routed to nemotron',
            details: { agent: 'odin' },
            confidence: 0.9,
        });
        const formatted = log.formatLog(log.getRecent());
        expect(formatted).toContain('Transparency Log');
        expect(formatted).toContain('Routed to nemotron');
        expect(formatted).toContain('Confidence: 90%');
        expect(formatted).toContain('total entries');
    });
    test('formats empty log', () => {
        const formatted = log.formatLog([]);
        expect(formatted).toContain('No entries found');
    });
    test('generates stats', () => {
        log.record({ type: 'model_routing', sessionId: 's1', message: 'entry 1' });
        log.record({ type: 'agent_selection', sessionId: 's1', message: 'entry 2' });
        log.record({ type: 'model_routing', sessionId: 's2', message: 'entry 3' });
        const stats = log.getStats();
        expect(stats.totalEntries).toBe(3);
        expect(stats.byType['model_routing']).toBe(2);
        expect(stats.byType['agent_selection']).toBe(1);
        expect(stats.bySession['s1']).toBe(2);
        expect(stats.bySession['s2']).toBe(1);
    });
    test('trims old entries when exceeding max', () => {
        for (let i = 0; i < 1100; i++) {
            log.record({ type: 'model_routing', sessionId: 's1', message: `entry ${i}` });
        }
        const stats = log.getStats();
        expect(stats.totalEntries).toBe(1000);
    });
    test('clears all entries', () => {
        log.record({ type: 'model_routing', sessionId: 's1', message: 'entry' });
        log.clear();
        const stats = log.getStats();
        expect(stats.totalEntries).toBe(0);
    });
});
//# sourceMappingURL=index.test.js.map