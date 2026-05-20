import type { PluginInput } from '@opencode-ai/plugin';
type OpencodeClient = PluginInput['client'];
export declare function isRateLimitError(error: unknown): boolean;
/**
 * Configuration for runtime model fallback.
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
 * Manages runtime model fallback for foreground (interactive) agent sessions.
 *
 * When OpenCode fires a session.error, message.updated, or session.status
 * event containing a rate-limit signal, this manager:
 *   1. Looks up the next untried model in the agent's configured chain
 *   2. Aborts the rate-limited prompt via client.session.abort()
 *   3. Re-queues the last user message via client.session.promptAsync()
 *      with the new model — promptAsync returns immediately so we never
 *      block the event handler waiting for a full LLM response.
 */
export declare class RuntimeFallbackManager {
    private readonly client;
    /**
     * Ordered fallback chains per agent.
     * e.g. { orchestrator: ['anthropic/claude-opus-4-5', 'openai/gpt-4o'] }
     */
    private readonly chains;
    private readonly enabled;
    private readonly maxAttempts;
    /** sessionID → last observed model string ("providerID/modelID") */
    private readonly sessionModel;
    /** sessionID → agent name (populated from message.updated info.agent field) */
    private readonly sessionAgent;
    /** sessionID → set of models already attempted this session */
    private readonly sessionTried;
    /** Sessions with an active fallback switch in flight */
    private readonly inProgress;
    /** sessionID → timestamp of last trigger (for deduplication) */
    private readonly lastTrigger;
    /** Fallback logs for diagnostics */
    private readonly fallbackLogs;
    constructor(client: OpencodeClient, 
    /**
     * Ordered fallback chains per agent.
     * e.g. { orchestrator: ['anthropic/claude-opus-4-5', 'openai/gpt-4o'] }
     */
    chains: Record<string, string[]>, enabled: boolean, maxAttempts: number);
    /**
     * Process an OpenCode plugin event.
     * Call this from the plugin's `event` hook for every event received.
     */
    handleEvent(rawEvent: unknown): Promise<void>;
    private tryFallback;
    /**
     * Determine the fallback chain to use for a session.
     *
     * Priority:
     * 1. Agent name known AND has a configured chain → return it directly
     * 2. Agent name known but NO chain configured → return [] (no fallback)
     * 3. Agent name unknown, current model known → search all chains for
     *    the model to infer which chain to use
     * 4. Nothing matches → flatten all chains as a last resort
     */
    private resolveChain;
    /** Returns the raw fallback logs for diagnostic purposes. */
    getFallbackLogs(): {
        agent: string;
        from: string;
        to: string;
        timestamp: number;
        reason: string;
    }[];
}
/**
 * Creates a hook that intercepts model invocation failures and retries with
 * the next model in the fallback chain. Also provides an event handler for
 * reactive mid-conversation model switching on rate-limit errors.
 *
 * Returns both lifecycle hook handlers AND an event handler. The event handler
 * must be wired into the plugin's top-level event handler.
 */
export declare function createModelFallbackHook(ctx: PluginInput, _config: Record<string, unknown>, hookConfig?: ModelFallbackConfig): {
    /** Wire this into the plugin's event handler */
    handleEvent: (event: unknown) => Promise<void>;
    getFallbackLogs: () => {
        agent: string;
        from: string;
        to: string;
        timestamp: number;
        reason: string;
    }[];
};
export {};
//# sourceMappingURL=model-fallback.d.ts.map