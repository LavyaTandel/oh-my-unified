export interface HyperplanMember {
    name: string;
    role: string;
    perspective: string;
    verdict?: 'PASS' | 'FAIL';
    findings?: string[];
}
export interface HyperplanState {
    sessionId: string;
    topic: string;
    members: HyperplanMember[];
    phase: 'brainstorm' | 'challenge' | 'distill' | 'plan';
    startedAt: number;
    completed: boolean;
    distilledInsights: string[];
}
export declare class HyperplanManager {
    private sessions;
    startPlan(sessionId: string, topic: string, members?: HyperplanMember[]): HyperplanState;
    getChallengePrompt(member: HyperplanMember, state: HyperplanState): string;
    submitMemberResult(sessionId: string, memberName: string, verdict: 'PASS' | 'FAIL', findings: string[]): void;
    distillInsights(state: HyperplanState): string[];
    getReport(sessionId: string): string | null;
    getState(sessionId: string): HyperplanState | undefined;
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map