import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
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
    agentRequirements?: Record<string, {
        allowedFamilies: string[];
        fallbackAgent: string;
    }>;
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
/** Monitors model token usage and injects a reminder when approaching the
 * context window limit. Prevents models from prematurely truncating work. */
export declare function createContextWindowMonitor(config?: ContextWindowMonitorConfig): {
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
    event: ({ event }: {
        event: {
            type: string;
            properties?: unknown;
        };
    }) => Promise<void>;
};
/** Detects when the agent uses bash cat/head/tail to read files and suggests
 * using the Read tool instead for better line-number awareness. */
export declare function createFileWriteGuard(config?: FileWriteGuardConfig): {
    'tool.execute.before': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        args?: Record<string, unknown>;
        message?: string;
    }) => Promise<void>;
};
/** Tracks which files have been READ during a session and warns before
 * overwriting a file that hasn't been read yet (preventing accidental loss
 * of unexamined content). */
export declare function createOverwriteProtection(ctx: PluginInput, config?: OverwriteProtectionConfig): {
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        args?: Record<string, unknown>;
    }) => Promise<void>;
    'tool.execute.before': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        args?: Record<string, unknown>;
        message?: string;
    }) => Promise<void>;
};
/** Monitors tool usage and reminds about the task/todo system after N
 * consecutive non-task tool calls. Resets when a task tool is used. */
export declare function createTaskReminder(config?: TaskReminderConfig): {
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
    event: ({ event }: {
        event: {
            type: string;
            properties?: unknown;
        };
    }) => Promise<void>;
};
/** Routes agent selections to compatible models. Prevents using
 * implementation-specialist agents with models not designed for execution —
 * falling back to a general-purpose agent when needed. */
export declare function createModelSelectionHook(config?: ModelSelectionConfig): {
    'chat.message': (input: {
        sessionID: string;
        agent?: string;
        model?: {
            providerID: string;
            modelID: string;
        };
    }, output?: {
        message?: {
            agent?: string;
            [key: string]: unknown;
        };
    }) => Promise<void>;
};
/** Categorises common edit/write/read error patterns and injects specific
 * recovery suggestions into the tool output. Synthesised from both openagent
 * (edit-error-recovery) and slim patterns. */
export declare function createErrorRecoveryHook(config?: ErrorRecoveryConfig): {
    'tool.execute.after': (input: {
        tool: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
};
/** Detects and prevents WebFetch redirect loops by tracking pending
 * redirect failures and resolving URLs before the fetch attempt. */
export declare function createWebFetchGuard(config?: WebFetchGuardConfig): {
    'tool.execute.before': (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        args?: Record<string, unknown>;
        message?: string;
    }) => Promise<void>;
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
};
/** Captures file content BEFORE a write/edit and attaches a unified diff
 * to the AFTER output so the user can see exactly what changed. */
export declare function createDiffEnhancer(config?: DiffEnhancerConfig): {
    'tool.execute.before': (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        args?: Record<string, unknown>;
    }) => Promise<void>;
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
};
/** Detects when a task or subagent call returns an empty response and
 * injects a warning so the caller knows the agent didn't produce output. */
export declare function createEmptyResponseDetector(config?: EmptyResponseDetectorConfig): {
    'tool.execute.after': (input: {
        tool: string;
    }, output: {
        output?: string;
    }) => Promise<void>;
};
/** Validates code comments for staleness. The real implementation calls an
 * external CLI; this synthesized version provides the hook scaffolding and
 * integrates with the project's existing tool patterns.
 * The full checker integration (CLI download, parsing, patch generation)
 * is configured separately — this hook handles lifecycle events. */
export declare function createCommentChecker(_config?: CommentCheckerConfig): {
    'tool.execute.before': () => Promise<void>;
    'tool.execute.after': () => Promise<void>;
};
/** Warns when fsync operations have been skipped during a tool execution.
 * Tracks fsync skip events and appends a warning to the next tool output. */
export declare function createFsyncWarning(_config?: FsyncWarningConfig): {
    'tool.execute.before': () => Promise<void>;
    'tool.execute.after': () => Promise<void>;
};
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
export declare function createSynthesizedHooks(ctx: PluginInput, _config: PluginConfig, hookConfig?: SynthesizedHooksConfig): Record<string, unknown>;
//# sourceMappingURL=synthesized-hooks.d.ts.map