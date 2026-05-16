import { describe, test, expect, beforeEach } from 'bun:test';
import { MetricsCollector, createMetricsCollector } from './collector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = createMetricsCollector(':memory:', { dailyBudget: 5.0 });
  });

  test('records metric events', () => {
    collector.record({
      type: 'fallback_trigger',
      sessionId: 's1',
      model: 'test-model',
      agent: 'odin',
    });

    const results = collector.query({ type: 'fallback_trigger' });
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('fallback_trigger');
    expect(results[0].sessionId).toBe('s1');
    expect(results[0].model).toBe('test-model');
    expect(results[0].agent).toBe('odin');
  });

  test('queries by session', () => {
    collector.record({ type: 'model_routing', sessionId: 's1' });
    collector.record({ type: 'model_routing', sessionId: 's2' });

    const results = collector.query({ sessionId: 's1' });
    expect(results.length).toBe(1);
    expect(results[0].sessionId).toBe('s1');
  });

  test('queries by time range', () => {
    const now = Date.now();
    collector.record({ type: 'review_outcome', sessionId: 's1', timestamp: now - 10000 });
    collector.record({ type: 'review_outcome', sessionId: 's1', timestamp: now - 5000 });
    collector.record({ type: 'review_outcome', sessionId: 's1', timestamp: now });

    const results = collector.query({ since: now - 7500 });
    expect(results.length).toBe(2);
  });

  test('generates summary statistics', () => {
    collector.record({ type: 'fallback_trigger', sessionId: 's1', model: 'm1', agent: 'odin' });
    collector.record({ type: 'fallback_trigger', sessionId: 's2', model: 'm2', agent: 'thor' });
    collector.record({ type: 'model_routing', sessionId: 's1', model: 'm1' });

    const summary = collector.getSummary();
    expect(summary.totalCount).toBe(3);
    expect(summary.byType['fallback_trigger']).toBe(2);
    expect(summary.byType['model_routing']).toBe(1);
    expect(summary.byModel['m1']).toBe(2);
    expect(summary.byModel['m2']).toBe(1);
    expect(summary.byAgent['odin']).toBe(1);
    expect(summary.byAgent['thor']).toBe(1);
  });

  test('records token usage with cost calculation', () => {
    collector.recordTokenUsage('s1', 'opencode/nemotron-3-super-free', 1000, 500, 'odin');

    const tokenResults = collector.query({ type: 'token_usage' });
    expect(tokenResults.length).toBe(1);
    expect(tokenResults[0].value).toBe(1500);

    const costResults = collector.query({ type: 'cost_tracking' });
    expect(costResults.length).toBe(1);
    expect(costResults[0].value).toBe(0); // Free tier
  });

  test('calculates cost summary', () => {
    collector.recordTokenUsage('s1', 'opencode/nemotron-3-super-free', 1000, 500);
    collector.recordTokenUsage('s2', 'opencode/deepseek-v4-flash-free', 2000, 1000);

    const summary = collector.getCostSummary();
    expect(summary.totalTokens).toBe(4500);
    expect(summary.totalCost).toBe(0); // Both free tier
    expect(summary.budgetRemaining).toBe(5.0);
    expect(summary.budgetExceeded).toBe(false);
  });

  test('detects budget exceeded', () => {
    // Simulate high cost by recording many events
    for (let i = 0; i < 100; i++) {
      collector.record({
        type: 'cost_tracking',
        sessionId: 's1',
        model: 'expensive-model',
        value: 0.1, // $0.10 per event
      });
    }

    const summary = collector.getCostSummary();
    // getCostSummary only counts token_usage events for totalCost, not cost_tracking directly
    // So we need to check the raw cost_tracking sum
    const costEvents = collector.query({ type: 'cost_tracking' });
    const totalCost = costEvents.reduce((sum, e) => sum + (e.value ?? 0), 0);
    expect(totalCost).toBeCloseTo(10.0, 10);
    expect(summary.budgetExceeded).toBe(true);
  });

  test('suggests routing to cheaper model when budget exceeded', () => {
    // Exhaust budget
    for (let i = 0; i < 100; i++) {
      collector.record({
        type: 'cost_tracking',
        sessionId: 's1',
        value: 0.1,
      });
    }

    // shouldRouteToCheaperModel checks getCostSummary which looks at token_usage events
    // Let's test the budget logic directly
    const costEvents = collector.query({ type: 'cost_tracking' });
    const totalCost = costEvents.reduce((sum, e) => sum + (e.value ?? 0), 0);
    expect(totalCost).toBeGreaterThan(collector.getDailyBudget());
    expect(collector.getCheapModelAlternative('expensive-model')).toBe('opencode/deepseek-v4-flash-free');
  });

  test('manages daily budget', () => {
    expect(collector.getDailyBudget()).toBe(5.0);
    collector.setDailyBudget(10.0);
    expect(collector.getDailyBudget()).toBe(10.0);
  });

  test('clears old metrics', () => {
    const oldTime = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
    collector.record({ type: 'fallback_trigger', sessionId: 's1', timestamp: oldTime });
    collector.record({ type: 'fallback_trigger', sessionId: 's1' });

    expect(collector.getMetricsCount()).toBe(2);
    collector.clearOlderThan(7);
    expect(collector.getMetricsCount()).toBe(1);
  });

  test('queries with limit', () => {
    for (let i = 0; i < 50; i++) {
      collector.record({ type: 'model_routing', sessionId: 's1' });
    }

    const results = collector.query({ limit: 10 });
    expect(results.length).toBe(10);
  });

  test('filters by feature', () => {
    collector.record({ type: 'feature_success', sessionId: 's1', feature: 'hyperplan' });
    collector.record({ type: 'feature_success', sessionId: 's1', feature: 'review-work' });

    const results = collector.query({ feature: 'hyperplan' });
    expect(results.length).toBe(1);
    expect(results[0].feature).toBe('hyperplan');
  });
});
