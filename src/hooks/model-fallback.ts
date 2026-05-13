import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for model fallback behavior.
 */
export interface ModelFallbackConfig {
  /** Enable model fallback (default: true) */
  enabled?: boolean;
  /** Ordered fallback chains per agent name */
  chains?: Record<string, string[]>;
  /** Maximum fallback attempts before giving up (default: 3) */
  maxAttempts?: number;
}

/**
 * Creates a hook that intercepts model invocation failures and
 * retries with the next model in the fallback chain.
 *
 * Tracks which model is currently active per session/agent and
 * logs every fallback transition for observability.
 */
export function createModelFallbackHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: ModelFallbackConfig,
) {
  const cfg: Required<ModelFallbackConfig> = {
    enabled: true,
    chains: {},
    maxAttempts: 3,
    ...hookConfig,
  };

  const fallbackLogs: Array<{
    agent: string;
    from: string;
    to: string;
    timestamp: number;
    reason: string;
  }> = [];

  /** Per-agent-per-session current model index tracker */
  const modelIndex = new Map<string, number>();

  /**
   * Resolves the fallback chain for a given agent name.
   * Falls back to config chains if available.
   */
  function resolveChain(agent: string): string[] {
    return cfg.chains[agent] ?? [];
  }

  /**
   * Returns the next model in the fallback chain for the agent,
   * or null if the chain is exhausted.
   */
  function getNextModel(agent: string): string | null {
    const chain = resolveChain(agent);
    if (chain.length === 0) return null;

    const current = modelIndex.get(agent) ?? -1;
    const next = current + 1;

    if (next >= chain.length || next >= cfg.maxAttempts) {
      return null;
    }

    modelIndex.set(agent, next);
    return chain[next];
  }

  /**
   * Resets the fallback chain index for an agent (e.g. on success).
   */
  function resetChain(agent: string): void {
    modelIndex.delete(agent);
  }

  /**
   * Hook that fires before a tool call. Injects the current fallback
   * model id when a previous attempt has failed.
   */
  async function handleToolBefore(
    input: { tool: string; parameters?: Record<string, unknown>; agent?: string },
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    const agent = input.agent ?? 'default';
    const idx = modelIndex.get(agent);
    if (idx !== undefined && idx > 0) {
      const chain = resolveChain(agent);
      const fallbackModel = chain[idx];
      log(`[model-fallback] using fallback model "${fallbackModel}" for agent "${agent}" (attempt ${idx + 1})`);
      if (input.parameters) {
        input.parameters._fallbackModel = fallbackModel;
      }
    }
  }

  /**
   * Hook that fires after a tool call. Records fallback activity
   * when a model invocation has failed.
   */
  async function handleToolAfter(
    input: { tool: string; agent?: string; error?: string },
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    if (!input.error) {
      // Success — reset the chain for this agent
      if (input.agent) resetChain(input.agent);
      return;
    }

    const agent = input.agent ?? 'default';
    const chain = resolveChain(agent);
    const idx = modelIndex.get(agent) ?? -1;
    const failedModel = chain[idx] ?? 'unknown';

    const nextModel = getNextModel(agent);
    if (nextModel) {
      fallbackLogs.push({
        agent,
        from: failedModel,
        to: nextModel,
        timestamp: Date.now(),
        reason: input.error,
      });
      log(
        `[model-fallback] agent "${agent}" fell back from "${failedModel}" to "${nextModel}": ${input.error}`,
      );
    } else {
      log(
        `[model-fallback] agent "${agent}" exhausted fallback chain after "${failedModel}"`,
      );
    }
  }

  /**
   * Returns the raw fallback logs for diagnostic purposes.
   */
  function getFallbackLogs() {
    return [...fallbackLogs];
  }

  return {
    'tool.before': handleToolBefore,
    'tool.after': handleToolAfter,
    getFallbackLogs,
  };
}
