import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { Phase } from '../workflow';
/**
 * Configuration for the phase reminder hook.
 */
export interface PhaseReminderConfig {
    /** Enable phase reminders (default: true) */
    enabled?: boolean;
    /** Override the current phase label — auto-detected from workflow if unset */
    phase?: Phase;
    /** Custom reminder text template. {phase} is replaced with the phase name. */
    template?: string;
}
/**
 * Creates a hook that appends the current workflow phase as a system
 * reminder after every user message. This helps the agent stay on
 * track within the Assess → Assemble → Act → Improvise lifecycle.
 *
 * The reminder is injected as a system-level hint so the model
 * maintains phase awareness throughout the conversation.
 */
export declare function createPhaseReminderHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: PhaseReminderConfig): {
    setPhase: (phase: Phase) => void;
    getPhaseLabel: () => string;
    'message.before': (input: {
        content?: string;
        role?: string;
    }, _output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=phase-reminder.d.ts.map