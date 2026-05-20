export interface CatalogEntry {
    category: 'mcp' | 'gstack-skill' | 'builtin';
    name: string;
    description: string;
    triggers: string[];
    serverName?: string;
    /** 'discovered' when read from the user's live config/skills, 'default' when from built-in fallback */
    source: 'discovered' | 'default';
}
export interface McpSkillCatalogOptions {
    /** Path to opencode.json (default: ~/.config/opencode/opencode.json) */
    opencodeConfigPath?: string;
    /** Path to opencode skills dir (default: ~/.config/opencode/skills) */
    opencodeSkillsPath?: string;
    /** Path to claude skills dir (default: ~/.claude/skills) */
    claudeSkillsPath?: string;
}
export declare class McpSkillCatalog {
    private options?;
    private entries;
    constructor(options?: McpSkillCatalogOptions | undefined);
    private initialize;
    getAll(): CatalogEntry[];
    findByTrigger(text: string): CatalogEntry[];
    findByCategory(cat: string): CatalogEntry[];
    toMarkdown(): string;
    generateTaskSuggestions(description: string): string;
    private configPath;
    /**
     * Read MCP servers from the user's opencode.json.
     * Returns an empty array if the file doesn't exist or has no MCP section.
     */
    readUserConfig(): CatalogEntry[];
    private skillsPaths;
    /**
     * Scan the user's skill directories on disk.
     * Returns discovered CatalogEntry[] or empty array if nothing found.
     */
    scanUserSkills(): CatalogEntry[];
    private scanSkillDir;
    private addEntry;
    private loadDefaultMcps;
    private loadDefaultSkills;
    private loadBuiltins;
}
//# sourceMappingURL=mcp-skill-catalog.d.ts.map