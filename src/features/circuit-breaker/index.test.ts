import { describe, test, expect, beforeEach } from 'bun:test';
import { CircuitBreaker, CircuitBreakerRegistry, createCircuitBreaker, createCircuitBreakerRegistry } from './index';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = createCircuitBreaker('test', { failureThreshold: 2, recoveryTimeoutMs: 100 });
  });

  test('starts in closed state', () => {
    expect(breaker.getState()).toBe('closed');
    expect(breaker.canExecute()).toBe(true);
  });

  test('transitions to open after threshold failures', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    expect(breaker.getState()).toBe('closed');

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    expect(breaker.getState()).toBe('open');
    expect(breaker.canExecute()).toBe(false);
  });

  test('rejects execution when open', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

    await expect(breaker.execute(async () => 'success')).rejects.toThrow('open');
  });

  test('transitions to half-open after recovery timeout', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe('open');

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(breaker.getState()).toBe('half-open');
    expect(breaker.canExecute()).toBe(true);
  });

  test('transitions back to closed after successful half-open execution', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(breaker.getState()).toBe('half-open');

    // Successful execution in half-open
    const result = await breaker.execute(async () => 'success');
    expect(result).toBe('success');
    expect(breaker.getState()).toBe('closed');
  });

  test('resets manually', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

    expect(breaker.getState()).toBe('open');

    breaker.reset();
    expect(breaker.getState()).toBe('closed');
    expect(breaker.canExecute()).toBe(true);
  });

  test('tracks stats', async () => {
    const failingFn = async () => { throw new Error('fail'); };

    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
    await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

    const stats = breaker.getStats();
    expect(stats.state).toBe('open');
    expect(stats.failureCount).toBe(2);
    expect(stats.lastFailureTime).toBeGreaterThan(0);
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = createCircuitBreakerRegistry();
  });

  test('creates and retrieves breakers', () => {
    const breaker = registry.create('test-breaker');
    const retrieved = registry.get('test-breaker');
    expect(retrieved).toBe(breaker);
  });

  test('generates health report', () => {
    registry.create('breaker1', { failureThreshold: 2 });
    registry.create('breaker2', { failureThreshold: 3 });

    const report = registry.getHealthReport();
    expect(report.length).toBe(2);
    expect(report[0].name).toBe('breaker1');
    expect(report[1].name).toBe('breaker2');
  });

  test('resets all breakers', () => {
    const b1 = registry.create('b1', { failureThreshold: 1 });
    const b2 = registry.create('b2', { failureThreshold: 1 });

    // Trip both breakers
    b1.execute(async () => { throw new Error('fail'); }).catch(() => {});
    b2.execute(async () => { throw new Error('fail'); }).catch(() => {});

    registry.resetAll();
    expect(b1.getState()).toBe('closed');
    expect(b2.getState()).toBe('closed');
  });
});
