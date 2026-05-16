export type McpName = 'websearch' | 'context7' | 'grep_app' | 'clawdi' | 'gbrain' | 'context-mode' | 'code-review-graph' | 'gitnexus' | 'loom-mcp' | 'openspace' | 'exa' | 'gh_grep' | 'deepwiki' | 'sequential-thinking' | 'agent-browser';

export interface McpConfig {
  name: string;
  type: 'mcp' | 'stdio' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface LocalMcpConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface RemoteMcpConfig {
  url: string;
  headers?: Record<string, string>;
}