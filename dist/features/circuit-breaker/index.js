import { log } from '../../utils/logger';
const DEFAULT_OPTIONS = {
    failureThreshold: 3,
    recoveryTimeoutMs: 60000, // 1 minute
    halfOpenMaxAttempts: 1,
};
export class CircuitBreaker {
    state = 'closed';
    failureCount = 0;
    successCount = 0;
    lastFailureTime = 0;
    options;
    name;
    constructor(name, options) {
        this.name = name;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    getState() {
        if (this.state === 'open') {
            const now = Date.now();
            if (now - this.lastFailureTime > this.options.recoveryTimeoutMs) {
                this.state = 'half-open';
                this.successCount = 0;
                log('[circuit-breaker] transition to half-open', { name: this.name });
            }
        }
        return this.state;
    }
    canExecute() {
        const state = this.getState();
        return state === 'closed' || state === 'half-open';
    }
    async execute(fn) {
        if (!this.canExecute()) {
            throw new Error(`Circuit breaker '${this.name}' is open`);
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= this.options.halfOpenMaxAttempts) {
                this.state = 'closed';
                log('[circuit-breaker] transition to closed', { name: this.name });
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.options.failureThreshold) {
            this.state = 'open';
            log('[circuit-breaker] transition to open', {
                name: this.name,
                failures: this.failureCount,
            });
        }
    }
    reset() {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        log('[circuit-breaker] manually reset', { name: this.name });
    }
    getStats() {
        return {
            state: this.getState(),
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
        };
    }
}
export class CircuitBreakerRegistry {
    breakers = new Map();
    get(name) {
        return this.breakers.get(name);
    }
    create(name, options) {
        const breaker = new CircuitBreaker(name, options);
        this.breakers.set(name, breaker);
        return breaker;
    }
    getAll() {
        return this.breakers;
    }
    getHealthReport() {
        const report = [];
        for (const [name, breaker] of this.breakers) {
            const stats = breaker.getStats();
            report.push({
                name,
                state: stats.state,
                failureCount: stats.failureCount,
            });
        }
        return report;
    }
    resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
}
export function createCircuitBreaker(name, options) {
    return new CircuitBreaker(name, options);
}
export function createCircuitBreakerRegistry() {
    return new CircuitBreakerRegistry();
}
//# sourceMappingURL=index.js.map