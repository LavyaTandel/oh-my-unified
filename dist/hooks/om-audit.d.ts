import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Creates the om-audit slash command for multi-perspective code review.
 * Runs architecture, quality, security, and UX checks via council-style
 * multi-model orchestration.
 */
export declare function createOmAuditHook(ctx: PluginInput, config: PluginConfig): {
    registerCommand: (opencodeConfig: Record<string, unknown>) => void;
    handleCommandExecuteBefore: (input: {
        command: string;
        sessionID: string;
        arguments: string;
    }, output: {
        parts: Array<{
            type: string;
            text?: string;
        }>;
    }) => Promise<void>;
};
//# sourceMappingURL=om-audit.d.ts.map