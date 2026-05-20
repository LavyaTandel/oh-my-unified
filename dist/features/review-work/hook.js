import { log } from '../../utils/logger';
import { ReviewWorkManager } from './index';
const REVIEW_KEYWORDS = [
    'review work', 'review my work', 'review changes',
    'qa my work', 'verify implementation', 'check my work',
    'validate changes', 'post-implementation review',
    'review this', 'code review', 'quality check',
];
const REVIEW_AGENTS = [
    { name: 'Goal Verifier', focus: 'Did we build what was asked?' },
    { name: 'QA Executor', focus: 'Does it actually work?' },
    { name: 'Code Reviewer', focus: 'Is the code well-written?' },
    { name: 'Security Auditor', focus: 'Is it secure?' },
    { name: 'Context Miner', focus: 'Did we miss any context?' },
];
export function createReviewWorkHook(_ctx, _config, hookConfig, opts) {
    const cfg = {
        enabled: true,
        ...hookConfig,
    };
    const manager = new ReviewWorkManager();
    const tlog = opts?.transparencyLog;
    function checkTrigger(input) {
        if (!cfg.enabled)
            return false;
        const lower = input.toLowerCase();
        return REVIEW_KEYWORDS.some((kw) => lower.includes(kw));
    }
    function activate(input, output) {
        const parts = output.parts;
        if (!parts)
            return;
        const userText = parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text ?? '')
            .join(' ');
        log('[review-work] trigger detected', { sessionID: input.sessionID });
        const state = manager.startReview(input.sessionID, userText.slice(0, 500), [], []);
        const prompt = REVIEW_AGENTS.map((agent, i) => `### Agent ${i + 1}: ${agent.name}\n${agent.focus}\n\n${manager.getReviewPrompt(i, state)}`).join('\n\n---\n\n');
        const systemMsg = {
            type: 'system',
            text: `Review Work mode activated (Confidence: 85%). Launch these 5 agents in parallel:\n\n${prompt}`,
        };
        output.parts.push(systemMsg);
        // Transparency: log review verdict
        if (tlog) {
            tlog.record({
                type: 'review_verdict',
                sessionId: input.sessionID,
                message: `Review work activated: ${userText.slice(0, 100)}`,
                details: { agentCount: REVIEW_AGENTS.length, confidence: 0.85 },
                confidence: 0.85,
            });
        }
    }
    return {
        manager,
        checkTrigger,
        activate,
    };
}
//# sourceMappingURL=hook.js.map