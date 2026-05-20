import type { AgentConfig } from '@opencode-ai/sdk/v2';
export interface AgentDefinition {
    name: string;
    displayName?: string;
    description?: string;
    config: AgentConfig;
    /** Priority-ordered model entries for runtime fallback resolution. */
    _modelArray?: Array<{
        id: string;
        variant?: string;
    }>;
}
/**
 * Resolve agent prompt from base/custom/append inputs.
 * If customPrompt is provided, it replaces the base entirely.
 * Otherwise, customAppendPrompt is appended to the base.
 */
export declare function resolvePrompt(base: string, customPrompt?: string, customAppendPrompt?: string): string;
/**
 * Build the full orchestrator system prompt with agent descriptions.
 */
export declare function buildOrchestratorPrompt(config: Record<string, any> | undefined): string;
//# sourceMappingURL=orchestrator.d.ts.map