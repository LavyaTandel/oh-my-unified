export type CircuitState = 'closed' | 'open' | 'half-open';
export interface CircuitBreakerOptions {
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxAttempts: number;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private options;
    readonly name: string;
    constructor(name: string, options?: Partial<CircuitBreakerOptions>);
    getState(): CircuitState;
    canExecute(): boolean;
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    reset(): void;
    getStats(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        lastFailureTime: number;
    };
}
export declare class CircuitBreakerRegistry {
    private breakers;
    get(name: string): CircuitBreaker | undefined;
    create(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker;
    getAll(): Map<string, CircuitBreaker>;
    getHealthReport(): Array<{
        name: string;
        state: CircuitState;
        failureCount: number;
    }>;
    resetAll(): void;
}
export declare function createCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker;
export declare function createCircuitBreakerRegistry(): CircuitBreakerRegistry;
//# sourceMappingURL=index.d.ts.map