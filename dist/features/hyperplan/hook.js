import { log } from '../../utils/logger';
import { HyperplanManager } from './index';
const HYPERPLAN_KEYWORDS = [
    'hyperplan', 'adversarial plan', 'adversarial planning',
    'challenge this plan', 'stress test', 'red team',
];
export function createHyperplanHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        ...hookConfig,
    };
    const manager = new HyperplanManager();
    function checkTrigger(input) {
        if (!cfg.enabled)
            return false;
        const lower = input.toLowerCase();
        return HYPERPLAN_KEYWORDS.some((kw) => lower.includes(kw));
    }
    function activate(input, output) {
        const parts = output.parts;
        if (!parts)
            return;
        const userText = parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text ?? '')
            .join(' ');
        log('[hyperplan] trigger detected', { sessionID: input.sessionID });
        const state = manager.startPlan(input.sessionID, userText.slice(0, 500));
        const memberPrompts = state.members
            .map((m) => manager.getChallengePrompt(m, state))
            .join('\n\n---\n\n');
        const systemMsg = {
            type: 'system',
            text: `Hyperplan mode activated. Launch ${state.members.length} adversarial reviewers:\n\n${memberPrompts}`,
        };
        output.parts.push(systemMsg);
    }
    return {
        manager,
        checkTrigger,
        activate,
    };
}
//# sourceMappingURL=hook.js.map