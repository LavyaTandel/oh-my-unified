import { log } from '../../utils/logger';
const DEFAULT_MEMBERS = [
    { name: 'Skeptic', role: 'unspecified-low', perspective: 'Challenge every assumption. Find flaws, edge cases, and hidden risks.' },
    { name: 'Validator', role: 'unspecified-high', perspective: 'Verify feasibility. Check technical constraints, dependencies, and resource requirements.' },
    { name: 'Architect', role: 'ultrabrain', perspective: 'Evaluate system design. Assess scalability, maintainability, and architectural soundness.' },
    { name: 'Creative', role: 'artistry', perspective: 'Propose alternative approaches. Think outside the box for better solutions.' },
];
export class HyperplanManager {
    sessions = new Map();
    startPlan(sessionId, topic, members) {
        const state = {
            sessionId,
            topic,
            members: members ?? [...DEFAULT_MEMBERS],
            phase: 'brainstorm',
            startedAt: Date.now(),
            completed: false,
            distilledInsights: [],
        };
        this.sessions.set(sessionId, state);
        log('[hyperplan] started', { sessionId, topic: topic.slice(0, 100), memberCount: state.members.length });
        return state;
    }
    getChallengePrompt(member, state) {
        return `# Hyperplan — ${member.name} (${member.role})

Topic: ${state.topic}

Your role: ${member.perspective}

Analyze the topic from your unique perspective. Be adversarial — your job is to find what others miss.

OUTPUT FORMAT:
<verdict>PASS|FAIL</verdict>
<findings>
- [CRITICAL|MAJOR|MINOR] Finding description
</findings>
<alternatives>Alternative approaches worth considering</alternatives>`;
    }
    submitMemberResult(sessionId, memberName, verdict, findings) {
        const state = this.sessions.get(sessionId);
        if (!state)
            return;
        const member = state.members.find((m) => m.name === memberName);
        if (!member)
            return;
        member.verdict = verdict;
        member.findings = findings;
        if (state.members.every((m) => m.verdict)) {
            state.phase = 'distill';
            state.distilledInsights = this.distillInsights(state);
            log('[hyperplan] distilled', { sessionId, insightCount: state.distilledInsights.length });
        }
    }
    distillInsights(state) {
        const allFindings = state.members.flatMap((m) => m.findings ?? []);
        const critical = allFindings.filter((f) => f.toUpperCase().includes('CRITICAL'));
        const alternatives = state.members
            .filter((m) => m.name === 'Creative')
            .flatMap((m) => m.findings ?? []);
        const insights = [];
        if (critical.length > 0)
            insights.push(`Critical issues found: ${critical.length}`);
        if (alternatives.length > 0)
            insights.push(`Alternative approaches proposed: ${alternatives.length}`);
        const passed = state.members.filter((m) => m.verdict === 'PASS').length;
        const failed = state.members.filter((m) => m.verdict === 'FAIL').length;
        insights.push(`Member consensus: ${passed} passed, ${failed} failed`);
        return insights;
    }
    getReport(sessionId) {
        const state = this.sessions.get(sessionId);
        if (!state || state.phase !== 'distill')
            return null;
        const rows = state.members
            .map((m) => `| ${m.name} | ${m.role} | ${m.verdict ?? 'pending'} | ${(m.findings ?? []).length} findings |`)
            .join('\n');
        return `# Hyperplan Report — ${state.topic}

## Member Results
| Member | Role | Verdict | Findings |
|--------|------|---------|----------|
${rows}

## Distilled Insights
${state.distilledInsights.map((i) => `- ${i}`).join('\n')}

## Recommendation
${state.members.some((m) => m.verdict === 'FAIL') ? 'FAIL — critical issues must be addressed before proceeding' : 'PASS — proceed with planning'}

## Next Steps
Hand off to dedicated planner for formal work plan sequencing.`;
    }
    getState(sessionId) {
        return this.sessions.get(sessionId);
    }
    dispose() {
        this.sessions.clear();
    }
}
//# sourceMappingURL=index.js.map