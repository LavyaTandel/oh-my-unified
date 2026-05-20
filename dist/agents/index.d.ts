import type { PluginConfig } from '../config/schema';
import type { McpSkillCatalog } from '../features/tool-use-enforcer/mcp-skill-catalog';
import { type AgentDefinition } from './orchestrator';
export type { AgentDefinition } from './orchestrator';
export declare function createAgents(config: PluginConfig | undefined, catalog?: McpSkillCatalog): AgentDefinition[];
export declare function getAgentConfigs(config: PluginConfig | undefined, catalog?: McpSkillCatalog): Record<string, any>;
export declare function getDisabledAgents(config: PluginConfig | undefined): Set<string>;
//# sourceMappingURL=index.d.ts.map