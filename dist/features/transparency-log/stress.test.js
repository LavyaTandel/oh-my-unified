import { describe, test, expect, beforeEach } from 'bun:test';
import { createTransparencyLog } from './index';
describe('TransparencyLog — stress tests', () => {
    let log;
    beforeEach(() => {
        log = createTransparencyLog();
    });
    test('handles rapid sequential writes', () => {
        for (let i = 0; i < 1000; i++) {
            log.record({
                type: 'model_routing',
                sessionId: `session-${i % 10}`,
                message: `Entry ${i}`,
                confidence: 0.5 + (i % 50) / 100,
            });
        }
        expect(log.getStats().totalEntries).toBe(1000);
    });
    test('auto-trims at 1000 entries', () => {
        for (let i = 0; i < 1500; i++) {
            log.record({
                type: 'model_routing',
                sessionId: 'stress',
                message: `Entry ${i}`,
            });
        }
        expect(log.getStats().totalEntries).toBe(1000);
        // Oldest entry should be entry 500
        const entries = log.getRecent(1);
        expect(entries[0].message).toBe('Entry 1499');
    });
    test('handles concurrent session IDs', () => {
        const sessions = Array.from({ length: 100 }, (_, i) => `session-${i}`);
        for (let i = 0; i < 500; i++) {
            log.record({
                type: 'model_routing',
                sessionId: sessions[i % 100],
                message: `Entry ${i}`,
            });
        }
        const stats = log.getStats();
        expect(Object.keys(stats.bySession).length).toBe(100);
    });
    test('query by type with large dataset', () => {
        const types = ['model_routing', 'agent_selection', 'error', 'warning', 'decision'];
        for (let i = 0; i < 200; i++) {
            log.record({
                type: types[i % 5],
                sessionId: 'stress',
                message: `Entry ${i}`,
            });
        }
        expect(log.getByType('model_routing').length).toBe(40);
        expect(log.getByType('error').length).toBe(40);
    });
    test('query by session with large dataset', () => {
        for (let i = 0; i < 300; i++) {
            log.record({
                type: 'model_routing',
                sessionId: i < 150 ? 'session-a' : 'session-b',
                message: `Entry ${i}`,
            });
        }
        expect(log.getBySession('session-a').length).toBe(150);
        expect(log.getBySession('session-b').length).toBe(150);
    });
    test('query with since filter', () => {
        const baseTime = Date.now();
        for (let i = 0; i < 100; i++) {
            log.record({
                type: 'model_routing',
                sessionId: 'stress',
                message: `Entry ${i}`,
                timestamp: baseTime + i * 1000,
            });
        }
        const since = baseTime + 50000;
        const filtered = log.query({ since });
        expect(filtered.length).toBe(50);
    });
    test('query with limit', () => {
        for (let i = 0; i < 100; i++) {
            log.record({
                type: 'model_routing',
                sessionId: 'stress',
                message: `Entry ${i}`,
            });
        }
        const limited = log.query({ limit: 10 });
        expect(limited.length).toBe(10);
        expect(limited[0].message).toBe('Entry 90');
    });
    test('formatLog handles empty log', () => {
        const output = log.formatLog([]);
        expect(output).toContain('No entries found');
    });
    test('formatLog handles large dataset', () => {
        for (let i = 0; i < 200; i++) {
            log.record({
                type: 'model_routing',
                sessionId: 'stress',
                message: `Entry ${i} with details`,
                details: { index: i, value: i * 2 },
                confidence: 0.5 + (i % 50) / 100,
            });
        }
        const entries = log.getRecent(50);
        const output = log.formatLog(entries);
        expect(output).toContain('Transparency Log');
        expect(output).toContain('200 total entries');
    });
    test('clear resets state', () => {
        for (let i = 0; i < 100; i++) {
            log.record({
                type: 'model_routing',
                sessionId: 'stress',
                message: `Entry ${i}`,
            });
        }
        log.clear();
        expect(log.getStats().totalEntries).toBe(0);
        expect(log.getRecent(10).length).toBe(0);
    });
    test('handles undefined details', () => {
        log.record({
            type: 'model_routing',
            sessionId: 'stress',
            message: 'No details',
        });
        const entries = log.getRecent(1);
        expect(entries[0].details).toBeUndefined();
    });
    test('handles undefined confidence', () => {
        log.record({
            type: 'model_routing',
            sessionId: 'stress',
            message: 'No confidence',
        });
        const entries = log.getRecent(1);
        expect(entries[0].confidence).toBeUndefined();
    });
    test('all 14 entry types work', () => {
        const types = [
            'model_routing', 'agent_selection', 'circuit_breaker', 'feature_trigger',
            'error', 'warning', 'decision', 'plan_phase', 'audit_result',
            'review_verdict', 'security_finding', 'learning_applied',
            'prediction_made', 'benchmark_recorded',
        ];
        for (const type of types) {
            log.record({
                type,
                sessionId: 'stress',
                message: `Testing ${type}`,
            });
        }
        const stats = log.getStats();
        expect(Object.keys(stats.byType).length).toBe(14);
    });
    test('query with combined filters', () => {
        const baseTime = Date.now();
        for (let i = 0; i < 100; i++) {
            log.record({
                type: i % 3 === 0 ? 'model_routing' : 'error',
                sessionId: i < 50 ? 'session-a' : 'session-b',
                message: `Entry ${i}`,
                timestamp: baseTime + i * 1000,
            });
        }
        const filtered = log.query({
            type: 'model_routing',
            sessionId: 'session-a',
            since: baseTime + 20000,
            limit: 5,
        });
        expect(filtered.length).toBeLessThanOrEqual(5);
        for (const entry of filtered) {
            expect(entry.type).toBe('model_routing');
            expect(entry.sessionId).toBe('session-a');
        }
    });
    test('memory stability under load', () => {
        // Write 5000 entries and verify trimming
        for (let i = 0; i < 5000; i++) {
            log.record({
                type: 'model_routing',
                sessionId: `session-${i % 50}`,
                message: `Entry ${i}`,
                details: { index: i, data: 'x'.repeat(100) },
            });
        }
        expect(log.getStats().totalEntries).toBe(1000);
        const stats = log.getStats();
        expect(Object.keys(stats.bySession).length).toBe(50);
    });
});
//# sourceMappingURL=stress.test.js.map