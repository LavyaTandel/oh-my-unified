import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import type { TransparencyLog } from '../transparency-log';
export type AuditType = 'architecture' | 'quality' | 'security' | 'ux' | 'full';
export type AuditStatus = 'active' | 'completed' | 'cancelled';
export interface AuditFinding {
    category: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    description: string;
    remediation: string;
    file?: string;
    line?: number;
}
export interface AuditReport {
    id: string;
    sessionId: string;
    target: string;
    type: AuditType;
    findings: AuditFinding[];
    scores: Record<string, number>;
    overallScore: number;
    grade: string;
    status: AuditStatus;
    startedAt: number;
    completedAt?: number;
}
export declare class AuditOrchestrator {
    private audits;
    startAudit(sessionId: string, target: string, type: AuditType): AuditReport;
    getAuditPrompt(type: AuditType): string;
    addFindings(reportId: string, findings: AuditFinding[]): void;
    completeAudit(reportId: string): AuditReport | null;
    private recalculateScores;
    getReport(reportId: string): string | null;
    getActiveAudit(sessionId: string): AuditReport | undefined;
    listAudits(): AuditReport[];
    dispose(): void;
}
export declare function createOmAuditHook(_ctx: PluginInput, _config: PluginConfig, opts?: {
    transparencyLog?: TransparencyLog;
}): {
    orchestrator: AuditOrchestrator;
    handleCommandExecuteBefore: (input: {
        command: string;
        sessionID: string;
        arguments: string;
    }, output: {
        parts: Array<{
            type: string;
            text?: string;
        }>;
    }) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map