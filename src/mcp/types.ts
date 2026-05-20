export type McpName = 'websearch' | 'context7' | 'grep_app' | 'clawdi' | 'gbrain' | 'context-mode' | 'code-review-graph' | 'gitnexus' | 'loom-mcp' | 'openspace' | 'exa' | 'gh_grep' | 'deepwiki' | 'sequential-thinking' | 'agent-browser';

/**
 * OpenCode SDK MCP config shape — mirrors @opencode-ai/sdk Config.mcp
 * IMPORTANT: Must be { type: "local", command: Array<string>, environment?, enabled? }
 *            NOT { name, type: "stdio", command, args, env }
 */
export type McpConfig = McpLocalConfig | McpRemoteConfig;

export interface McpLocalConfig {
  type: 'local';
  command: string[];
  environment?: Record<string, string>;
  enabled?: boolean;
  timeout?: number;
}

export interface McpRemoteConfig {
  type: 'remote';
  url: string;
  enabled?: boolean;
  headers?: Record<string, string>;
}

/** Legacy internal shape — used internally, NOT sent to OpenCode */
export interface McpServerConfig {
  name: string;
  type?: 'local' | 'remote';
  command?: string[];
  url?: string;
}