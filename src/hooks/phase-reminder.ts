import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { Phase } from '../workflow';
import { log } from '../utils/logger';

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

const PHASE_LABELS: Record<Phase, string> = {
  [Phase.ASSESS]: 'assess',
  [Phase.ASSEMBLE]: 'assemble',
  [Phase.ACT]: 'act',
  [Phase.IMPROVISE]: 'improvise',
};

const DEFAULT_TEMPLATE =
  '[Current Phase: {phase}] Keep responses aligned with this workflow phase.';

/**
 * Creates a hook that appends the current workflow phase as a system
 * reminder after every user message. This helps the agent stay on
 * track within the Assess → Assemble → Act → Improvise lifecycle.
 *
 * The reminder is injected as a system-level hint so the model
 * maintains phase awareness throughout the conversation.
 */
export function createPhaseReminderHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: PhaseReminderConfig,
) {
  const cfg: Required<PhaseReminderConfig> = {
    enabled: true,
    phase: Phase.ASSESS,
    template: DEFAULT_TEMPLATE,
    ...hookConfig,
  };

  /**
   * Returns the human-readable phase label.
   */
  function getPhaseLabel(p: Phase): string {
    return PHASE_LABELS[p] ?? 'unknown';
  }

  /**
   * Builds the reminder text by substituting {phase} in the template.
   */
  function buildReminder(): string {
    return cfg.template.replace(/\{phase\}/g, getPhaseLabel(cfg.phase));
  }

  /**
   * Updates the current phase at runtime.
   */
  function setPhase(phase: Phase): void {
    cfg.phase = phase;
    log(`[phase-reminder] phase changed to "${getPhaseLabel(phase)}"`);
  }

  /**
   * Hook that fires after a user message is received. Appends the
   * phase reminder to the message payload so the model sees it.
   */
  async function handleMessageBefore(
    input: { content?: string; role?: string },
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    if (input.role !== 'user') return;

    const reminder = buildReminder();
    log('[phase-reminder] injecting phase reminder');
    (input as Record<string, unknown>)._phaseReminder = reminder;
  }

  return {
    setPhase,
    getPhaseLabel: () => getPhaseLabel(cfg.phase),
    'oh-my-unified.message.before': handleMessageBefore,
  };
}
