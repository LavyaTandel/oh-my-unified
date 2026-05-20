import { McpSkillCatalog } from './mcp-skill-catalog';
export declare class AgentContextEnricher {
    private catalog;
    constructor(catalog: McpSkillCatalog);
    generateMcpContextBlock(): string;
    generateToolSuggestions(taskDescription: string): string;
}
//# sourceMappingURL=agent-context-enricher.d.ts.map