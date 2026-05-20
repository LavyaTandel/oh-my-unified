import { log } from '../../utils/logger';
import { SecurityResearchManager } from './index';
const SECURITY_KEYWORDS = [
    'security research', 'security audit', 'vulnerability scan',
    'threat model', 'pen test', 'pentest', 'security review',
    'OWASP', 'STRIDE', 'attack surface', 'security assessment',
];
export function createSecurityResearchHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        ...hookConfig,
    };
    const manager = new SecurityResearchManager();
    function checkTrigger(input) {
        if (!cfg.enabled)
            return false;
        const lower = input.toLowerCase();
        return SECURITY_KEYWORDS.some((kw) => lower.includes(kw));
    }
    function activate(input, output) {
        const parts = output.parts;
        if (!parts)
            return;
        const userText = parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text ?? '')
            .join(' ');
        log('[security-research] trigger detected', { sessionID: input.sessionID });
        const report = manager.startResearch(input.sessionID, userText.slice(0, 500));
        const prompt = manager.getResearchPrompt(report);
        const systemMsg = {
            type: 'system',
            text: `Security research mode activated.\n\n${prompt}`,
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