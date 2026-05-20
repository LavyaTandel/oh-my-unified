export type LogEntryType = 'model_routing' | 'agent_selection' | 'circuit_breaker' | 'feature_trigger' | 'error' | 'warning' | 'decision' | 'plan_phase' | 'audit_result' | 'review_verdict' | 'security_finding' | 'learning_applied' | 'prediction_made' | 'benchmark_recorded';
export interface LogEntry {
    id: number;
    timestamp: number;
    type: LogEntryType;
    sessionId: string;
    message: string;
    details?: Record<string, unknown>;
    confidence?: number;
}
export interface LogQuery {
    type?: LogEntryType;
    sessionId?: string;
    since?: number;
    limit?: number;
}
export declare class TransparencyLog {
    private entries;
    private nextId;
    private maxEntries;
    record(entry: Omit<LogEntry, 'id' | 'timestamp'> & {
        timestamp?: number;
    }): void;
    query(query?: LogQuery): LogEntry[];
    getRecent(limit?: number): LogEntry[];
    getBySession(sessionId: string): LogEntry[];
    getByType(type: LogEntryType): LogEntry[];
    getStats(): {
        totalEntries: number;
        byType: Record<string, number>;
        bySession: Record<string, number>;
        oldestEntry: number;
        newestEntry: number;
    };
    formatLog(entries: LogEntry[]): string;
    clear(): void;
}
export declare function createTransparencyLog(): TransparencyLog;
//# sourceMappingURL=index.d.ts.map