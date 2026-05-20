export interface SecurityFinding {
    category: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    remediation: string;
    cwe?: string;
}
export interface SecurityReport {
    sessionId: string;
    topic: string;
    findings: SecurityFinding[];
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    completed: boolean;
    startedAt: number;
}
export declare class SecurityResearchManager {
    private reports;
    startResearch(sessionId: string, topic: string): SecurityReport;
    getResearchPrompt(report: SecurityReport): string;
    addFinding(sessionId: string, finding: SecurityFinding): void;
    completeResearch(sessionId: string): SecurityReport | null;
    calculateOverallRisk(findings: SecurityFinding[]): SecurityReport['overallRisk'];
    getReport(sessionId: string): string | null;
    getState(sessionId: string): SecurityReport | undefined;
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map