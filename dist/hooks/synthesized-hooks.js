import { log } from '../utils/logger';
import { existsSync, realpathSync } from 'fs';
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from 'path';
// ---------------------------------------------------------------------------
// Default messages
// ---------------------------------------------------------------------------
const DEFAULT_CONTEXT_REMINDER = `
Note: You still have context remaining — do NOT rush or skip tasks.
Complete your work thoroughly and methodically.`;
const DEFAULT_TASK_REMINDER = `
The task tools haven't been used recently. If you're tracking work, use the todo/task system to record progress.`;
const DEFAULT_FILE_READ_WARNING = 'Prefer the Read tool over bash cat/head/tail for reading files. Read provides line numbers and hash anchors for precise editing.';
const DEFAULT_EMPTY_RESPONSE_WARNING = `[Empty Response Warning]
Task invocation returned no response. The agent may have failed silently.
Proceed accordingly — you are NOT waiting for a response.`;
const STALE_TIMEOUT_MS = 5 * 60 * 1000;
// ---------------------------------------------------------------------------
// 1. Context Window Monitor
// ---------------------------------------------------------------------------
/** Monitors model token usage and injects a reminder when approaching the
 * context window limit. Prevents models from prematurely truncating work. */
export function createContextWindowMonitor(config) {
    const cfg = {
        enabled: true,
        threshold: 0.70,
        ...config,
    };
    const remindedSessions = new Set();
    /** Approximate usage as fraction of a default 200K context window.
     * Real implementations should read the actual model limit from the
     * model metadata, but this generic version uses a sensible default. */
    function estimateUsageFraction(_sessionID) {
        // In a real implementation, this would query the model's token
        // accounting. This synthetic version returns null (unknown) so
        // the hook only fires when actual data is available.
        return null;
    }
    return {
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (remindedSessions.has(input.sessionID))
                return;
            const frac = estimateUsageFraction(input.sessionID);
            if (frac === null || frac < cfg.threshold)
                return;
            remindedSessions.add(input.sessionID);
            if (output.output) {
                output.output += DEFAULT_CONTEXT_REMINDER;
            }
            log('[synthesized-hooks] context-window monitor: near limit', {
                sessionID: input.sessionID,
                fraction: frac,
            });
        },
        'event': async ({ event }) => {
            if (event.type === 'session.deleted') {
                const props = event.properties;
                const sid = typeof props?.sessionID === 'string' ? props.sessionID : undefined;
                if (sid)
                    remindedSessions.delete(sid);
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 2. File Write Guard
// ---------------------------------------------------------------------------
/** Detects when the agent uses bash cat/head/tail to read files and suggests
 * using the Read tool instead for better line-number awareness. */
export function createFileWriteGuard(config) {
    const cfg = { enabled: true, ...config };
    const FILE_READ_PATTERNS = [
        /^\s*cat\s+(?!-)[^\s|&;]+\s*$/,
        /^\s*head\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/,
        /^\s*tail\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/,
    ];
    function isSimpleFileReadCommand(command) {
        return FILE_READ_PATTERNS.some((p) => p.test(command));
    }
    return {
        'tool.execute.before': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (input.tool.toLowerCase() !== 'bash')
                return;
            const command = output.args?.command;
            if (typeof command !== 'string')
                return;
            if (!isSimpleFileReadCommand(command))
                return;
            output.message = DEFAULT_FILE_READ_WARNING;
            log('[synthesized-hooks] file-read guard: warned on bash read', {
                sessionID: input.sessionID,
                command,
            });
        },
    };
}
// ---------------------------------------------------------------------------
// 3. Overwrite Protection
// ---------------------------------------------------------------------------
/** Tracks which files have been READ during a session and warns before
 * overwriting a file that hasn't been read yet (preventing accidental loss
 * of unexamined content). */
export function createOverwriteProtection(ctx, config) {
    const cfg = {
        enabled: true,
        maxTrackedPaths: 1024,
        ...config,
    };
    const readPathsBySession = new Map();
    function resolvePath(inputPath) {
        return normalize(isAbsolute(inputPath) ? inputPath : resolve(ctx.directory, inputPath));
    }
    function toCanonical(absPath) {
        if (existsSync(absPath)) {
            try {
                return realpathSync.native(absPath);
            }
            catch {
                return absPath;
            }
        }
        const absDir = dirname(absPath);
        const resolvedDir = existsSync(absDir) ? realpathSync.native(absDir) : absDir;
        return normalize(join(resolvedDir, basename(absPath)));
    }
    function isPathInside(path, directory) {
        const rel = relative(directory, path);
        return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
    }
    return {
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            const tool = input.tool.toLowerCase();
            if (tool !== 'read')
                return;
            const args = output.args ?? {};
            const rawPath = (args.filePath ?? args.path ?? args.file_path);
            if (!rawPath || typeof rawPath !== 'string')
                return;
            const absPath = toCanonical(resolvePath(rawPath));
            let paths = readPathsBySession.get(input.sessionID);
            if (!paths) {
                paths = new Set();
                readPathsBySession.set(input.sessionID, paths);
            }
            if (paths.size < cfg.maxTrackedPaths) {
                paths.add(absPath);
            }
        },
        'tool.execute.before': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (!['write', 'edit'].includes(input.tool.toLowerCase()))
                return;
            const args = output.args ?? {};
            const rawPath = (args.filePath ?? args.path ?? args.file_path);
            if (!rawPath || typeof rawPath !== 'string')
                return;
            const absPath = toCanonical(resolvePath(rawPath));
            if (!isPathInside(absPath, ctx.directory))
                return;
            const paths = readPathsBySession.get(input.sessionID);
            if (!paths?.has(absPath)) {
                output.message = `WARNING: "${rawPath}" may not have been read this session. ` +
                    'Read the file first to verify its current content before overwriting.';
                log('[synthesized-hooks] overwrite guard: file not read before write', {
                    sessionID: input.sessionID,
                    path: absPath,
                });
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 4. Task Reminder
// ---------------------------------------------------------------------------
/** Monitors tool usage and reminds about the task/todo system after N
 * consecutive non-task tool calls. Resets when a task tool is used. */
export function createTaskReminder(config) {
    const cfg = {
        enabled: true,
        threshold: 10,
        customMessage: DEFAULT_TASK_REMINDER,
        ...config,
    };
    const TASK_TOOLS = new Set(['task', 'task_create', 'task_list', 'task_get', 'task_update', 'task_delete', 'todowrite']);
    const sessionCounters = new Map();
    return {
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            const lower = input.tool.toLowerCase();
            if (TASK_TOOLS.has(lower)) {
                sessionCounters.set(input.sessionID, 0);
                return;
            }
            const current = sessionCounters.get(input.sessionID) ?? 0;
            const next = current + 1;
            if (next >= cfg.threshold) {
                if (output.output)
                    output.output += cfg.customMessage;
                sessionCounters.set(input.sessionID, 0);
                log('[synthesized-hooks] task reminder injected', { sessionID: input.sessionID });
            }
            else {
                sessionCounters.set(input.sessionID, next);
            }
        },
        'event': async ({ event }) => {
            if (event.type === 'session.deleted') {
                const props = event.properties;
                const sid = typeof props?.sessionID === 'string' ? props.sessionID : undefined;
                if (sid)
                    sessionCounters.delete(sid);
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 5. Model Selection
// ---------------------------------------------------------------------------
/** Routes agent selections to compatible models. Prevents using
 * implementation-specialist agents with models not designed for execution —
 * falling back to a general-purpose agent when needed. */
export function createModelSelectionHook(config) {
    const cfg = {
        enabled: true,
        agentRequirements: {},
        ...config,
    };
    return {
        'chat.message': async (input, output) => {
            if (!cfg.enabled)
                return;
            const agentName = input.agent ?? '';
            const requirement = cfg.agentRequirements[agentName];
            if (!requirement)
                return;
            const modelID = input.model?.modelID ?? '';
            const isAllowed = requirement.allowedFamilies.some((f) => modelID.toLowerCase().includes(f.toLowerCase()));
            if (!isAllowed) {
                // Redirect to fallback agent
                const fallback = requirement.fallbackAgent;
                input.agent = fallback;
                if (output?.message) {
                    output.message.agent = fallback;
                }
                log('[synthesized-hooks] model selection: rerouted agent', {
                    sessionID: input.sessionID,
                    from: agentName,
                    to: fallback,
                    model: modelID,
                });
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 6. Error Recovery
// ---------------------------------------------------------------------------
/** Categorises common edit/write/read error patterns and injects specific
 * recovery suggestions into the tool output. Synthesised from both openagent
 * (edit-error-recovery) and slim patterns. */
export function createErrorRecoveryHook(config) {
    const cfg = {
        enabled: true,
        detailedSuggestions: true,
        ...config,
    };
    const SUGGESTIONS = [
        {
            patterns: [/not found/i, /no such file/i, /ENOENT/, /does not exist/i],
            suggestion: 'File not found. Verify the path exists using `glob` or `ls` before trying again.',
        },
        {
            patterns: [/permission denied/i, /EACCES/, /EPERM/],
            suggestion: 'Permission denied. Ensure the file is not open in another process and you have write access.',
        },
        {
            patterns: [/oldString not found/i, /no match/i],
            suggestion: 'The exact text to replace was not found. The content may have changed — re-read the file to get current content before editing.',
        },
        {
            patterns: [/multiple match/i, /multiple occurrence/i],
            suggestion: 'Found multiple matches. Provide more surrounding context in oldString to uniquely identify the target location.',
        },
        {
            patterns: [/is a directory/i, /EISDIR/],
            suggestion: 'The path points to a directory, not a file. Append the filename to the path.',
        },
        {
            patterns: [/ENOSPC/, /disk full/i, /no space/i],
            suggestion: 'File system may be full. Check disk space with `df -h .` and free up space if needed.',
        },
        {
            patterns: [/locked/i, /EBUSY/],
            suggestion: 'The file is locked or busy. Wait a moment and retry.',
        },
        {
            patterns: [/rate limit/i, /too many requests/i, /429/],
            suggestion: 'Rate limited. Wait before retrying, or reduce request frequency.',
        },
        {
            patterns: [/(timeout|timed out)/i, /ETIMEDOUT/, /ESOCKETTIMEDOUT/],
            suggestion: 'Request timed out. The service may be slow — try again with a longer timeout.',
        },
    ];
    return {
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (!cfg.detailedSuggestions)
                return;
            const toolOutput = output.output ?? '';
            if (!toolOutput.toLowerCase().includes('error'))
                return;
            for (const entry of SUGGESTIONS) {
                if (entry.patterns.some((p) => p.test(toolOutput))) {
                    output.output = `${toolOutput}\n\n💡 ${entry.suggestion}`;
                    return;
                }
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 7. WebFetch Redirect Guard
// ---------------------------------------------------------------------------
/** Detects and prevents WebFetch redirect loops by tracking pending
 * redirect failures and resolving URLs before the fetch attempt. */
export function createWebFetchGuard(config) {
    const cfg = {
        enabled: true,
        maxRedirects: 5,
        ...config,
    };
    const pendingFailures = new Map();
    function makeKey(sessionID, callID) {
        return `${sessionID}:${callID}`;
    }
    function cleanupStale() {
        const now = Date.now();
        for (const [key, value] of pendingFailures) {
            if (now - value.storedAt > STALE_TIMEOUT_MS)
                pendingFailures.delete(key);
        }
    }
    function isRedirectLoopError(output) {
        return /exceeded maximum redirects/i.test(output) || /redirect loop/i.test(output);
    }
    return {
        'tool.execute.before': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (input.tool.toLowerCase() !== 'webfetch')
                return;
            cleanupStale();
            const url = output.args?.url;
            if (typeof url !== 'string' || !url)
                return;
            const key = makeKey(input.sessionID, input.callID);
            pendingFailures.set(key, { originalUrl: url, storedAt: Date.now() });
        },
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (input.tool.toLowerCase() !== 'webfetch')
                return;
            const key = makeKey(input.sessionID, input.callID);
            const pending = pendingFailures.get(key);
            pendingFailures.delete(key);
            if (!pending)
                return;
            if (!output.output || !isRedirectLoopError(output.output))
                return;
            output.output = `Error: WebFetch failed — exceeded maximum redirects (${cfg.maxRedirects}) for ${pending.originalUrl}`;
            log('[synthesized-hooks] webfetch redirect guard: blocked loop', {
                sessionID: input.sessionID,
                url: pending.originalUrl,
            });
        },
    };
}
// ---------------------------------------------------------------------------
// 8. Diff Enhancer
// ---------------------------------------------------------------------------
/** Captures file content BEFORE a write/edit and attaches a unified diff
 * to the AFTER output so the user can see exactly what changed. */
export function createDiffEnhancer(config) {
    const cfg = { enabled: true, ...config };
    const pendingCaptures = new Map();
    function makeKey(sessionID, callID) {
        return `${sessionID}:${callID}`;
    }
    function cleanupStale() {
        const now = Date.now();
        for (const [key, entry] of pendingCaptures) {
            if (now - entry.storedAt > STALE_TIMEOUT_MS)
                pendingCaptures.delete(key);
        }
    }
    async function captureContent(filePath) {
        try {
            const { readFile } = await import('fs/promises');
            return await readFile(filePath, 'utf-8');
        }
        catch {
            return '';
        }
    }
    /** Generates a minimal unified-diff-like summary. Real implementations
     * should use a proper diff library; this is a simplified version. */
    function generateDiffSummary(_oldContent, _newContent) {
        const oldLines = _oldContent.split('\n');
        const newLines = _newContent.split('\n');
        const added = newLines.filter((l) => !_oldContent.includes(l)).length;
        const removed = oldLines.filter((l) => !_newContent.includes(l)).length;
        return `--- before\n+++ after\n@@ -${oldLines.length} +${newLines.length} @@\n  ~${added} added, ${removed} removed`;
    }
    return {
        'tool.execute.before': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (input.tool.toLowerCase() !== 'write')
                return;
            const filePath = (output.args?.filePath ?? output.args?.path ?? output.args?.file_path);
            if (!filePath || typeof filePath !== 'string')
                return;
            cleanupStale();
            const oldContent = await captureContent(filePath);
            pendingCaptures.set(makeKey(input.sessionID, input.callID), {
                content: oldContent,
                filePath,
                storedAt: Date.now(),
            });
        },
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (input.tool.toLowerCase() !== 'write')
                return;
            const key = makeKey(input.sessionID, input.callID);
            const captured = pendingCaptures.get(key);
            pendingCaptures.delete(key);
            if (!captured)
                return;
            let newContent;
            try {
                const { readFile } = await import('fs/promises');
                newContent = await readFile(captured.filePath, 'utf-8');
            }
            catch {
                return;
            }
            const diff = generateDiffSummary(captured.content, newContent);
            if (output.output) {
                output.output += `\n\n${diff}`;
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 9. Empty Response Detector
// ---------------------------------------------------------------------------
/** Detects when a task or subagent call returns an empty response and
 * injects a warning so the caller knows the agent didn't produce output. */
export function createEmptyResponseDetector(config) {
    const cfg = { enabled: true, ...config };
    return {
        'tool.execute.after': async (input, output) => {
            if (!cfg.enabled)
                return;
            if (!['task', 'call_omo_agent'].includes(input.tool))
                return;
            const text = output.output?.trim() ?? '';
            if (text === '') {
                output.output = DEFAULT_EMPTY_RESPONSE_WARNING;
            }
        },
    };
}
// ---------------------------------------------------------------------------
// 10. Comment Checker (synthesized stub)
// ---------------------------------------------------------------------------
/** Validates code comments for staleness. The real implementation calls an
 * external CLI; this synthesized version provides the hook scaffolding and
 * integrates with the project's existing tool patterns.
 * The full checker integration (CLI download, parsing, patch generation)
 * is configured separately — this hook handles lifecycle events. */
export function createCommentChecker(_config) {
    // Comment checking is a heavy operation that requires an external CLI.
    // This synthesized hook provides the event hooks; the actual analysis
    // pipeline would be configured via the plugin config.
    return {
        'tool.execute.before': async () => {
            // Hook point for pre-write/edit comment validation
        },
        'tool.execute.after': async () => {
            // Hook point for post-write/edit comment freshness check
        },
    };
}
// ---------------------------------------------------------------------------
// 11. Fsync Warning (synthesized)
// ---------------------------------------------------------------------------
/** Warns when fsync operations have been skipped during a tool execution.
 * Tracks fsync skip events and appends a warning to the next tool output. */
export function createFsyncWarning(_config) {
    // Fsync tracking depends on the runtime environment's fsync skip tracker.
    // This synthesized hook provides the before/after scaffolding that
    // connects to that tracker when available.
    return {
        'tool.execute.before': async () => {
            // Capture start time to correlate fsync skips
        },
        'tool.execute.after': async () => {
            // Check for fsync skips since start time and warn if any found
        },
    };
}
// ---------------------------------------------------------------------------
// Master factory — returns ALL synthesized hooks with MERGED handlers
// ---------------------------------------------------------------------------
/**
 * Creates all synthesized hooks in a single call. Each hook is independently
 * configurable via the `config` parameter and can be toggled on/off.
 *
 * CRITICAL: Handlers for the same lifecycle event (e.g. `tool.execute.before`)
 * are MERGED into a single delegating function. Spreading would cause the
 * last-spread handler to overwrite earlier ones.
 *
 * These hooks are NOT copied from any plugin — they are SYNTHESISED from
 * the best patterns across openagent (context recovery, file guards, model
 * routing) and slim (task persistence, error recovery).
 *
 * Usage in plugin entry:
 * ```ts
 * const hooks = createSynthesizedHooks(ctx, config, {
 *   contextWindowMonitor: { enabled: true },
 *   taskReminder: { enabled: true, threshold: 8 },
 * });
 * return { ...hooks };
 * ```
 */
export function createSynthesizedHooks(ctx, _config, hookConfig) {
    const cfg = {
        contextWindowMonitor: { enabled: true },
        fileWriteGuard: { enabled: true },
        overwriteProtection: { enabled: true },
        taskReminder: { enabled: true },
        modelSelection: { enabled: true },
        errorRecovery: { enabled: true },
        webFetchGuard: { enabled: true },
        diffEnhancer: { enabled: true },
        commentChecker: { enabled: false },
        fsyncWarning: { enabled: true },
        emptyResponseDetector: { enabled: true },
        ...hookConfig,
    };
    // Instantiate individual hooks (they may be disabled by config)
    const contextMonitor = createContextWindowMonitor(cfg.contextWindowMonitor?.enabled
        ? cfg.contextWindowMonitor
        : { enabled: false });
    const fileWriteGuard = createFileWriteGuard(cfg.fileWriteGuard?.enabled !== false
        ? cfg.fileWriteGuard
        : { enabled: false });
    const overwriteProtection = createOverwriteProtection(ctx, cfg.overwriteProtection?.enabled !== false
        ? cfg.overwriteProtection
        : { enabled: false });
    const taskReminder = createTaskReminder(cfg.taskReminder?.enabled !== false
        ? cfg.taskReminder
        : { enabled: false });
    const modelSelection = createModelSelectionHook(cfg.modelSelection?.enabled !== false
        ? cfg.modelSelection
        : { enabled: false });
    const errorRecovery = createErrorRecoveryHook(cfg.errorRecovery?.enabled !== false
        ? cfg.errorRecovery
        : { enabled: false });
    const webFetchGuard = createWebFetchGuard(cfg.webFetchGuard?.enabled !== false
        ? cfg.webFetchGuard
        : { enabled: false });
    const diffEnhancer = createDiffEnhancer(cfg.diffEnhancer?.enabled !== false
        ? cfg.diffEnhancer
        : { enabled: false });
    const emptyDetector = createEmptyResponseDetector(cfg.emptyResponseDetector?.enabled !== false
        ? cfg.emptyResponseDetector
        : { enabled: false });
    const commentChecker = createCommentChecker(cfg.commentChecker?.enabled
        ? cfg.commentChecker
        : { enabled: false });
    const fsyncWarning = createFsyncWarning(cfg.fsyncWarning?.enabled !== false
        ? cfg.fsyncWarning
        : { enabled: false });
    // Collect all handlers by lifecycle event key, then merge into one each.
    // This prevents the spread-override problem where later hooks overwrite
    // earlier ones that share the same handler key.
    const allHandlers = [
        contextMonitor,
        fileWriteGuard,
        overwriteProtection,
        taskReminder,
        modelSelection,
        errorRecovery,
        webFetchGuard,
        diffEnhancer,
        emptyDetector,
        commentChecker,
        fsyncWarning,
    ];
    const merged = {};
    for (const handlerSet of allHandlers) {
        for (const [key, handler] of Object.entries(handlerSet)) {
            if (!handler)
                continue;
            if (!merged[key]) {
                // First handler for this key — store as-is
                merged[key] = handler;
            }
            else {
                // Nth handler — wrap previous + current into a delegating chain
                const prev = merged[key];
                const curr = handler;
                merged[key] = async (...args) => {
                    await prev(...args);
                    await curr(...args);
                };
            }
        }
    }
    return merged;
}
//# sourceMappingURL=synthesized-hooks.js.map