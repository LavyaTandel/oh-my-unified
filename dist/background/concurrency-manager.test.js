import { describe, it, expect } from 'bun:test';
import { ConcurrencyManager } from './concurrency-manager';
describe('ConcurrencyManager', () => {
    it('acquires slot when under limit', async () => {
        const manager = new ConcurrencyManager({ defaultConcurrency: 5 });
        await manager.acquire('test-model');
        expect(manager.getCounts()['test-model']).toBe(1);
        manager.release('test-model');
    });
    it('queues when at limit', async () => {
        const manager = new ConcurrencyManager({ defaultConcurrency: 1 });
        await manager.acquire('test-model');
        const p1 = manager.acquire('test-model');
        // Queue has one entry waiting
        expect(manager.getQueueDepths()['test-model']).toBe(1);
        // Release hands off to the queued entry
        manager.release('test-model');
        // Queue should be empty, count back to 1
        expect(manager.getQueueDepths()['test-model']).toBe(0);
        expect(manager.getCounts()['test-model']).toBe(1);
        // The queued promise should resolve
        await p1;
        // Clean up
        manager.release('test-model');
    });
    it('respects per-model limits', async () => {
        const manager = new ConcurrencyManager({
            modelConcurrency: { 'fast-model': 10, 'slow-model': 2 },
        });
        expect(manager.getConcurrencyLimit('fast-model')).toBe(10);
        expect(manager.getConcurrencyLimit('slow-model')).toBe(2);
        expect(manager.getConcurrencyLimit('unknown-model')).toBe(5);
    });
    it('respects per-provider limits', async () => {
        const manager = new ConcurrencyManager({
            providerConcurrency: { openai: 8 },
        });
        expect(manager.getConcurrencyLimit('openai/gpt-4o')).toBe(8);
        expect(manager.getConcurrencyLimit('anthropic/claude')).toBe(5);
    });
    it('returns Infinity for zero limit', () => {
        const manager = new ConcurrencyManager({ defaultConcurrency: 0 });
        expect(manager.getConcurrencyLimit('any-model')).toBe(Infinity);
    });
    it('circuit breaker opens after consecutive failures', () => {
        const manager = new ConcurrencyManager({ circuitBreakerThreshold: 3 });
        manager.recordFailure('test-model');
        manager.recordFailure('test-model');
        expect(manager.isCircuitOpen('test-model')).toBe(false);
        manager.recordFailure('test-model');
        expect(manager.isCircuitOpen('test-model')).toBe(true);
    });
    it('circuit breaker closes on success', () => {
        const manager = new ConcurrencyManager({ circuitBreakerThreshold: 2 });
        manager.recordFailure('test-model');
        manager.recordFailure('test-model');
        expect(manager.isCircuitOpen('test-model')).toBe(true);
        manager.recordSuccess('test-model');
        expect(manager.isCircuitOpen('test-model')).toBe(false);
    });
    it('circuit breaker transitions to half-open after cooldown', () => {
        const manager = new ConcurrencyManager({
            circuitBreakerThreshold: 2,
            circuitBreakerCooldownMs: 50,
        });
        manager.recordFailure('test-model');
        manager.recordFailure('test-model');
        expect(manager.isCircuitOpen('test-model')).toBe(true);
        // Wait for cooldown
        return new Promise((resolve) => {
            setTimeout(() => {
                expect(manager.isCircuitOpen('test-model')).toBe(false);
                resolve();
            }, 60);
        });
    });
    it('throws when acquiring with open circuit', async () => {
        const manager = new ConcurrencyManager({ circuitBreakerThreshold: 1 });
        manager.recordFailure('test-model');
        await expect(manager.acquire('test-model')).rejects.toThrow('Circuit breaker open');
    });
    it('cancels waiters on circuit open', () => {
        const manager = new ConcurrencyManager({
            defaultConcurrency: 1,
            circuitBreakerThreshold: 1,
        });
        manager.acquire('test-model').catch(() => { });
        // This will open the circuit and cancel waiters
        manager.recordFailure('test-model');
        expect(manager.getQueueDepths()['test-model'] ?? 0).toBe(0);
        manager.release('test-model');
    });
    it('dispose cancels all waiters', () => {
        const manager = new ConcurrencyManager({ defaultConcurrency: 1 });
        manager.acquire('test-model').catch(() => { });
        manager.acquire('test-model').catch(() => { });
        manager.dispose();
        expect(manager.getQueueDepths()['test-model'] ?? 0).toBe(0);
    });
    it('returns circuit states', () => {
        const manager = new ConcurrencyManager();
        manager.recordFailure('test-model');
        const states = manager.getCircuitStates();
        expect(states['test-model']).toBeDefined();
        expect(states['test-model'].failures).toBe(1);
        expect(states['test-model'].state).toBe('closed');
    });
});
//# sourceMappingURL=concurrency-manager.test.js.map