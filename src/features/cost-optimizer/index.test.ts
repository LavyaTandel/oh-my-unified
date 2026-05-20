import { describe, expect, test, mock } from 'bun:test';
import { CostOptimizer, createCostOptimizer, DEFAULT_MODELS } from './index';
import { MetricsCollector } from '../metrics/collector';

describe('CostOptimizer', () => {
  test('should route reasoning tasks to Nemotron', () => {
    const optimizer = createCostOptimizer();
    const result = optimizer.optimize('reasoning');
    
    expect(result.modelId).toBe('nvidia/nemotron-4-340b-instruct');
    expect(result.reason).toContain('Nemotron');
    expect(result.expectedCostPerMillion).toBe(15.0);
  });

  test('should route speed tasks to DeepSeek', () => {
    const optimizer = createCostOptimizer();
    const result = optimizer.optimize('speed');
    
    expect(result.modelId).toBe('deepseek/deepseek-chat');
    expect(result.reason).toContain('DeepSeek');
    expect(result.expectedCostPerMillion).toBe(2.0);
  });

  test('should route docs tasks to MiniMax', () => {
    const optimizer = createCostOptimizer();
    const result = optimizer.optimize('docs');
    
    expect(result.modelId).toBe('minimax/minimax-text-01');
    expect(result.reason).toContain('MiniMax');
    expect(result.expectedCostPerMillion).toBe(4.0);
  });

  test('should respect context size constraints', () => {
    const optimizer = createCostOptimizer();
    
    // DeepSeek context limit is 64k, MiniMax is 200k. If we ask for speed task with 150k context, it must fallback to MiniMax.
    const result = optimizer.optimize('speed', { contextTokens: 150000 });
    
    expect(result.modelId).toBe('minimax/minimax-text-01');
    expect(result.reason).toContain('MiniMax');
  });

  test('should respect min reasoning constraint', () => {
    const optimizer = createCostOptimizer();
    
    // Nemotron (95 reasoning) vs MiniMax (80 reasoning).
    // Request a docs task (MiniMax is primary), but require reasoning >= 90
    const result = optimizer.optimize('docs', { minReasoning: 90 });
    
    expect(result.modelId).toBe('nvidia/nemotron-4-340b-instruct');
  });

  test('should fallback dynamically when a model is disabled', () => {
    const optimizer = createCostOptimizer();
    
    // Disable Nemotron (primary for reasoning)
    optimizer.disableModel('nvidia/nemotron-4-340b-instruct');
    
    // Reasoning task should fall back to the next best enabled (DeepSeek)
    const result = optimizer.optimize('reasoning');
    expect(result.modelId).toBe('deepseek/deepseek-chat');
    
    // Re-enable and verify it goes back to Nemotron
    optimizer.enableModel('nvidia/nemotron-4-340b-instruct');
    const result2 = optimizer.optimize('reasoning');
    expect(result2.modelId).toBe('nvidia/nemotron-4-340b-instruct');
  });

  test('should fallback to cheapest model when budget is completely exceeded', () => {
    // Create a mock MetricsCollector with budget exceeded
    const mockCollector = {
      getCostSummary: () => ({
        totalTokens: 1000000,
        totalCost: 12.0,
        byModel: {},
        bySession: {},
        budgetRemaining: 0,
        budgetExceeded: true,
      }),
      getDailyBudget: () => 10.0,
    } as unknown as MetricsCollector;

    const optimizer = createCostOptimizer(mockCollector);
    
    // A reasoning task should normally go to Nemotron ($15/M), but budget is exceeded, so it must route to big-pickle (free tier)
    const result = optimizer.optimize('reasoning');
    expect(result.modelId).toBe('big-pickle/big-pickle-free');
    expect(result.reason).toContain('Budget Exceeded');
  });

  test('should restrict to low cost models when budget is near-exhausted', () => {
    // Create a mock MetricsCollector with remaining budget < 20%
    const mockCollector = {
      getCostSummary: () => ({
        totalTokens: 800000,
        totalCost: 8.5,
        byModel: {},
        bySession: {},
        budgetRemaining: 1.5,
        budgetExceeded: false,
      }),
      getDailyBudget: () => 10.0,
    } as unknown as MetricsCollector;

    const optimizer = createCostOptimizer(mockCollector);
    
    // Reasoning task normally goes to Nemotron ($15/M), but budget is low, so it should route to the next best costing <= $2.0 (DeepSeek)
    const result = optimizer.optimize('reasoning');
    expect(result.modelId).toBe('deepseek/deepseek-chat');
    expect(result.reason).toContain('Budget Low');
  });

  test('should return absolute cheapest fallback if all models are disabled', () => {
    const optimizer = createCostOptimizer();
    
    // Disable all models
    for (const model of DEFAULT_MODELS) {
      optimizer.disableModel(model.id);
    }
    
    // Should fallback to big-pickle (cheapest) rather than crashing
    const result = optimizer.optimize('reasoning');
    expect(result.modelId).toBe('big-pickle/big-pickle-free');
    expect(result.reason).toContain('All models disabled');
  });
});
