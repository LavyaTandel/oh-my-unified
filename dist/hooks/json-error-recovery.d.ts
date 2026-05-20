import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Configuration for JSON error recovery.
 */
export interface JsonErrorRecoveryConfig {
    /** Enable JSON error recovery (default: true) */
    enabled?: boolean;
    /** Maximum recovery attempts per tool invocation (default: 2) */
    maxAttempts?: number;
    /** Whether to log recovery details (default: true) */
    verbose?: boolean;
}
/**
 * Creates a hook that detects malformed JSON in tool responses and
 * attempts to recover by applying a series of common JSON fixes
 * (trailing commas, unquoted keys, single quotes, etc.).
 *
 * Recovery is attempted up to maxAttempts times. If all attempts
 * fail, the original error is reported.
 */
export declare function createJsonErrorRecoveryHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: JsonErrorRecoveryConfig): {
    'tool.after': (input: {
        tool: string;
        result?: string;
        error?: string;
    }, output: Record<string, unknown>) => Promise<void>;
    recover: (raw: string) => {
        success: boolean;
        result?: unknown;
        error?: string;
        attempts: number;
        fixesApplied: string[];
    };
};
//# sourceMappingURL=json-error-recovery.d.ts.map