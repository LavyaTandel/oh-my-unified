import type { McpServerConfig } from '../mcp-bus/types.js';
export interface DiscoveredMcp {
    name: string;
    type: 'local' | 'remote';
    command?: string[];
    url?: string;
    enabled: boolean;
    source: 'discovered' | 'default';
}
/**
 * Read MCP servers from the user's opencode.json.
 * Returns discovered MCP configs or empty array if file doesn't exist.
 */
export declare function discoverUserMcps(configPath?: string): DiscoveredMcp[];
/**
 * Merge discovered MCPs with default servers.
 * Discovered MCPs override defaults with the same name.
 * Defaults are kept as fallback for MCPs not in user config.
 */
export declare function mergeMcpConfigs(discovered: DiscoveredMcp[], defaults: McpServerConfig[]): McpServerConfig[];
//# sourceMappingURL=mcp-discovery.d.ts.map