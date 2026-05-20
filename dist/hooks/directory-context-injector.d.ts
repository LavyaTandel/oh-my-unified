import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Configuration for directory context injection.
 */
export interface DirectoryContextInjectorConfig {
    /** Enable context injection (default: true) */
    enabled?: boolean;
    /** Custom directory to read context from (default: ctx.directory) */
    directory?: string;
    /** File names to read for context (default: ['AGENTS.md', 'README.md']) */
    contextFiles?: string[];
    /** Maximum content length per file (default: 8000 chars) */
    maxFileLength?: number;
}
/**
 * Creates a hook that reads AGENTS.md and README.md from the current
 * project directory (or a custom path) and injects their content as
 * system context. This gives all agents project-specific guidance
 * about architecture, conventions, and available tools.
 */
export declare function createDirectoryContextInjectorHook(ctx: PluginInput, _config: PluginConfig, hookConfig?: DirectoryContextInjectorConfig): {
    gatherContext: () => string | null;
    invalidateCache: () => void;
    'message.before': (input: {
        content?: string;
        role?: string;
    }, _output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=directory-context-injector.d.ts.map