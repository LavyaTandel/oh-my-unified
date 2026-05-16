import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for proactive model fallback (chat.params interception).
 *
 * This is the PROACTIVE half of the dual-fallback system:
 * - Proactive (this module): intercepts chat.params BEFORE the LLM call,
 *   overrides the model when error rates are high.
 * - Reactive (RuntimeFallbackManager): responds to session.error events
 *   AFTER a failure, aborts and re-prompts with a fallback model.
 *
 * Together they form a complete fallback system: proactive prevents known-bad
 * models from being selected; reactive recovers from unexpected failures.
 */
export interface ProactiveFallbackConfig {
  /** Enable proactive fallback (default: true) */
  enabled?: boolean;
  /** Error rate threshold (0-1) to trigger fallback (default: 0.3) */
  errorThreshold?: number;
  /** Window size for error rate calculation in seconds (default: 300) */
  windowSeconds?: number;
  /** Minimum samples before fallback activates (default: 3) */
  minSamples?: number;
  /** Cooldown after a fallback switch in seconds (default: 60) */
  cooldownSeconds?: number;
  /** Fallback chains per model: "provider/model" → ["provider/model2", ...] */
  chains?: Record<string, string[]>;
}

interface ModelStats {
  totalCalls: number;
  errorCount: number;
  lastErrorTime: number;
  errorTimestamps: number[];
}

/**
 * Proactive model fallback — intercepts chat.params to override the model
 * when error rates exceed the configured threshold.
 *
 * Works alongside RuntimeFallbackManager (reactive) to form a dual-fallback system.
 */
export function createProactiveFallbackHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: ProactiveFallbackConfig,
) {
  const cfg: Required<ProactiveFallbackConfig> = {
    enabled: true,
    errorThreshold: 0.3,
    windowSeconds: 300,
    minSamples: 3,
    cooldownSeconds: 60,
    chains: {},
    ...hookConfig,
  };

  const modelStats = new Map<string, ModelStats>();
  const lastFallbackTime = new Map<string, number>();
  const fallbackLogs: Array<{
    from: string;
    to: string;
    errorRate: number;
    timestamp: number;
  }> = [];

  /** Record a successful call for a model */
  function recordSuccess(modelKey: string): void {
    const stats = modelStats.get(modelKey) ?? {
      totalCalls: 0,
      errorCount: 0,
      lastErrorTime: 0,
      errorTimestamps: [],
    };
    stats.totalCalls++;
    modelStats.set(modelKey, stats);
  }

  /** Record a failed call for a model */
  function recordError(modelKey: string): void {
    const stats = modelStats.get(modelKey) ?? {
      totalCalls: 0,
      errorCount: 0,
      lastErrorTime: 0,
      errorTimestamps: [],
    };
    stats.totalCalls++;
    stats.errorCount++;
    stats.lastErrorTime = Date.now();
    stats.errorTimestamps.push(Date.now());
    // Prune old timestamps
    const cutoff = Date.now() - cfg.windowSeconds * 1000;
    stats.errorTimestamps = stats.errorTimestamps.filter((t) => t > cutoff);
    modelStats.set(modelKey, stats);
  }

  /** Calculate error rate for a model within the window */
  function getErrorRate(modelKey: string): { rate: number; samples: number } {
    const stats = modelStats.get(modelKey);
    if (!stats || stats.totalCalls === 0) return { rate: 0, samples: 0 };

    const cutoff = Date.now() - cfg.windowSeconds * 1000;
    const recentErrors = stats.errorTimestamps.filter((t) => t > cutoff).length;
    const recentTotal = Math.max(stats.totalCalls, 1);

    return {
      rate: recentErrors / recentTotal,
      samples: stats.totalCalls,
    };
  }

  /** Find the next fallback model for a given model key */
  function getNextModel(modelKey: string): string | null {
    const chain = cfg.chains[modelKey];
    if (!chain || chain.length === 0) return null;
    // Pick the first model in the chain that isn't the current one
    return chain.find((m) => m !== modelKey) ?? null;
  }

  return {
    /** Wire this into the plugin's chat.params handler */
    'chat.params': async (
      input: {
        sessionID: string;
        agent: string;
        model: { id: string };
      },
      output: {
        temperature: number;
        topP: number;
        topK: number;
        maxOutputTokens: number | undefined;
        options: Record<string, unknown>;
      },
    ): Promise<void> => {
      if (!cfg.enabled) return;

      const modelKey = input.model.id;
      const { rate, samples } = getErrorRate(modelKey);

      // Check if we should fallback
      if (samples >= cfg.minSamples && rate >= cfg.errorThreshold) {
        const lastFallback = lastFallbackTime.get(modelKey) ?? 0;
        const now = Date.now();
        if (now - lastFallback < cfg.cooldownSeconds * 1000) {
          return; // Still in cooldown
        }

        const nextModel = getNextModel(modelKey);
        if (!nextModel) return;

        // Parse the fallback model
        const slash = nextModel.indexOf('/');
        if (slash <= 0) return;

        const providerID = nextModel.slice(0, slash);
        const modelID = nextModel.slice(slash + 1);

        // Override the model in the options
        output.options.fallbackModel = nextModel;
        output.options._originalModel = modelKey;

        lastFallbackTime.set(modelKey, now);

        fallbackLogs.push({
          from: modelKey,
          to: nextModel,
          errorRate: rate,
          timestamp: now,
        });

        log('[proactive-fallback] overriding model due to high error rate', {
          sessionID: input.sessionID,
          agent: input.agent,
          from: modelKey,
          to: nextModel,
          errorRate: rate.toFixed(2),
          samples,
        });
      }
    },

    /** Record errors from session events */
    recordError: (modelKey: string) => recordError(modelKey),

    /** Record successes from session events */
    recordSuccess: (modelKey: string) => recordSuccess(modelKey),

    /** Get fallback logs for diagnostics */
    getFallbackLogs: () => [...fallbackLogs],

    /** Get current error rates for all tracked models */
    getErrorRates: () => {
      const rates: Record<string, { rate: number; samples: number }> = {};
      for (const [key] of modelStats) {
        rates[key] = getErrorRate(key);
      }
      return rates;
    },
  };
}
