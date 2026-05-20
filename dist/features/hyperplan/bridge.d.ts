import type { HyperplanState } from '../hyperplan';
import type { ReviewWorkState } from '../review-work';
export interface HyperplanReviewContext {
    topic: string;
    constraints: string[];
    changedFiles: string[];
    criticalFindings: string[];
    alternatives: string[];
    memberConsensus: string;
}
export declare class HyperplanToReviewBridge {
    convertFindings(state: HyperplanState): HyperplanReviewContext;
    shouldAutoTrigger(state: HyperplanState): boolean;
    buildReviewContext(state: HyperplanState): {
        goal: string;
        constraints: string[];
        changedFiles: string[];
    };
    toReviewWorkState(state: HyperplanState): Partial<ReviewWorkState>;
}
export declare function createHyperplanBridge(): HyperplanToReviewBridge;
//# sourceMappingURL=bridge.d.ts.map