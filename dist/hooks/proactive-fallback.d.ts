import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
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
/**
 * Proactive model fallback — intercepts chat.params to override the model
 * when error rates exceed the configured threshold.
 *
 * Works alongside RuntimeFallbackManager (reactive) to form a dual-fallback system.
 */
export declare function createProactiveFallbackHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: ProactiveFallbackConfig): {
    /** Wire this into the plugin's chat.params handler */
    'chat.params': (input: {
        sessionID: string;
        agent: string;
        model: {
            id: string;
        };
    }, output: {
        temperature: number;
        topP: number;
        topK: number;
        maxOutputTokens: number | undefined;
        options: Record<string, unknown>;
    }) => Promise<void>;
    /** Record errors from session events */
    recordError: (modelKey: string) => void;
    /** Record successes from session events */
    recordSuccess: (modelKey: string) => void;
    /** Get fallback logs for diagnostics */
    getFallbackLogs: () => {
        from: string;
        to: string;
        errorRate: number;
        timestamp: number;
    }[];
    /** Get current error rates for all tracked models */
    getErrorRates: () => Record<string, {
        rate: number;
        samples: number;
    }>;
};
//# sourceMappingURL=proactive-fallback.d.ts.map