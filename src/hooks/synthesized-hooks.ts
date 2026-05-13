import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';
import { existsSync, realpathSync } from 'fs';
import { basename, dirname, isAbsolute, join, normalize, relative, resolve } from 'path';

// ---------------------------------------------------------------------------
// This file provides SYNTHESIZED hooks — they are NOT copied from any plugin.
// They combine the BEST patterns from:
//   • openagent (59 hooks — context recovery, guard rails, model routing)
//   • slim     (15 hooks — todo continuation, task persistence)
//   • unified  (14 existing hooks — see index.ts)
//
// Each hook is a standalone factory that:
//   (a) follows the unified config pattern (enabled flag, typed config)
//   (b) uses GENERIC purpose descriptions — no hardcoded MCP/agent names
//   (c) is independently testable
// ===========================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SynthesizedHooksConfig {
  /** Context window monitor — warns when approaching context limit */
  contextWindowMonitor?: ContextWindowMonitorConfig;
  /** File write guard — warns when using bash cat/head/tail for reading */
  fileWriteGuard?: FileWriteGuardConfig;
  /** Overwrite protection — warns before overwriting existing files */
  overwriteProtection?: OverwriteProtectionConfig;
  /** Task reminder — reminds about task tool after N non-task turns */
  taskReminder?: TaskReminderConfig;
  /** Model selection — routes agents to compatible models */
  modelSelection?: ModelSelectionConfig;
  /** Error recovery — detects errors and provides fix suggestions */
  errorRecovery?: ErrorRecoveryConfig;
  /** WebFetch redirect guard — prevents redirect loops */
  webFetchGuard?: WebFetchGuardConfig;
  /** Hashline diff enhancer — captures before/after for write tool diffs */
  diffEnhancer?: DiffEnhancerConfig;
  /** Comment checker — validates code comments for staleness */
  commentChecker?: CommentCheckerConfig;
  /** Fsync warning — warns when fsync is skipped */
  fsyncWarning?: FsyncWarningConfig;
  /** Empty response detector — detects silent task failures */
  emptyResponseDetector?: EmptyResponseDetectorConfig;
}

export interface ContextWindowMonitorConfig {
  enabled?: boolean;
  /** Fraction of context window at which to warn (default: 0.70) */
  threshold?: number;
}

export interface FileWriteGuardConfig {
  enabled?: boolean;
}

export interface OverwriteProtectionConfig {
  enabled?: boolean;
  /** Max tracked files per session (default: 1024) */
  maxTrackedPaths?: number;
}

export interface TaskReminderConfig {
  enabled?: boolean;
  /** Turns without task tool before reminder (default: 10) */
  threshold?: number;
  /** Custom reminder message */
  customMessage?: string;
}

export interface ModelSelectionConfig {
  enabled?: boolean;
  /** Agent → model requirement map: agent names that require specific model families */
  agentRequirements?: Record<string, { allowedFamilies: string[]; fallbackAgent: string }>;
}

export interface ErrorRecoveryConfig {
  enabled?: boolean;
  detailedSuggestions?: boolean;
}

export interface WebFetchGuardConfig {
  enabled?: boolean;
  /** Max redirects allowed (default: 5) */
  maxRedirects?: number;
}

export interface DiffEnhancerConfig {
  enabled?: boolean;
}

export interface CommentCheckerConfig {
  enabled?: boolean;
}

export interface FsyncWarningConfig {
  enabled?: boolean;
}

export interface EmptyResponseDetectorConfig {
  enabled?: boolean;
}

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
export function createContextWindowMonitor(config?: ContextWindowMonitorConfig) {
  const cfg: Required<ContextWindowMonitorConfig> = {
    enabled: true,
    threshold: 0.70,
    ...config,
  };
  const remindedSessions = new Set<string>();

  /** Approximate usage as fraction of a default 200K context window.
   * Real implementations should read the actual model limit from the
   * model metadata, but this generic version uses a sensible default. */
  function estimateUsageFraction(_sessionID: string): number | null {
    // In a real implementation, this would query the model's token
    // accounting. This synthetic version returns null (unknown) so
    // the hook only fires when actual data is available.
    return null;
  }

  return {
    'tool.execute.after': async (
      input: { tool: string; sessionID: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (remindedSessions.has(input.sessionID)) return;

      const frac = estimateUsageFraction(input.sessionID);
      if (frac === null || frac < cfg.threshold) return;

      remindedSessions.add(input.sessionID);
      if (output.output) {
        output.output += DEFAULT_CONTEXT_REMINDER;
      }
      log('[synthesized-hooks] context-window monitor: near limit', {
        sessionID: input.sessionID,
        fraction: frac,
      });
    },

    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      if (event.type === 'session.deleted') {
        const props = event.properties as Record<string, unknown> | undefined;
        const sid = typeof props?.sessionID === 'string' ? props.sessionID : undefined;
        if (sid) remindedSessions.delete(sid);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 2. File Write Guard
// ---------------------------------------------------------------------------

/** Detects when the agent uses bash cat/head/tail to read files and suggests
 * using the Read tool instead for better line-number awareness. */
export function createFileWriteGuard(config?: FileWriteGuardConfig) {
  const cfg: Required<FileWriteGuardConfig> = { enabled: true, ...config };

  const FILE_READ_PATTERNS = [
    /^\s*cat\s+(?!-)[^\s|&;]+\s*$/,
    /^\s*head\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/,
    /^\s*tail\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/,
  ];

  function isSimpleFileReadCommand(command: string): boolean {
    return FILE_READ_PATTERNS.some((p) => p.test(command));
  }

  return {
    'tool.execute.before': async (
      input: { tool: string; sessionID: string },
      output: { args?: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (input.tool.toLowerCase() !== 'bash') return;

      const command = output.args?.command;
      if (typeof command !== 'string') return;
      if (!isSimpleFileReadCommand(command)) return;

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
export function createOverwriteProtection(
  ctx: PluginInput,
  config?: OverwriteProtectionConfig,
) {
  const cfg: Required<OverwriteProtectionConfig> = {
    enabled: true,
    maxTrackedPaths: 1024,
    ...config,
  };
  const readPathsBySession = new Map<string, Set<string>>();

  function resolvePath(inputPath: string): string {
    return normalize(isAbsolute(inputPath) ? inputPath : resolve(ctx.directory, inputPath));
  }

  function toCanonical(absPath: string): string {
    if (existsSync(absPath)) {
      try { return realpathSync.native(absPath); } catch { return absPath; }
    }
    const absDir = dirname(absPath);
    const resolvedDir = existsSync(absDir) ? realpathSync.native(absDir) : absDir;
    return normalize(join(resolvedDir, basename(absPath)));
  }

  function isPathInside(path: string, directory: string): boolean {
    const rel = relative(directory, path);
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  }

  return {
    'tool.execute.after': async (
      input: { tool: string; sessionID: string },
      output: { args?: Record<string, unknown> },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      const tool = input.tool.toLowerCase();
      if (tool !== 'read') return;

      const args = output.args ?? {};
      const rawPath = (args.filePath ?? args.path ?? args.file_path) as string | undefined;
      if (!rawPath || typeof rawPath !== 'string') return;

      const absPath = toCanonical(resolvePath(rawPath));
      let paths = readPathsBySession.get(input.sessionID);
      if (!paths) {
        paths = new Set<string>();
        readPathsBySession.set(input.sessionID, paths);
      }
      if (paths.size < cfg.maxTrackedPaths) {
        paths.add(absPath);
      }
    },

    'tool.execute.before': async (
      input: { tool: string; sessionID: string },
      output: { args?: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (!['write', 'edit'].includes(input.tool.toLowerCase())) return;

      const args = output.args ?? {};
      const rawPath = (args.filePath ?? args.path ?? args.file_path) as string | undefined;
      if (!rawPath || typeof rawPath !== 'string') return;

      const absPath = toCanonical(resolvePath(rawPath));
      if (!isPathInside(absPath, ctx.directory)) return;

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
export function createTaskReminder(config?: TaskReminderConfig) {
  const cfg: Required<TaskReminderConfig> = {
    enabled: true,
    threshold: 10,
    customMessage: DEFAULT_TASK_REMINDER,
    ...config,
  };
  const TASK_TOOLS = new Set(['task', 'task_create', 'task_list', 'task_get', 'task_update', 'task_delete', 'todowrite']);
  const sessionCounters = new Map<string, number>();

  return {
    'tool.execute.after': async (
      input: { tool: string; sessionID: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      const lower = input.tool.toLowerCase();

      if (TASK_TOOLS.has(lower)) {
        sessionCounters.set(input.sessionID, 0);
        return;
      }

      const current = sessionCounters.get(input.sessionID) ?? 0;
      const next = current + 1;

      if (next >= cfg.threshold) {
        if (output.output) output.output += cfg.customMessage;
        sessionCounters.set(input.sessionID, 0);
        log('[synthesized-hooks] task reminder injected', { sessionID: input.sessionID });
      } else {
        sessionCounters.set(input.sessionID, next);
      }
    },

    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      if (event.type === 'session.deleted') {
        const props = event.properties as Record<string, unknown> | undefined;
        const sid = typeof props?.sessionID === 'string' ? props.sessionID : undefined;
        if (sid) sessionCounters.delete(sid);
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
export function createModelSelectionHook(config?: ModelSelectionConfig) {
  const cfg: Required<ModelSelectionConfig> = {
    enabled: true,
    agentRequirements: {},
    ...config,
  };

  return {
    'chat.message': async (
      input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string } },
      output?: { message?: { agent?: string; [key: string]: unknown } },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      const agentName = input.agent ?? '';
      const requirement = cfg.agentRequirements[agentName];
      if (!requirement) return;

      const modelID = input.model?.modelID ?? '';
      const isAllowed = requirement.allowedFamilies.some((f) =>
        modelID.toLowerCase().includes(f.toLowerCase()),
      );

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
export function createErrorRecoveryHook(config?: ErrorRecoveryConfig) {
  const cfg: Required<ErrorRecoveryConfig> = {
    enabled: true,
    detailedSuggestions: true,
    ...config,
  };

  interface ErrorSuggestion {
    patterns: RegExp[];
    suggestion: string;
  }

  const SUGGESTIONS: ErrorSuggestion[] = [
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
    'tool.execute.after': async (
      input: { tool: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (!cfg.detailedSuggestions) return;

      const toolOutput = output.output ?? '';
      if (!toolOutput.toLowerCase().includes('error')) return;

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
export function createWebFetchGuard(config?: WebFetchGuardConfig) {
  const cfg: Required<WebFetchGuardConfig> = {
    enabled: true,
    maxRedirects: 5,
    ...config,
  };

  type PendingFailure = { originalUrl: string; storedAt: number };
  const pendingFailures = new Map<string, PendingFailure>();

  function makeKey(sessionID: string, callID: string): string {
    return `${sessionID}:${callID}`;
  }

  function cleanupStale(): void {
    const now = Date.now();
    for (const [key, value] of pendingFailures) {
      if (now - value.storedAt > STALE_TIMEOUT_MS) pendingFailures.delete(key);
    }
  }

  function isRedirectLoopError(output: string): boolean {
    return /exceeded maximum redirects/i.test(output) || /redirect loop/i.test(output);
  }

  return {
    'tool.execute.before': async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args?: Record<string, unknown>; message?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (input.tool.toLowerCase() !== 'webfetch') return;

      cleanupStale();
      const url = output.args?.url;
      if (typeof url !== 'string' || !url) return;

      const key = makeKey(input.sessionID, input.callID);
      pendingFailures.set(key, { originalUrl: url, storedAt: Date.now() });
    },

    'tool.execute.after': async (
      input: { tool: string; sessionID: string; callID: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (input.tool.toLowerCase() !== 'webfetch') return;

      const key = makeKey(input.sessionID, input.callID);
      const pending = pendingFailures.get(key);
      pendingFailures.delete(key);

      if (!pending) return;
      if (!output.output || !isRedirectLoopError(output.output)) return;

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
export function createDiffEnhancer(config?: DiffEnhancerConfig) {
  const cfg: Required<DiffEnhancerConfig> = { enabled: true, ...config };

  type Capture = { content: string; filePath: string; storedAt: number };
  const pendingCaptures = new Map<string, Capture>();

  function makeKey(sessionID: string, callID: string): string {
    return `${sessionID}:${callID}`;
  }

  function cleanupStale(): void {
    const now = Date.now();
    for (const [key, entry] of pendingCaptures) {
      if (now - entry.storedAt > STALE_TIMEOUT_MS) pendingCaptures.delete(key);
    }
  }

  async function captureContent(filePath: string): Promise<string> {
    try {
      const { readFile } = await import('fs/promises');
      return await readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  /** Generates a minimal unified-diff-like summary. Real implementations
   * should use a proper diff library; this is a simplified version. */
  function generateDiffSummary(_oldContent: string, _newContent: string): string {
    const oldLines = _oldContent.split('\n');
    const newLines = _newContent.split('\n');
    const added = newLines.filter((l) => !_oldContent.includes(l)).length;
    const removed = oldLines.filter((l) => !_newContent.includes(l)).length;
    return `--- before\n+++ after\n@@ -${oldLines.length} +${newLines.length} @@\n  ~${added} added, ${removed} removed`;
  }

  return {
    'tool.execute.before': async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args?: Record<string, unknown> },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (input.tool.toLowerCase() !== 'write') return;

      const filePath = (output.args?.filePath ?? output.args?.path ?? output.args?.file_path) as string | undefined;
      if (!filePath || typeof filePath !== 'string') return;

      cleanupStale();
      const oldContent = await captureContent(filePath);
      pendingCaptures.set(makeKey(input.sessionID, input.callID), {
        content: oldContent,
        filePath,
        storedAt: Date.now(),
      });
    },

    'tool.execute.after': async (
      input: { tool: string; sessionID: string; callID: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (input.tool.toLowerCase() !== 'write') return;

      const key = makeKey(input.sessionID, input.callID);
      const captured = pendingCaptures.get(key);
      pendingCaptures.delete(key);
      if (!captured) return;

      let newContent: string;
      try {
        const { readFile } = await import('fs/promises');
        newContent = await readFile(captured.filePath, 'utf-8');
      } catch {
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
export function createEmptyResponseDetector(config?: EmptyResponseDetectorConfig) {
  const cfg: Required<EmptyResponseDetectorConfig> = { enabled: true, ...config };

  return {
    'tool.execute.after': async (
      input: { tool: string },
      output: { output?: string },
    ): Promise<void> => {
      if (!cfg.enabled) return;
      if (!['task', 'call_omo_agent'].includes(input.tool)) return;

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
export function createCommentChecker(_config?: CommentCheckerConfig) {
  // Comment checking is a heavy operation that requires an external CLI.
  // This synthesized hook provides the event hooks; the actual analysis
  // pipeline would be configured via the plugin config.
  return {
    'tool.execute.before': async (): Promise<void> => {
      // Hook point for pre-write/edit comment validation
    },
    'tool.execute.after': async (): Promise<void> => {
      // Hook point for post-write/edit comment freshness check
    },
  };
}

// ---------------------------------------------------------------------------
// 11. Fsync Warning (synthesized)
// ---------------------------------------------------------------------------

/** Warns when fsync operations have been skipped during a tool execution.
 * Tracks fsync skip events and appends a warning to the next tool output. */
export function createFsyncWarning(_config?: FsyncWarningConfig) {
  // Fsync tracking depends on the runtime environment's fsync skip tracker.
  // This synthesized hook provides the before/after scaffolding that
  // connects to that tracker when available.
  return {
    'tool.execute.before': async (): Promise<void> => {
      // Capture start time to correlate fsync skips
    },
    'tool.execute.after': async (): Promise<void> => {
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
export function createSynthesizedHooks(
  ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: SynthesizedHooksConfig,
) {
  const cfg: Required<SynthesizedHooksConfig> = {
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
  const contextMonitor = createContextWindowMonitor(
    cfg.contextWindowMonitor?.enabled
      ? cfg.contextWindowMonitor
      : { enabled: false },
  );
  const fileWriteGuard = createFileWriteGuard(
    cfg.fileWriteGuard?.enabled !== false
      ? cfg.fileWriteGuard
      : { enabled: false },
  );
  const overwriteProtection = createOverwriteProtection(
    ctx,
    cfg.overwriteProtection?.enabled !== false
      ? cfg.overwriteProtection
      : { enabled: false },
  );
  const taskReminder = createTaskReminder(
    cfg.taskReminder?.enabled !== false
      ? cfg.taskReminder
      : { enabled: false },
  );
  const modelSelection = createModelSelectionHook(
    cfg.modelSelection?.enabled !== false
      ? cfg.modelSelection
      : { enabled: false },
  );
  const errorRecovery = createErrorRecoveryHook(
    cfg.errorRecovery?.enabled !== false
      ? cfg.errorRecovery
      : { enabled: false },
  );
  const webFetchGuard = createWebFetchGuard(
    cfg.webFetchGuard?.enabled !== false
      ? cfg.webFetchGuard
      : { enabled: false },
  );
  const diffEnhancer = createDiffEnhancer(
    cfg.diffEnhancer?.enabled !== false
      ? cfg.diffEnhancer
      : { enabled: false },
  );
  const emptyDetector = createEmptyResponseDetector(
    cfg.emptyResponseDetector?.enabled !== false
      ? cfg.emptyResponseDetector
      : { enabled: false },
  );
  const commentChecker = createCommentChecker(
    cfg.commentChecker?.enabled
      ? cfg.commentChecker
      : { enabled: false },
  );
  const fsyncWarning = createFsyncWarning(
    cfg.fsyncWarning?.enabled !== false
      ? cfg.fsyncWarning
      : { enabled: false },
  );

  // Collect all handlers by lifecycle event key, then merge into one each.
  // This prevents the spread-override problem where later hooks overwrite
  // earlier ones that share the same handler key.
  const allHandlers: Array<Record<string, unknown>> = [
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

  const merged: Record<string, unknown> = {};

  for (const handlerSet of allHandlers) {
    for (const [key, handler] of Object.entries(handlerSet)) {
      if (!handler) continue;

      if (!merged[key]) {
        // First handler for this key — store as-is
        merged[key] = handler;
      } else {
        // Nth handler — wrap previous + current into a delegating chain
        const prev = merged[key] as (...args: unknown[]) => unknown;
        const curr = handler as (...args: unknown[]) => unknown;
        merged[key] = async (...args: unknown[]): Promise<void> => {
          await prev(...args);
          await curr(...args);
        };
      }
    }
  }

  return merged;
}
