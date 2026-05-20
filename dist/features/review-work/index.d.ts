export interface ReviewAgentResult {
    agentName: string;
    focus: string;
    verdict: 'PASS' | 'FAIL';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    summary: string;
    blockingIssues: string[];
}
export interface ReviewWorkState {
    sessionId: string;
    goal: string;
    constraints: string[];
    changedFiles: string[];
    agents: ReviewAgentResult[];
    startedAt: number;
    completed: boolean;
}
export declare class ReviewWorkManager {
    private sessions;
    startReview(sessionId: string, goal: string, constraints: string[], changedFiles: string[]): ReviewWorkState;
    getReviewPrompt(agentIndex: number, state: ReviewWorkState): string;
    submitResult(sessionId: string, result: ReviewAgentResult): void;
    getReport(sessionId: string): string | null;
    getState(sessionId: string): ReviewWorkState | undefined;
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map