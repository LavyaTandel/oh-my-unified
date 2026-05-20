import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Configuration for edit error recovery.
 */
export interface EditErrorRecoveryConfig {
    /** Enable edit error recovery (default: true) */
    enabled?: boolean;
    /** Include detailed recovery suggestions (default: true) */
    detailedSuggestions?: boolean;
}
/**
 * Creates a hook that intercepts file edit failures and provides
 * helpful recovery suggestions based on the error message pattern.
 *
 * Each suggestion includes whether the fix can be automated and
 * specific next steps for the agent or user.
 */
export declare function createEditErrorRecoveryHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: EditErrorRecoveryConfig): {
    'tool.after': (input: {
        tool: string;
        error?: string;
        filePath?: string;
    }, _output: Record<string, unknown>) => Promise<void>;
    suggest: (error: string) => {
        category: string;
        suggestion: string;
        autoFixable: boolean;
    } | null;
};
//# sourceMappingURL=edit-error-recovery.d.ts.map