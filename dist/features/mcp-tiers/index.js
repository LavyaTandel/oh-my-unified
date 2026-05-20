// 3-Tier MCP System
// Tier 1: Built-in MCPs (shipped with plugin) — always available
// Tier 2: Project .mcp.json — per-project configuration
// Tier 3: Skill-embedded MCPs — loaded from skills
export const BUILT_IN_MCPS = [
    { name: 'websearch', type: 'remote', url: 'https://mcp.exa.ai/mcp' },
    { name: 'context7', type: 'remote', url: 'https://mcp.context7.com/mcp' },
    { name: 'grep_app', type: 'remote', url: 'https://mcp.grep.app' },
];
export class McpTierManager {
    tiers = [
        { name: 'built-in', priority: 1, servers: BUILT_IN_MCPS.map((m) => m.name) },
        { name: 'project', priority: 2, servers: [] },
        { name: 'skill-embedded', priority: 3, servers: [] },
    ];
    registerProjectMCPs(mcps) {
        const tier = this.tiers.find((t) => t.name === 'project');
        if (tier)
            tier.servers = mcps;
    }
    registerSkillMCPs(mcps) {
        const tier = this.tiers.find((t) => t.name === 'skill-embedded');
        if (tier)
            tier.servers = mcps;
    }
    getAllServers() {
        return this.tiers
            .sort((a, b) => a.priority - b.priority)
            .flatMap((t) => t.servers);
    }
    getTier(name) {
        return this.tiers.find((t) => t.name === name);
    }
}
//# sourceMappingURL=index.js.map