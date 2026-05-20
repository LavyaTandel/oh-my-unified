import { describe, test, expect, beforeEach } from 'bun:test';
import { createBenchmarkTracker } from './index';
describe('BenchmarkTracker', () => {
    let tracker;
    beforeEach(() => {
        tracker = createBenchmarkTracker(':memory:');
    });
    test('records benchmark results', () => {
        tracker.record({
            model: 'model-a',
            taskCategory: 'planning',
            sessionId: 's1',
            latencyMs: 1500,
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.01,
            qualityScore: 8.5,
            timestamp: Date.now(),
        });
        const summary = tracker.getSummary('model-a', 'planning');
        expect(summary).not.toBeNull();
        expect(summary.totalRuns).toBe(1);
        expect(summary.avgLatency).toBe(1500);
        expect(summary.avgQuality).toBe(8.5);
    });
    test('calculates latency percentiles', () => {
        for (let i = 0; i < 20; i++) {
            tracker.record({
                model: 'model-a',
                taskCategory: 'planning',
                sessionId: `s${i}`,
                latencyMs: 1000 + i * 100,
                inputTokens: 1000,
                outputTokens: 500,
                cost: 0.01,
                qualityScore: 8.0,
                timestamp: Date.now() - (20 - i) * 60000,
            });
        }
        const summary = tracker.getSummary('model-a', 'planning');
        expect(summary).not.toBeNull();
        expect(summary.p50Latency).toBeGreaterThan(1000);
        expect(summary.p95Latency).toBeGreaterThan(summary.p50Latency);
    });
    test('detects latency regression', () => {
        const baseTime = Date.now();
        // Record 25 previous runs with low latency
        for (let i = 0; i < 25; i++) {
            tracker.record({
                model: 'model-a',
                taskCategory: 'planning',
                sessionId: `s-prev-${i}`,
                latencyMs: 1000,
                inputTokens: 1000,
                outputTokens: 500,
                cost: 0.01,
                qualityScore: 8.0,
                timestamp: baseTime - (25 - i) * 60000,
            });
        }
        // Record 5 recent runs with high latency
        for (let i = 0; i < 5; i++) {
            tracker.record({
                model: 'model-a',
                taskCategory: 'planning',
                sessionId: `s-recent-${i}`,
                latencyMs: 2000,
                inputTokens: 1000,
                outputTokens: 500,
                cost: 0.01,
                qualityScore: 8.0,
                timestamp: baseTime + 1000000 - (5 - i) * 60000,
            });
        }
        const alerts = tracker.detectRegressions('model-a', 'planning', 0.2);
        const latencyAlerts = alerts.filter(a => a.metric === 'latency');
        expect(latencyAlerts.length).toBeGreaterThan(0);
        expect(latencyAlerts[0].changePercent).toBeGreaterThan(20);
    });
    test('detects quality regression', () => {
        const baseTime = Date.now();
        // Record 25 previous runs with high quality
        for (let i = 0; i < 25; i++) {
            tracker.record({
                model: 'model-a',
                taskCategory: 'review',
                sessionId: `s-prev-${i}`,
                latencyMs: 1000,
                inputTokens: 1000,
                outputTokens: 500,
                cost: 0.01,
                qualityScore: 9.0,
                timestamp: baseTime - (25 - i) * 60000,
            });
        }
        // Record 5 recent runs with low quality
        for (let i = 0; i < 5; i++) {
            tracker.record({
                model: 'model-a',
                taskCategory: 'review',
                sessionId: `s-recent-${i}`,
                latencyMs: 1000,
                inputTokens: 1000,
                outputTokens: 500,
                cost: 0.01,
                qualityScore: 5.0,
                timestamp: baseTime + 1000000 - (5 - i) * 60000,
            });
        }
        const alerts = tracker.detectRegressions('model-a', 'review', 0.2);
        const qualityAlerts = alerts.filter(a => a.metric === 'quality');
        expect(qualityAlerts.length).toBeGreaterThan(0);
    });
    test('returns null for no data', () => {
        const summary = tracker.getSummary('nonexistent-model');
        expect(summary).toBeNull();
    });
    test('gets all summaries', () => {
        tracker.record({
            model: 'model-a',
            taskCategory: 'planning',
            sessionId: 's1',
            latencyMs: 1000,
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.01,
            qualityScore: 8.0,
            timestamp: Date.now(),
        });
        tracker.record({
            model: 'model-b',
            taskCategory: 'implementation',
            sessionId: 's2',
            latencyMs: 1500,
            inputTokens: 2000,
            outputTokens: 1000,
            cost: 0.02,
            qualityScore: 7.5,
            timestamp: Date.now(),
        });
        const summaries = tracker.getAllSummaries();
        expect(summaries.length).toBe(2);
    });
    test('clears old data', () => {
        tracker.record({
            model: 'model-a',
            taskCategory: 'planning',
            sessionId: 's1',
            latencyMs: 1000,
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.01,
            qualityScore: 8.0,
            timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        });
        tracker.record({
            model: 'model-a',
            taskCategory: 'planning',
            sessionId: 's2',
            latencyMs: 1200,
            inputTokens: 1000,
            outputTokens: 500,
            cost: 0.01,
            qualityScore: 8.5,
            timestamp: Date.now(),
        });
        tracker.clearOlderThan(7);
        const summary = tracker.getSummary('model-a', 'planning');
        expect(summary.totalRuns).toBe(1);
    });
});
//# sourceMappingURL=index.test.js.map