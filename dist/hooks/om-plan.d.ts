import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Creates the om-plan slash command for 4-phase structured planning.
 * Phases: Assess → Assemble → Act → Improvise
 */
export declare function createOmPlanHook(ctx: PluginInput, config: PluginConfig): {
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
//# sourceMappingURL=om-plan.d.ts.map