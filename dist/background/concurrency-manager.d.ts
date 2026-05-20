/**
 * Configuration for background task concurrency.
 */
export interface ConcurrencyConfig {
    /** Default concurrency limit per model (default: 5) */
    defaultConcurrency?: number;
    /** Per-model concurrency limits: "provider/model" → limit */
    modelConcurrency?: Record<string, number>;
    /** Per-provider concurrency limits: "provider" → limit */
    providerConcurrency?: Record<string, number>;
    /** Circuit breaker: consecutive failures before opening (default: 5) */
    circuitBreakerThreshold?: number;
    /** Circuit breaker: cooldown before half-open (default: 30s) */
    circuitBreakerCooldownMs?: number;
}
/**
 * Concurrency manager with FIFO queue and circuit breaker.
 *
 * Prevents model overload by queuing tasks when concurrency limits are hit.
 * Circuit breaker opens when consecutive failures exceed threshold, preventing
 * cascading failures to already-struggling providers.
 *
 * Pattern adapted from openagent's background-agent/concurrency.ts.
 */
export declare class ConcurrencyManager {
    private config;
    private counts;
    private queues;
    private circuits;
    constructor(config?: ConcurrencyConfig);
    /** Get the concurrency limit for a model string */
    getConcurrencyLimit(model: string): number;
    /** Check if the circuit breaker is open for a model */
    isCircuitOpen(model: string): boolean;
    /** Record a success for the circuit breaker */
    recordSuccess(model: string): void;
    /** Record a failure for the circuit breaker */
    recordFailure(model: string): void;
    /** Acquire a concurrency slot for a model. Resolves when slot is available. */
    acquire(model: string): Promise<void>;
    /** Release a concurrency slot for a model */
    release(model: string): void;
    /** Cancel all waiting entries for a model (e.g., on shutdown) */
    cancelWaiters(model: string): void;
    /** Get current concurrency counts */
    getCounts(): Record<string, number>;
    /** Get queue depths */
    getQueueDepths(): Record<string, number>;
    /** Get circuit breaker states */
    getCircuitStates(): Record<string, {
        state: string;
        failures: number;
    }>;
    /** Dispose: cancel all waiters and clear state */
    dispose(): void;
}
//# sourceMappingURL=concurrency-manager.d.ts.map