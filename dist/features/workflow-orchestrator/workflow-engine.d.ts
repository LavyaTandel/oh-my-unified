import type { WorkflowPhase, ConfidenceLevel } from './types';
export declare function getNextPhase(current: WorkflowPhase, confidence: number): WorkflowPhase | null;
export declare class WorkflowEngine {
    private state;
    getPhase(): WorkflowPhase;
    getConfidence(): number;
    transitionTo(phase: WorkflowPhase): {
        allowed: boolean;
        reason: string;
    };
    updateConfidence(area: string, level: ConfidenceLevel): void;
    getThresholdFor(phase: WorkflowPhase): number;
    private recalculateOverall;
}
//# sourceMappingURL=workflow-engine.d.ts.map