export interface BenchmarkResult {
    id?: number;
    model: string;
    taskCategory: string;
    sessionId: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    qualityScore: number;
    timestamp: number;
}
export interface RegressionAlert {
    model: string;
    taskCategory: string;
    metric: 'latency' | 'cost' | 'quality';
    previousValue: number;
    currentValue: number;
    changePercent: number;
    severity: 'low' | 'medium' | 'high';
    detectedAt: number;
}
export interface BenchmarkSummary {
    model: string;
    taskCategory: string;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    avgCost: number;
    avgQuality: number;
    totalRuns: number;
    lastRunAt: number;
}
export declare class BenchmarkTracker {
    private db;
    constructor(dbPath?: string);
    private migrate;
    record(result: Omit<BenchmarkResult, 'id'>): void;
    getSummary(model: string, taskCategory?: string): BenchmarkSummary | null;
    detectRegressions(model: string, taskCategory: string, threshold?: number): RegressionAlert[];
    getAllSummaries(): BenchmarkSummary[];
    clearOlderThan(days: number): void;
    close(): void;
}
export declare function createBenchmarkTracker(dbPath?: string): BenchmarkTracker;
//# sourceMappingURL=index.d.ts.map