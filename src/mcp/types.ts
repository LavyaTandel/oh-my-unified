export type McpName = 'websearch' | 'context7' | 'grep_app';

export interface McpConfig {
  name: string;
  type: 'mcp';
  command: string;
  args: string[];
  env: Record<string, string>;
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