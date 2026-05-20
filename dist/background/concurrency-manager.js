import { log } from '../utils/logger';
/**
 * Concurrency manager with FIFO queue and circuit breaker.
 *
 * Prevents model overload by queuing tasks when concurrency limits are hit.
 * Circuit breaker opens when consecutive failures exceed threshold, preventing
 * cascading failures to already-struggling providers.
 *
 * Pattern adapted from openagent's background-agent/concurrency.ts.
 */
export class ConcurrencyManager {
    config;
    counts = new Map();
    queues = new Map();
    circuits = new Map();
    constructor(config) {
        this.config = {
            defaultConcurrency: config?.defaultConcurrency ?? 5,
            modelConcurrency: config?.modelConcurrency ?? {},
            providerConcurrency: config?.providerConcurrency ?? {},
            circuitBreakerThreshold: config?.circuitBreakerThreshold ?? 5,
            circuitBreakerCooldownMs: config?.circuitBreakerCooldownMs ?? 30_000,
        };
    }
    /** Get the concurrency limit for a model string */
    getConcurrencyLimit(model) {
        const modelLimit = this.config.modelConcurrency[model];
        if (modelLimit !== undefined) {
            return modelLimit === 0 ? Infinity : modelLimit;
        }
        const provider = model.split('/')[0];
        const providerLimit = this.config.providerConcurrency[provider];
        if (providerLimit !== undefined) {
            return providerLimit === 0 ? Infinity : providerLimit;
        }
        return this.config.defaultConcurrency === 0
            ? Infinity
            : this.config.defaultConcurrency;
    }
    /** Check if the circuit breaker is open for a model */
    isCircuitOpen(model) {
        const circuit = this.circuits.get(model);
        if (!circuit || circuit.state === 'closed')
            return false;
        if (circuit.state === 'open') {
            const elapsed = Date.now() - circuit.lastFailureTime;
            if (elapsed >= this.config.circuitBreakerCooldownMs) {
                circuit.state = 'half-open';
                log('[concurrency] circuit breaker half-open', { model });
                return false;
            }
            return true;
        }
        return false;
    }
    /** Record a success for the circuit breaker */
    recordSuccess(model) {
        const circuit = this.circuits.get(model) ?? {
            failures: 0,
            lastFailureTime: 0,
            state: 'closed',
        };
        circuit.failures = 0;
        circuit.state = 'closed';
        this.circuits.set(model, circuit);
    }
    /** Record a failure for the circuit breaker */
    recordFailure(model) {
        const circuit = this.circuits.get(model) ?? {
            failures: 0,
            lastFailureTime: 0,
            state: 'closed',
        };
        circuit.failures++;
        circuit.lastFailureTime = Date.now();
        if (circuit.failures >= this.config.circuitBreakerThreshold) {
            circuit.state = 'open';
            log('[concurrency] circuit breaker opened', {
                model,
                failures: circuit.failures,
            });
            // Reject all waiting queue entries
            this.cancelWaiters(model);
        }
        this.circuits.set(model, circuit);
    }
    /** Acquire a concurrency slot for a model. Resolves when slot is available. */
    async acquire(model) {
        const limit = this.getConcurrencyLimit(model);
        if (limit === Infinity)
            return;
        if (this.isCircuitOpen(model)) {
            throw new Error(`Circuit breaker open for ${model}. Retry after ${this.config.circuitBreakerCooldownMs}ms`);
        }
        const current = this.counts.get(model) ?? 0;
        if (current < limit) {
            this.counts.set(model, current + 1);
            return;
        }
        // Queue the request (FIFO)
        return new Promise((resolve, reject) => {
            const queue = this.queues.get(model) ?? [];
            const entry = {
                resolve: () => {
                    if (entry.settled)
                        return;
                    entry.settled = true;
                    this.counts.set(model, (this.counts.get(model) ?? 0) + 1);
                    resolve();
                },
                reject,
                settled: false,
            };
            queue.push(entry);
            this.queues.set(model, queue);
        });
    }
    /** Release a concurrency slot for a model */
    release(model) {
        const limit = this.getConcurrencyLimit(model);
        if (limit === Infinity)
            return;
        const current = this.counts.get(model) ?? 0;
        this.counts.set(model, Math.max(0, current - 1));
        // Hand off to the next waiting entry
        const queue = this.queues.get(model) ?? [];
        while (queue.length > 0) {
            const entry = queue.shift();
            if (entry && !entry.settled) {
                entry.resolve();
                return;
            }
        }
    }
    /** Cancel all waiting entries for a model (e.g., on shutdown) */
    cancelWaiters(model) {
        const queue = this.queues.get(model) ?? [];
        for (const entry of queue) {
            if (!entry.settled) {
                entry.settled = true;
                entry.reject(new Error(`Concurrency waiters cancelled for ${model}`));
            }
        }
        this.queues.set(model, []);
    }
    /** Get current concurrency counts */
    getCounts() {
        const result = {};
        for (const [model, count] of this.counts) {
            result[model] = count;
        }
        return result;
    }
    /** Get queue depths */
    getQueueDepths() {
        const result = {};
        for (const [model, queue] of this.queues) {
            result[model] = queue.length;
        }
        return result;
    }
    /** Get circuit breaker states */
    getCircuitStates() {
        const result = {};
        for (const [model, circuit] of this.circuits) {
            result[model] = {
                state: circuit.state,
                failures: circuit.failures,
            };
        }
        return result;
    }
    /** Dispose: cancel all waiters and clear state */
    dispose() {
        for (const model of this.queues.keys()) {
            this.cancelWaiters(model);
        }
        this.counts.clear();
        this.queues.clear();
        this.circuits.clear();
    }
}
//# sourceMappingURL=concurrency-manager.js.map