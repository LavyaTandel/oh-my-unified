export type CheckStatus = 'pass' | 'warn' | 'fail';
export interface DiagnosticCheck {
    name: string;
    category: string;
    status: CheckStatus;
    message: string;
    details?: string;
    durationMs: number;
}
export interface DiagnosticReport {
    checks: DiagnosticCheck[];
    passed: number;
    warnings: number;
    failed: number;
    total: number;
    overall: 'healthy' | 'degraded' | 'critical';
    timestamp: number;
}
export interface DiagnosticContext {
    agentCount?: number;
    toolCount?: number;
    mcpCount?: number;
    tuiRunning?: boolean;
    interviewRunning?: boolean;
    dbPath?: string;
    pluginCount?: number;
    integrationCount?: number;
    circuitBreakerHealth?: Array<{
        name: string;
        state: string;
    }>;
}
export declare class DiagnosticsChecker {
    private ctx;
    constructor(ctx?: DiagnosticContext);
    runAll(): Promise<DiagnosticReport>;
    private checkMCPs;
    private checkAgents;
    private checkModels;
    private checkSQLite;
    private checkTUI;
    private checkInterviewEngine;
    private checkFileSystem;
    private checkNetwork;
    private checkCircuitBreakers;
    private checkPluginRegistry;
    private checkIntegrationHub;
    private checkLearningEngine;
    formatReport(report: DiagnosticReport): string;
}
export declare function createDiagnosticsChecker(ctx?: DiagnosticContext): DiagnosticsChecker;
//# sourceMappingURL=index.d.ts.map