import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import type { TransparencyLog } from '../transparency-log';
export type PlanPhase = 'assess' | 'assemble' | 'act' | 'improvise';
export type PlanStatus = 'active' | 'completed' | 'cancelled';
export interface PlanState {
    id: string;
    sessionId: string;
    topic: string;
    phase: PlanPhase;
    status: PlanStatus;
    findings: Record<PlanPhase, string[]>;
    decisions: string[];
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
}
export declare class PlanOrchestrator {
    private plans;
    startPlan(sessionId: string, topic: string): PlanState;
    advancePhase(planId: string): PlanState | null;
    addFinding(planId: string, phase: PlanPhase, finding: string): void;
    addDecision(planId: string, decision: string): void;
    getPhasePrompt(phase: PlanPhase): string;
    getModelForPhase(phase: PlanPhase): string;
    getPlan(planId: string): PlanState | undefined;
    getActivePlan(sessionId: string): PlanState | undefined;
    listPlans(): PlanState[];
    getStatusText(plan: PlanState): string;
    getReport(planId: string): string | null;
    dispose(): void;
}
export declare function createOmPlanHook(_ctx: PluginInput, _config: PluginConfig, opts?: {
    transparencyLog?: TransparencyLog;
}): {
    orchestrator: PlanOrchestrator;
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