import type { AgentDefinition } from './orchestrator';
/**
 * Create an AgentDefinition from the agent-commands registry.
 * This unifies the two agent systems: agent-commands provides the
 * source of truth for prompts/roles/delegation, and this factory
 * produces runtime AgentDefinition objects for OpenCode.
 */
export declare function createNorseAgent(name: string, model: string, customPrompt?: string, customAppendPrompt?: string): AgentDefinition | undefined;
//# sourceMappingURL=norse-agent.d.ts.map