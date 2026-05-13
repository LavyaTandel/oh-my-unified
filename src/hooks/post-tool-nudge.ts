import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for post-tool nudges.
 */
export interface PostToolNudgeConfig {
  /** Enable post-tool nudges (default: true) */
  enabled?: boolean;
  /** Tool names that trigger a nudge on success */
  watchedTools?: string[];
  /** Message template for the nudge */
  message?: string;
  /** Skip nudge if the tool had an error (default: false) */
  skipOnError?: boolean;
}

const DEFAULT_WATCHED_TOOLS = [
  'edit',
  'write',
  'Write',
  'Edit',
  'file_write',
  'file_edit',
  'apply_diff',
  'replace',
  'overwrite',
  'create',
];

const DEFAULT_MESSAGE =
  'Change applied. Consider running `bun run typecheck` and `bun test` ' +
  '(or your project\'s equivalent) to verify the change didn\'t break anything.';

/**
 * Creates a hook that nudges the agent (or user) to run typecheck and
 * test commands after file write/edit operations succeed.
 *
 * This reduces the feedback loop by proactively suggesting verification
 * steps instead of waiting for a build failure later.
 */
export function createPostToolNudgeHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: PostToolNudgeConfig,
) {
  const cfg: Required<PostToolNudgeConfig> = {
    enabled: true,
    watchedTools: [...DEFAULT_WATCHED_TOOLS],
    message: DEFAULT_MESSAGE,
    skipOnError: false,
    ...hookConfig,
  };

  const watched = new Set(cfg.watchedTools);

  /**
   * Hook that fires after a tool call. If the tool was a file
   * mutation (edit/write/replace etc.) and succeeded, attaches a
   * verification nudge to the output.
   */
  async function handleToolAfter(
    input: { tool: string; error?: string },
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    if (!watched.has(input.tool)) return;

    if (cfg.skipOnError && input.error) return;

    log(`[post-tool-nudge] "${input.tool}" completed — adding verification nudge`);
    (output as Record<string, unknown>).postToolNudge = cfg.message;
  }

  return {
    'tool.after': handleToolAfter,
  };
}
