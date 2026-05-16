import { log } from '../../utils/logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 3,
  recoveryTimeoutMs: 60000, // 1 minute
  halfOpenMaxAttempts: 1,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private options: CircuitBreakerOptions;
  readonly name: string;

  constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
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

  canExecute(): boolean {
    const state = this.getState();
    return state === 'closed' || state === 'half-open';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker '${this.name}' is open`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenMaxAttempts) {
        this.state = 'closed';
        log('[circuit-breaker] transition to closed', { name: this.name });
      }
    }
  }

  private onFailure(): void {
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

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    log('[circuit-breaker] manually reset', { name: this.name });
  }

  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  create(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    const breaker = new CircuitBreaker(name, options);
    this.breakers.set(name, breaker);
    return breaker;
  }

  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  getHealthReport(): Array<{ name: string; state: CircuitState; failureCount: number }> {
    const report: Array<{ name: string; state: CircuitState; failureCount: number }> = [];
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

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export function createCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  return new CircuitBreaker(name, options);
}

export function createCircuitBreakerRegistry(): CircuitBreakerRegistry {
  return new CircuitBreakerRegistry();
}
