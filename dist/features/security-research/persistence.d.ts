import type { SecurityFinding, SecurityReport } from './index';
export interface SecurityFindingRecord extends SecurityFinding {
    id: number;
    reportId: string;
    filePath?: string;
    createdAt: number;
    remediationStatus: 'open' | 'fixed' | 'accepted-risk';
}
export interface SecurityReportRecord {
    id: string;
    sessionId: string;
    topic: string;
    overallRisk: string;
    completed: boolean;
    startedAt: number;
    completedAt?: number;
    findingCount: number;
    createdAt: number;
}
export declare class SecurityResearchStore {
    private db;
    constructor(dbPath: string);
    private migrate;
    saveReport(report: SecurityReport): void;
    saveFinding(finding: SecurityFinding, reportId: string, filePath?: string): void;
    getReport(sessionId: string): SecurityReportRecord | null;
    listReports(limit?: number): SecurityReportRecord[];
    getFindingsBySeverity(severity: string): SecurityFindingRecord[];
    getFindingsByFile(filePath: string): SecurityFindingRecord[];
    getStats(): {
        totalFindings: number;
        bySeverity: Record<string, number>;
        totalReports: number;
        openFindings: number;
    };
    close(): void;
}
//# sourceMappingURL=persistence.d.ts.map