import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { log } from '../../utils/logger';
import { SecurityResearchManager } from './index';

export interface SecurityResearchConfig {
  enabled?: boolean;
}

const SECURITY_KEYWORDS = [
  'security research', 'security audit', 'vulnerability scan',
  'threat model', 'pen test', 'pentest', 'security review',
  'OWASP', 'STRIDE', 'attack surface', 'security assessment',
];

export function createSecurityResearchHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: SecurityResearchConfig,
) {
  const cfg: Required<SecurityResearchConfig> = {
    enabled: true,
    ...hookConfig,
  };

  const manager = new SecurityResearchManager();

  function checkTrigger(input: string): boolean {
    if (!cfg.enabled) return false;
    const lower = input.toLowerCase();
    return SECURITY_KEYWORDS.some((kw) => lower.includes(kw));
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

    log('[security-research] trigger detected', { sessionID: input.sessionID });

    const report = manager.startResearch(input.sessionID, userText.slice(0, 500));
    const prompt = manager.getResearchPrompt(report);

    const systemMsg = {
      type: 'system' as const,
      text: `Security research mode activated.\n\n${prompt}`,
    };

    (output.parts as unknown[]).push(systemMsg);
  }

  return {
    manager,
    checkTrigger,
    activate,
  };
}
