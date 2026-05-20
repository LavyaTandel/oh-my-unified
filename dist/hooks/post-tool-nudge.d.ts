import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
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
/**
 * Creates a hook that nudges the agent (or user) to run typecheck and
 * test commands after file write/edit operations succeed.
 *
 * This reduces the feedback loop by proactively suggesting verification
 * steps instead of waiting for a build failure later.
 */
export declare function createPostToolNudgeHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: PostToolNudgeConfig): {
    'tool.after': (input: {
        tool: string;
        error?: string;
    }, output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=post-tool-nudge.d.ts.map