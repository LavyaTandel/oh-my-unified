import { Phase } from '../workflow';
import { log } from '../utils/logger';
const PHASE_LABELS = {
    [Phase.ASSESS]: 'assess',
    [Phase.ASSEMBLE]: 'assemble',
    [Phase.ACT]: 'act',
    [Phase.IMPROVISE]: 'improvise',
};
const DEFAULT_TEMPLATE = '[Current Phase: {phase}] Keep responses aligned with this workflow phase.';
/**
 * Creates a hook that appends the current workflow phase as a system
 * reminder after every user message. This helps the agent stay on
 * track within the Assess → Assemble → Act → Improvise lifecycle.
 *
 * The reminder is injected as a system-level hint so the model
 * maintains phase awareness throughout the conversation.
 */
export function createPhaseReminderHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        phase: Phase.ASSESS,
        template: DEFAULT_TEMPLATE,
        ...hookConfig,
    };
    /**
     * Returns the human-readable phase label.
     */
    function getPhaseLabel(p) {
        return PHASE_LABELS[p] ?? 'unknown';
    }
    /**
     * Builds the reminder text by substituting {phase} in the template.
     */
    function buildReminder() {
        return cfg.template.replace(/\{phase\}/g, getPhaseLabel(cfg.phase));
    }
    /**
     * Updates the current phase at runtime.
     */
    function setPhase(phase) {
        cfg.phase = phase;
        log(`[phase-reminder] phase changed to "${getPhaseLabel(phase)}"`);
    }
    /**
     * Hook that fires after a user message is received. Appends the
     * phase reminder to the message payload so the model sees it.
     */
    async function handleMessageBefore(input, _output) {
        if (!cfg.enabled)
            return;
        if (input.role !== 'user')
            return;
        const reminder = buildReminder();
        log('[phase-reminder] injecting phase reminder');
        input._phaseReminder = reminder;
    }
    return {
        setPhase,
        getPhaseLabel: () => getPhaseLabel(cfg.phase),
        'message.before': handleMessageBefore,
    };
}
//# sourceMappingURL=phase-reminder.js.map