export interface McpTier {
  name: 'built-in' | 'project' | 'skill-embedded';
  priority: number; // 1=highest, 3=lowest
  servers: string[];
}

// 3-Tier MCP System
// Tier 1: Built-in MCPs (shipped with plugin) — always available
// Tier 2: Project .mcp.json — per-project configuration
// Tier 3: Skill-embedded MCPs — loaded from skills

export const BUILT_IN_MCPS = [
  { name: 'websearch', type: 'remote' as const, url: 'https://mcp.exa.ai/mcp' },
  { name: 'context7', type: 'remote' as const, url: 'https://mcp.context7.com/mcp' },
  { name: 'grep_app', type: 'remote' as const, url: 'https://mcp.grep.app' },
];

export class McpTierManager {
  private tiers: McpTier[] = [
    { name: 'built-in', priority: 1, servers: BUILT_IN_MCPS.map((m) => m.name) },
    { name: 'project', priority: 2, servers: [] },
    { name: 'skill-embedded', priority: 3, servers: [] },
  ];

  registerProjectMCPs(mcps: string[]): void {
    const tier = this.tiers.find((t) => t.name === 'project');
    if (tier) tier.servers = mcps;
  }

  registerSkillMCPs(mcps: string[]): void {
    const tier = this.tiers.find((t) => t.name === 'skill-embedded');
    if (tier) tier.servers = mcps;
  }

  getAllServers(): string[] {
    return this.tiers
      .sort((a, b) => a.priority - b.priority)
      .flatMap((t) => t.servers);
  }

  getTier(name: McpTier['name']): McpTier | undefined {
    return this.tiers.find((t) => t.name === name);
  }
}
