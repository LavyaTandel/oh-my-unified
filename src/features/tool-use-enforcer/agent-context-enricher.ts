import { McpSkillCatalog } from './mcp-skill-catalog'

export class AgentContextEnricher {
  constructor(private catalog: McpSkillCatalog) {}

  generateMcpContextBlock(): string {
    return this.catalog.toMarkdown()
  }

  generateToolSuggestions(taskDescription: string): string {
    return this.catalog.generateTaskSuggestions(taskDescription)
  }
}
