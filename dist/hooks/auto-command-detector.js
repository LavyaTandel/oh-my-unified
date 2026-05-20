import { ALL_AGENT_NAMES, AGENT_ALIASES } from '../config/constants';
import { log } from '../utils/logger';
const DEFAULT_TRIGGER_KEYWORDS = [
    'plan',
    'audit',
    'review',
    'investigate',
    'explore',
    'search',
    'find',
    'debug',
    'fix',
    'refactor',
    'test',
    'check',
    'analyse',
    'analyze',
    'optimize',
    'optimise',
    'summarize',
    'summarise',
];
const PHASE_MAP = {
    assess: 'om-plan',
    assemble: 'om-plan',
    act: 'om-plan',
    improvise: 'om-plan',
    architecture: 'om-audit',
    quality: 'om-audit',
    security: 'om-audit',
    ux: 'om-audit',
    full: 'om-audit',
};
/**
 * Creates a hook that monitors user input for patterns that match
 * registered agent triggers or slash command keywords. When a match
 * is found above the confidence threshold, it auto-suggests the
 * relevant /command.
 *
 * This is ported from openagent's keyword-detector and auto-slash-command
 * systems, allowing frictionless discovery of available commands.
 */
export function createAutoCommandDetectorHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        triggerKeywords: [...DEFAULT_TRIGGER_KEYWORDS],
        confidenceThreshold: 0.6,
        commands: ['om-plan', 'om-audit'],
        ...hookConfig,
    };
    /** Agent names (including aliases) for @ mention detection */
    const agentNames = new Set([
        ...ALL_AGENT_NAMES.map((n) => n.toLowerCase()),
        ...Object.keys(AGENT_ALIASES).map((a) => a.toLowerCase()),
        ...Object.values(AGENT_ALIASES).map((a) => a.toLowerCase()),
    ]);
    /**
     * Tokenises user input into words (lowercased).
     */
    function tokenise(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s@/]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
    }
    /**
     * Detects @mentions of agent names in the input.
     */
    function detectAgentMentions(tokens) {
        return tokens
            .filter((t) => t.startsWith('@'))
            .map((t) => t.slice(1))
            .filter((name) => agentNames.has(name));
    }
    /**
     * Detects potential slash command triggers in the input.
     */
    function detectCommandTriggers(tokens, text) {
        const suggestions = [];
        // Check for phase-specific triggers
        for (const [keyword, command] of Object.entries(PHASE_MAP)) {
            if (tokens.includes(keyword) && text.toLowerCase().includes(keyword)) {
                suggestions.push({
                    command: `/${command}`,
                    arguments: keyword,
                    confidence: 0.8,
                    reason: `Detected phase keyword "${keyword}"`,
                });
            }
        }
        // Check for trigger keywords
        for (const keyword of cfg.triggerKeywords) {
            if (tokens.includes(keyword)) {
                // Map keywords to suggested commands
                let suggestedCommand = '';
                let args = '';
                let confidence = 0.65;
                if (keyword === 'plan') {
                    suggestedCommand = '/om-plan';
                    args = 'assess';
                    confidence = 0.75;
                }
                else if (['audit', 'review'].includes(keyword)) {
                    suggestedCommand = '/om-audit';
                    args = 'full';
                    confidence = 0.75;
                }
                else if (['investigate', 'debug', 'fix'].includes(keyword)) {
                    // These are general; lower confidence
                    suggestedCommand = '/om-plan';
                    args = 'improvise';
                    confidence = 0.5;
                }
                if (suggestedCommand && confidence >= cfg.confidenceThreshold) {
                    suggestions.push({
                        command: suggestedCommand,
                        arguments: args || keyword,
                        confidence,
                        reason: `Matched trigger keyword "${keyword}"`,
                    });
                }
            }
        }
        return suggestions;
    }
    /**
     * Main detection logic. Examines user input and returns command
     * suggestions.
     */
    function detect(input) {
        const tokens = tokenise(input);
        const suggestions = [];
        // Detect agent mentions
        const mentions = detectAgentMentions(tokens);
        for (const name of mentions) {
            const aliased = AGENT_ALIASES[name] ?? name;
            suggestions.push({
                command: `@${aliased}`,
                confidence: 0.9,
                reason: `Detected agent mention "@${name}"`,
            });
        }
        // Detect command triggers
        const commandTriggers = detectCommandTriggers(tokens, input);
        suggestions.push(...commandTriggers);
        // Deduplicate by command
        const seen = new Set();
        return suggestions.filter((s) => {
            const key = `${s.command}:${s.arguments ?? ''}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    /**
     * Hook that fires before a user message is processed. Scans the
     * content for agent mentions and command keywords, attaching any
     * suggestions to the message metadata.
     */
    async function handleMessageBefore(input, output) {
        if (!cfg.enabled)
            return;
        if (input.role !== 'user')
            return;
        if (!input.content)
            return;
        const suggestions = detect(input.content);
        if (suggestions.length > 0) {
            log(`[auto-command-detector] ${suggestions.length} suggestion(s) for input`);
            output.commandSuggestions = suggestions;
        }
    }
    return {
        detect,
        'message.before': handleMessageBefore,
    };
}
//# sourceMappingURL=auto-command-detector.js.map