import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { log } from '../../utils/logger';
import { HyperplanManager } from './index';

export interface HyperplanConfig {
  enabled?: boolean;
}

const HYPERPLAN_KEYWORDS = [
  'hyperplan', 'adversarial plan', 'adversarial planning',
  'challenge this plan', 'stress test', 'red team',
];

export function createHyperplanHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: HyperplanConfig,
) {
  const cfg: Required<HyperplanConfig> = {
    enabled: true,
    ...hookConfig,
  };

  const manager = new HyperplanManager();

  function checkTrigger(input: string): boolean {
    if (!cfg.enabled) return false;
    const lower = input.toLowerCase();
    return HYPERPLAN_KEYWORDS.some((kw) => lower.includes(kw));
  }

  function activate(
    input: { sessionID: string; agent?: string },
    output: { message: unknown; parts: unknown[] },
  ): void {
    const parts = output.parts as Array<{ type: string; text?: string }> | undefined;
    if (!parts) return;

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
      type: 'system' as const,
      text: `Hyperplan mode activated. Launch ${state.members.length} adversarial reviewers:\n\n${memberPrompts}`,
    };

    (output.parts as unknown[]).push(systemMsg);
  }

  return {
    manager,
    checkTrigger,
    activate,
  };
}
