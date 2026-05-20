import { log } from '../utils/logger';
import { abortSessionWithTimeout } from '../utils/session';
// ---------------------------------------------------------------------------
// Rate-limit detection
// ---------------------------------------------------------------------------
const RATE_LIMIT_PATTERNS = [
    /\b429\b/,
    /rate.?limit/i,
    /too many requests/i,
    /quota.?exceeded/i,
    /usage.?exceeded/i,
    /ExceededBudget/i,
    /over.?budget/i,
    /usage limit/i,
    /overloaded/i,
    /resource.?exhausted/i,
    /insufficient.?quota/i,
    /high concurrency/i,
    /reduce concurrency/i,
];
export function isRateLimitError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const err = error;
    const text = [
        err.message ?? '',
        String(err.data?.statusCode ?? ''),
        err.data?.message ?? '',
        err.data?.responseBody ?? '',
    ].join(' ');
    return RATE_LIMIT_PATTERNS.some((p) => p.test(text));
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseModel(model) {
    const slash = model.indexOf('/');
    if (slash <= 0 || slash >= model.length - 1)
        return null;
    return { providerID: model.slice(0, slash), modelID: model.slice(slash + 1) };
}
/** Prevent re-triggering within this window for the same session. */
const DEDUP_WINDOW_MS = 5_000;
const REPROMPT_DELAY_MS = 500;
// ---------------------------------------------------------------------------
// RuntimeFallbackManager
// ---------------------------------------------------------------------------
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
export class RuntimeFallbackManager {
    client;
    chains;
    enabled;
    maxAttempts;
    /** sessionID → last observed model string ("providerID/modelID") */
    sessionModel = new Map();
    /** sessionID → agent name (populated from message.updated info.agent field) */
    sessionAgent = new Map();
    /** sessionID → set of models already attempted this session */
    sessionTried = new Map();
    /** Sessions with an active fallback switch in flight */
    inProgress = new Set();
    /** sessionID → timestamp of last trigger (for deduplication) */
    lastTrigger = new Map();
    /** Fallback logs for diagnostics */
    fallbackLogs = [];
    constructor(client, 
    /**
     * Ordered fallback chains per agent.
     * e.g. { orchestrator: ['anthropic/claude-opus-4-5', 'openai/gpt-4o'] }
     */
    chains, enabled, maxAttempts) {
        this.client = client;
        this.chains = chains;
        this.enabled = enabled;
        this.maxAttempts = maxAttempts;
    }
    /**
     * Process an OpenCode plugin event.
     * Call this from the plugin's `event` hook for every event received.
     */
    async handleEvent(rawEvent) {
        if (!this.enabled)
            return;
        const event = rawEvent;
        if (!event?.type)
            return;
        switch (event.type) {
            case 'message.updated': {
                const info = event.properties?.info;
                if (!info)
                    break;
                const sessionID = info.sessionID;
                if (!sessionID)
                    break;
                // Capture agent name when available
                if (typeof info.agent === 'string') {
                    this.sessionAgent.set(sessionID, info.agent);
                }
                // Track the model currently serving this session
                if (typeof info.providerID === 'string' &&
                    typeof info.modelID === 'string') {
                    this.sessionModel.set(sessionID, `${info.providerID}/${info.modelID}`);
                }
                // Rate-limit on an individual message
                if (info.error && isRateLimitError(info.error)) {
                    await this.tryFallback(sessionID);
                }
                break;
            }
            case 'session.error': {
                const props = event.properties;
                if (props?.sessionID && props.error && isRateLimitError(props.error)) {
                    await this.tryFallback(props.sessionID);
                }
                break;
            }
            case 'session.status': {
                const props = event.properties;
                if (!props?.sessionID || props.status?.type !== 'retry')
                    break;
                const msg = props.status.message?.toLowerCase() ?? '';
                if (msg.includes('rate limit') ||
                    msg.includes('usage limit') ||
                    msg.includes('usage exceeded') ||
                    msg.includes('quota exceeded') ||
                    msg.includes('exceededbudget') ||
                    msg.includes('over budget') ||
                    msg.includes('high concurrency') ||
                    msg.includes('reduce concurrency')) {
                    await this.tryFallback(props.sessionID);
                }
                break;
            }
            case 'subagent.session.created': {
                const props = event.properties;
                if (props?.sessionID && typeof props.agentName === 'string') {
                    this.sessionAgent.set(props.sessionID, props.agentName);
                }
                break;
            }
            case 'session.deleted': {
                // Clean up all per-session state to prevent unbounded memory growth
                const props = event.properties;
                const id = props?.info?.id ?? props?.sessionID;
                if (id) {
                    this.sessionModel.delete(id);
                    this.sessionAgent.delete(id);
                    this.sessionTried.delete(id);
                    this.inProgress.delete(id);
                    this.lastTrigger.delete(id);
                }
                break;
            }
        }
    }
    // ---------------------------------------------------------------------------
    // Core fallback logic
    // ---------------------------------------------------------------------------
    async tryFallback(sessionID) {
        if (!sessionID)
            return;
        if (this.inProgress.has(sessionID))
            return;
        // Deduplicate: multiple events can fire for a single rate-limit event.
        const now = Date.now();
        if (now - (this.lastTrigger.get(sessionID) ?? 0) < DEDUP_WINDOW_MS)
            return;
        this.lastTrigger.set(sessionID, now);
        this.inProgress.add(sessionID);
        try {
            const currentModel = this.sessionModel.get(sessionID);
            const agentName = this.sessionAgent.get(sessionID);
            const chain = this.resolveChain(agentName, currentModel);
            if (!chain.length) {
                log('[runtime-fallback] no chain configured', {
                    sessionID,
                    agentName,
                });
                return;
            }
            if (!this.sessionTried.has(sessionID)) {
                this.sessionTried.set(sessionID, new Set());
            }
            const tried = this.sessionTried.get(sessionID);
            if (currentModel)
                tried.add(currentModel);
            const nextModel = chain.find((m) => !tried.has(m));
            if (!nextModel) {
                log('[runtime-fallback] fallback chain exhausted', {
                    sessionID,
                    agentName,
                    tried: [...tried],
                });
                return;
            }
            tried.add(nextModel);
            // Enforce maxAttempts cap
            if (tried.size > this.maxAttempts) {
                log('[runtime-fallback] max attempts exceeded', {
                    sessionID,
                    agentName,
                    maxAttempts: this.maxAttempts,
                });
                return;
            }
            const ref = parseModel(nextModel);
            if (!ref) {
                log('[runtime-fallback] invalid model format', {
                    sessionID,
                    nextModel,
                });
                return;
            }
            // Retrieve the last user message to re-submit with the fallback model.
            const result = await this.client.session.messages({
                path: { id: sessionID },
            });
            const messages = (result.data ?? []);
            const lastUser = [...messages]
                .reverse()
                .find((m) => m.info.role === 'user');
            if (!lastUser) {
                log('[runtime-fallback] no user message found', { sessionID });
                return;
            }
            // promptAsync queues the prompt and returns immediately — this avoids
            // blocking the event handler while waiting for a full LLM response.
            const sessionClient = this.client.session;
            if (typeof sessionClient.promptAsync !== 'function') {
                log('[runtime-fallback] promptAsync unavailable', { sessionID });
                return;
            }
            // Abort the currently rate-limited prompt so the session becomes idle.
            try {
                await abortSessionWithTimeout(this.client, sessionID);
            }
            catch (error) {
                log('[runtime-fallback] abort did not complete cleanly', {
                    sessionID,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            // Give the server a moment to finalise the abort before re-prompting.
            await new Promise((r) => setTimeout(r, REPROMPT_DELAY_MS));
            await sessionClient.promptAsync({
                path: { id: sessionID },
                body: { parts: lastUser.parts, model: ref },
            });
            this.sessionModel.set(sessionID, nextModel);
            this.fallbackLogs.push({
                agent: agentName ?? 'unknown',
                from: currentModel ?? 'unknown',
                to: nextModel,
                timestamp: Date.now(),
                reason: 'rate-limit',
            });
            log('[runtime-fallback] switched to fallback model', {
                sessionID,
                agentName,
                from: currentModel,
                to: nextModel,
            });
        }
        catch (err) {
            log('[runtime-fallback] fallback attempt failed', {
                sessionID,
                error: err instanceof Error ? err.message : String(err),
            });
        }
        finally {
            this.inProgress.delete(sessionID);
        }
    }
    // ---------------------------------------------------------------------------
    // Chain resolution
    // ---------------------------------------------------------------------------
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
    resolveChain(agentName, currentModel) {
        if (agentName) {
            return this.chains[agentName] ?? [];
        }
        if (currentModel) {
            for (const chain of Object.values(this.chains)) {
                if (chain.includes(currentModel))
                    return chain;
            }
        }
        const all = [];
        const seen = new Set();
        for (const chain of Object.values(this.chains)) {
            for (const m of chain) {
                if (!seen.has(m)) {
                    seen.add(m);
                    all.push(m);
                }
            }
        }
        return all;
    }
    /** Returns the raw fallback logs for diagnostic purposes. */
    getFallbackLogs() {
        return [...this.fallbackLogs];
    }
}
// ---------------------------------------------------------------------------
// Legacy factory — backward-compatible wrapper for existing config pattern
// ---------------------------------------------------------------------------
/**
 * Creates a hook that intercepts model invocation failures and retries with
 * the next model in the fallback chain. Also provides an event handler for
 * reactive mid-conversation model switching on rate-limit errors.
 *
 * Returns both lifecycle hook handlers AND an event handler. The event handler
 * must be wired into the plugin's top-level event handler.
 */
export function createModelFallbackHook(ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        chains: {},
        maxAttempts: 3,
        ...hookConfig,
    };
    const manager = new RuntimeFallbackManager(ctx.client, cfg.chains, cfg.enabled, cfg.maxAttempts);
    return {
        /** Wire this into the plugin's event handler */
        handleEvent: (event) => manager.handleEvent(event),
        getFallbackLogs: () => manager.getFallbackLogs(),
    };
}
//# sourceMappingURL=model-fallback.js.map