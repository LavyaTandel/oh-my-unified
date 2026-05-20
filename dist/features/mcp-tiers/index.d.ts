export interface McpTier {
    name: 'built-in' | 'project' | 'skill-embedded';
    priority: number;
    servers: string[];
}
export declare const BUILT_IN_MCPS: {
    name: string;
    type: "remote";
    url: string;
}[];
export declare class McpTierManager {
    private tiers;
    registerProjectMCPs(mcps: string[]): void;
    registerSkillMCPs(mcps: string[]): void;
    getAllServers(): string[];
    getTier(name: McpTier['name']): McpTier | undefined;
}
//# sourceMappingURL=index.d.ts.map