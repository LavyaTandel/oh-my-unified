export interface McpServerConfig {
  name: string;
  type: 'local' | 'remote';
  command?: string[];   // For local MCPs
  url?: string;         // For remote MCPs
  enabled: boolean;
}

export interface McpHealthStatus {
  server: string;
  online: boolean;
  lastCheck: number;
  error?: string;
}

export interface McpToolInfo {
  serverName: string;
  toolName: string;
  description: string;
}
