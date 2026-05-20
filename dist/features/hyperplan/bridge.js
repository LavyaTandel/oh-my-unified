export class HyperplanToReviewBridge {
    convertFindings(state) {
        const allFindings = state.members.flatMap((m) => m.findings ?? []);
        const critical = allFindings.filter((f) => f.toUpperCase().includes('CRITICAL'));
        const alternatives = state.members
            .filter((m) => m.name === 'Creative')
            .flatMap((m) => m.findings ?? []);
        const passed = state.members.filter((m) => m.verdict === 'PASS').length;
        const failed = state.members.filter((m) => m.verdict === 'FAIL').length;
        return {
            topic: state.topic,
            constraints: [],
            changedFiles: [],
            criticalFindings: critical,
            alternatives,
            memberConsensus: `${passed} passed, ${failed} failed`,
        };
    }
    shouldAutoTrigger(state) {
        return state.members.some((m) => m.verdict === 'FAIL');
    }
    buildReviewContext(state) {
        const context = this.convertFindings(state);
        const goal = `Review implementation of: ${state.topic}. Hyperplan found ${context.criticalFindings.length} critical issues.`;
        const constraints = [
            ...context.criticalFindings.map((f) => `Must address: ${f}`),
            ...context.alternatives.slice(0, 3).map((a) => `Consider alternative: ${a}`),
            `Member consensus: ${context.memberConsensus}`,
        ];
        return { goal, constraints, changedFiles: context.changedFiles };
    }
    toReviewWorkState(state) {
        const context = this.buildReviewContext(state);
        return {
            sessionId: state.sessionId,
            goal: context.goal,
            constraints: context.constraints,
            changedFiles: context.changedFiles,
        };
    }
}
export function createHyperplanBridge() {
    return new HyperplanToReviewBridge();
}
//# sourceMappingURL=bridge.js.map