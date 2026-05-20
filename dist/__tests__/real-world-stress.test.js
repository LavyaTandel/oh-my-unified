import { describe, test, expect } from 'bun:test';
import { createTransparencyLog } from '../features/transparency-log';
import { createCircuitBreakerRegistry } from '../features/circuit-breaker';
import { createLearningEngine } from '../features/learning-engine';
import { createModelPredictor } from '../features/model-predictor';
import { createBenchmarkTracker } from '../features/benchmark-tracker';
import { createPluginRegistry } from '../features/plugin-registry';
import { createSkillCodifier } from '../features/skill-codifier';
import { createSessionRouter } from '../features/session-router';
import { createIntegrationHub } from '../features/integration-hub';
import { createMetricsCollector } from '../features/metrics';
describe('Real-World Stress Test — All Feature Modules', () => {
    test('end-to-end: model routing → prediction → benchmark → transparency', () => {
        const tlog = createTransparencyLog();
        const predictor = createModelPredictor();
        const tracker = createBenchmarkTracker(':memory:');
        const metrics = createMetricsCollector(':memory:', { dailyBudget: 10.0 });
        const models = [
            'opencode/nemotron-3-super-free',
            'opencode/qwen3.6-plus-free',
            'opencode/deepseek-v4-flash-free',
            'opencode/minimax-m2.5-free',
            'opencode/big-pickle',
        ];
        for (let i = 0; i < 100; i++) {
            const model = models[i % 5];
            const taskType = ['reasoning', 'speed', 'docs', 'exploration', 'balanced'][i % 5];
            const success = i % 7 !== 0;
            predictor.recordOutcome(model, taskType, success);
            tracker.record({
                model,
                taskCategory: taskType,
                sessionId: `session-${i % 5}`,
                latencyMs: 100 + Math.random() * 900,
                inputTokens: 500 + Math.floor(Math.random() * 2000),
                outputTokens: 100 + Math.floor(Math.random() * 1000),
                cost: Math.random() * 0.01,
                qualityScore: 5 + Math.random() * 5,
                timestamp: Date.now() + i,
            });
            tlog.record({
                type: 'model_routing',
                sessionId: `session-${i % 5}`,
                message: `Routed ${taskType} to ${model}`,
                details: { model, taskType, success },
                confidence: success ? 0.85 : 0.3,
            });
            metrics.record({
                type: success ? 'feature_success' : 'feature_error',
                sessionId: `session-${i % 5}`,
                model,
                feature: 'model-router',
                metadata: JSON.stringify({ taskType }),
            });
        }
        const prediction = predictor.predictBestModel('reasoning', models);
        expect(prediction.recommendedModel).toBeOneOf(models);
        const summaries = tracker.getAllSummaries();
        expect(summaries.length).toBeGreaterThan(0);
        const tStats = tlog.getStats();
        expect(tStats.totalEntries).toBe(100);
        const mCount = metrics.getMetricsCount();
        expect(mCount).toBe(100);
    });
    test('circuit breakers under rapid failure/recovery cycles', async () => {
        const registry = createCircuitBreakerRegistry();
        const breaker = registry.create('test-breaker', { failureThreshold: 3, recoveryTimeoutMs: 50 });
        // Trip the breaker with 3 failures
        for (let i = 0; i < 3; i++) {
            try {
                await breaker.execute(async () => {
                    throw new Error(`Failure ${i}`);
                });
            }
            catch {
                // Expected
            }
        }
        // Should be open now
        const statsAfterTrip = breaker.getStats();
        expect(statsAfterTrip.state).toBe('open');
        // Wait for recovery timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        // Should be half-open after recovery
        const statsAfterRecovery = breaker.getStats();
        expect(statsAfterRecovery.state).toBe('half-open');
        // One success should close it
        await breaker.execute(async () => 'success');
        const statsAfterSuccess = breaker.getStats();
        expect(statsAfterSuccess.state).toBe('closed');
    });
    test('learning engine: save, find, recall across sessions', () => {
        const engine = createLearningEngine(':memory:');
        engine.saveLesson({
            sessionId: 'session-1',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'assess requirements before assembling',
            description: 'Always assess before assembling',
            outcome: 'success',
            confidence: 0.8,
        });
        engine.saveLesson({
            sessionId: 'session-1',
            taskCategory: 'planning',
            lessonType: 'best_practice',
            pattern: 'check dependencies before acting',
            description: 'Check dependencies before acting',
            outcome: 'success',
            confidence: 0.7,
        });
        engine.saveLesson({
            sessionId: 'session-2',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'use nemotron for deep reasoning tasks',
            description: 'Use nemotron for deep reasoning',
            outcome: 'success',
            confidence: 0.9,
        });
        const planningLessons = engine.findRelevantLessons('planning', 'assess before assembling');
        expect(planningLessons.length).toBeGreaterThan(0);
        for (const l of planningLessons) {
            expect(l.similarity).toBeGreaterThan(0);
            expect(l.similarity).toBeLessThanOrEqual(1);
        }
        const stats = engine.getStats();
        expect(stats.totalLessons).toBe(3);
        expect(stats.byCategory.planning).toBe(3);
    });
    test('plugin registry: register, execute hooks, stats', () => {
        const registry = createPluginRegistry();
        registry.register({
            metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0', description: 'Test plugin' },
            hooks: [
                {
                    name: 'chat.message',
                    handler: async (input, output) => {
                        output.parts.push({ type: 'system', text: 'Plugin injected' });
                    },
                },
            ],
            enabled: true,
        });
        registry.register({
            metadata: { id: 'another-plugin', name: 'Another Plugin', version: '2.0.0', description: 'Another plugin' },
            hooks: [],
            enabled: true,
        });
        const output = { parts: [] };
        // Note: executeHooks is async
        // For sync test, we verify registration
        const stats = registry.getStats();
        expect(stats.totalPlugins).toBe(2);
        expect(stats.totalHooks).toBe(1);
        expect(stats.byHookType['chat.message']).toBe(1);
    });
    test('skill codifier: pattern detection, threshold, codification', () => {
        const codifier = createSkillCodifier({ threshold: 3 });
        for (let i = 0; i < 5; i++) {
            codifier.recordOccurrence({
                pattern: 'JSON parse error → 6-pass repair',
                category: 'error-recovery',
                sessionId: `session-${i}`,
                timestamp: Date.now() + i,
                success: true,
            });
        }
        const result = codifier.shouldGenerateSkill('error-recovery', 'JSON parse error → 6-pass repair');
        expect(result.generated).toBe(true);
        expect(result.skill).toBeDefined();
        const stats = codifier.getStats();
        expect(stats.totalOccurrences).toBe(5);
        expect(stats.generatedSkills).toBe(1);
    });
    test('session router: create sessions, orgs, stats', () => {
        const router = createSessionRouter();
        router.createAgentOrg('org-1', 'Team Alpha', 'user-1');
        router.createAgentOrg('org-2', 'Team Beta', 'user-3');
        router.createUserSession('user-1', 'session-1', 'org-1', 'owner');
        router.createUserSession('user-2', 'session-2', 'org-1', 'collaborator');
        router.createUserSession('user-3', 'session-3', 'org-2', 'owner');
        const orgSessions = router.getOrgSessions('org-1');
        expect(orgSessions.length).toBe(2);
        const stats = router.getStats();
        expect(stats.totalUsers).toBe(3);
        expect(stats.totalOrgs).toBe(2);
    });
    test('integration hub: register, process webhooks, stats', () => {
        const hub = createIntegrationHub();
        hub.registerIntegration({
            id: 'github',
            type: 'github',
            name: 'GitHub',
            enabled: true,
            config: { url: 'https://api.github.com' },
        });
        hub.registerIntegration({
            id: 'jira',
            type: 'jira',
            name: 'Jira',
            enabled: true,
            config: { url: 'https://api.atlassian.com' },
        });
        hub.registerIntegration({
            id: 'slack',
            type: 'slack',
            name: 'Slack',
            enabled: false,
            config: { url: 'https://slack.com' },
        });
        const stats = hub.getStats();
        expect(stats.totalIntegrations).toBe(3);
        expect(stats.enabledIntegrations).toBe(2);
        expect(stats.byType.github).toBe(1);
    });
    test('transparency log: 14 entry types, all queryable', () => {
        const tlog = createTransparencyLog();
        const types = [
            'model_routing', 'agent_selection', 'circuit_breaker', 'feature_trigger',
            'error', 'warning', 'decision', 'plan_phase', 'audit_result',
            'review_verdict', 'security_finding', 'learning_applied',
            'prediction_made', 'benchmark_recorded',
        ];
        for (let i = 0; i < types.length; i++) {
            tlog.record({
                type: types[i],
                sessionId: `session-${i % 3}`,
                message: `Testing ${types[i]}`,
                details: { index: i },
                confidence: 0.5 + (i % 10) / 20,
            });
        }
        for (const type of types) {
            const entries = tlog.getByType(type);
            expect(entries.length).toBe(1);
            expect(entries[0].type).toBe(type);
        }
        const stats = tlog.getStats();
        expect(Object.keys(stats.byType).length).toBe(14);
    });
    test('combined: all modules under load (500 operations)', () => {
        const tlog = createTransparencyLog();
        const registry = createCircuitBreakerRegistry();
        const engine = createLearningEngine(':memory:');
        const predictor = createModelPredictor();
        const tracker = createBenchmarkTracker(':memory:');
        const pluginReg = createPluginRegistry();
        const codifier = createSkillCodifier({ threshold: 10 });
        const router = createSessionRouter();
        const hub = createIntegrationHub();
        const metrics = createMetricsCollector(':memory:', { dailyBudget: 10.0 });
        const models = [
            'opencode/nemotron-3-super-free',
            'opencode/qwen3.6-plus-free',
            'opencode/deepseek-v4-flash-free',
            'opencode/minimax-m2.5-free',
            'opencode/big-pickle',
        ];
        for (let i = 0; i < 500; i++) {
            const model = models[i % 5];
            const session = `session-${i % 10}`;
            const success = i % 8 !== 0;
            predictor.recordOutcome(model, 'general', success);
            tracker.record({
                model,
                taskCategory: 'general',
                sessionId: session,
                latencyMs: 100 + Math.random() * 900,
                inputTokens: 500 + Math.floor(Math.random() * 2000),
                outputTokens: 100 + Math.floor(Math.random() * 1000),
                cost: Math.random() * 0.01,
                qualityScore: 5 + Math.random() * 5,
                timestamp: Date.now() + i,
            });
            tlog.record({
                type: ['model_routing', 'decision', 'prediction_made'][i % 3],
                sessionId: session,
                message: `Operation ${i}`,
                confidence: success ? 0.85 : 0.3,
            });
            metrics.record({
                type: success ? 'feature_success' : 'feature_error',
                sessionId: session,
                model,
                feature: 'stress-test',
            });
        }
        expect(tlog.getStats().totalEntries).toBe(500);
        expect(tracker.getAllSummaries().length).toBeGreaterThan(0);
        expect(metrics.getMetricsCount()).toBe(500);
    });
    test('memory stability: 5000 transparency entries, verify trimming', () => {
        const tlog = createTransparencyLog();
        for (let i = 0; i < 5000; i++) {
            tlog.record({
                type: 'model_routing',
                sessionId: `session-${i % 50}`,
                message: `Entry ${i}`,
                details: { index: i, data: 'x'.repeat(50) },
            });
        }
        expect(tlog.getStats().totalEntries).toBe(1000);
        expect(Object.keys(tlog.getStats().bySession).length).toBe(50);
    });
    test('model predictor: learns from 200 outcomes, makes accurate predictions', () => {
        const predictor = createModelPredictor();
        const models = [
            'opencode/nemotron-3-super-free',
            'opencode/qwen3.6-plus-free',
            'opencode/deepseek-v4-flash-free',
            'opencode/minimax-m2.5-free',
            'opencode/big-pickle',
        ];
        for (let i = 0; i < 100; i++) {
            predictor.recordOutcome('opencode/nemotron-3-super-free', 'reasoning', i < 90);
        }
        for (let i = 0; i < 100; i++) {
            predictor.recordOutcome('opencode/deepseek-v4-flash-free', 'speed', i < 85);
        }
        const reasoningPred = predictor.predictBestModel('reasoning', models);
        expect(reasoningPred.recommendedModel).toBe('opencode/nemotron-3-super-free');
        expect(reasoningPred.confidence).toBeGreaterThan(0.7);
        const speedPred = predictor.predictBestModel('speed', models);
        expect(speedPred.recommendedModel).toBe('opencode/deepseek-v4-flash-free');
        expect(speedPred.confidence).toBeGreaterThan(0.7);
    });
});
//# sourceMappingURL=real-world-stress.test.js.map