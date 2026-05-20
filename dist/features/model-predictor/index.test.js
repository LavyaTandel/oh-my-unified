import { describe, test, expect, beforeEach } from 'bun:test';
import { createModelPredictor } from './index';
describe('ModelPredictor', () => {
    let predictor;
    beforeEach(() => {
        predictor = createModelPredictor();
    });
    test('records model outcomes', () => {
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-a', 'planning', false);
        const perf = predictor.getModelPerformance('model-a', 'planning');
        expect(perf).toBeDefined();
        expect(perf.successCount).toBe(2);
        expect(perf.failureCount).toBe(1);
        expect(perf.successRate).toBeCloseTo(0.667, 2);
    });
    test('predicts best model for task category', () => {
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-b', 'planning', true);
        predictor.recordOutcome('model-b', 'planning', false);
        const prediction = predictor.predictBestModel('planning', ['model-a', 'model-b']);
        expect(prediction.recommendedModel).toBe('model-a');
        expect(prediction.confidence).toBeCloseTo(1.0, 2);
        expect(prediction.alternatives.length).toBe(1);
    });
    test('returns default when no data', () => {
        const prediction = predictor.predictBestModel('planning', ['model-a', 'model-b']);
        expect(prediction.recommendedModel).toBe('model-a');
        expect(prediction.confidence).toBe(0.5);
        expect(prediction.reasoning).toContain('No historical data');
    });
    test('tracks latency', () => {
        predictor.recordOutcome('model-a', 'implementation', true, 1000);
        predictor.recordOutcome('model-a', 'implementation', true, 1200);
        const perf = predictor.getModelPerformance('model-a', 'implementation');
        expect(perf.avgLatency).toBe(1100);
    });
    test('aggregates performance across categories', () => {
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-a', 'implementation', true);
        predictor.recordOutcome('model-a', 'review', false);
        const perf = predictor.getModelPerformance('model-a');
        expect(perf).toBeDefined();
        expect(perf.successCount).toBe(2);
        expect(perf.failureCount).toBe(1);
        expect(perf.taskCategory).toBe('all');
    });
    test('generates summary statistics', () => {
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-a', 'planning', true);
        predictor.recordOutcome('model-b', 'implementation', true);
        predictor.recordOutcome('model-b', 'implementation', false);
        const summary = predictor.getSummary();
        expect(summary.totalModels).toBe(2);
        expect(summary.totalAttempts).toBe(4);
        expect(summary.topPerformers.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=index.test.js.map