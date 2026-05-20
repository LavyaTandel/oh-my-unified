export type MetricType = 'fallback_trigger' | 'model_routing' | 'review_outcome' | 'security_finding' | 'token_usage' | 'cost_tracking' | 'feature_error' | 'feature_success' | 'circuit_breaker_trip' | 'pipeline_phase';
export interface MetricEvent {
    type: MetricType;
    sessionId: string;
    agent?: string;
    model?: string;
    feature?: string;
    value?: number;
    metadata?: string;
    timestamp?: number;
}
export interface MetricQuery {
    type?: MetricType;
    sessionId?: string;
    agent?: string;
    model?: string;
    feature?: string;
    since?: number;
    limit?: number;
}
export interface MetricSummary {
    totalCount: number;
    byType: Record<string, number>;
    byModel: Record<string, number>;
    byAgent: Record<string, number>;
    byFeature: Record<string, number>;
    avgValue?: number;
    totalValue?: number;
}
export interface CostSummary {
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, {
        tokens: number;
        cost: number;
    }>;
    bySession: Record<string, {
        tokens: number;
        cost: number;
    }>;
    budgetRemaining: number;
    budgetExceeded: boolean;
}
export declare class MetricsCollector {
    private db;
    private dailyBudget;
    private costPerModel;
    constructor(dbPath?: string, options?: {
        dailyBudget?: number;
        costPerModel?: Record<string, {
            inputPerToken: number;
            outputPerToken: number;
        }>;
    });
    private migrate;
    record(event: MetricEvent): void;
    query(query: MetricQuery): Array<MetricEvent & {
        id: number;
    }>;
    getSummary(query?: MetricQuery): MetricSummary;
    recordTokenUsage(sessionId: string, model: string, inputTokens: number, outputTokens: number, agent?: string): void;
    private calculateCost;
    getCostSummary(since?: number): CostSummary;
    shouldRouteToCheaperModel(currentModel: string): boolean;
    getCheapModelAlternative(currentModel: string): string;
    getDailyBudget(): number;
    setDailyBudget(budget: number): void;
    getMetricsCount(): number;
    clearOlderThan(days: number): void;
    close(): void;
}
export declare function createMetricsCollector(dbPath?: string, options?: {
    dailyBudget?: number;
}): MetricsCollector;
//# sourceMappingURL=collector.d.ts.map