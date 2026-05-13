import type { McpServerConfig, McpHealthStatus } from './types';

export type { McpServerConfig, McpHealthStatus };

export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  { name: 'clawdi', type: 'local', command: ['npx', '-y', '@opencode-ai/clawdi-mcp'], enabled: true },
  { name: 'gbrain', type: 'local', command: ['npx', '-y', 'gbrain-mcp'], enabled: true },
  { name: 'context-mode', type: 'local', command: ['npx', '-y', '@opencode-ai/context-mode-mcp'], enabled: true },
  { name: 'code-review-graph', type: 'local', command: ['npx', '-y', 'code-review-graph-mcp'], enabled: true },
  { name: 'gitnexus', type: 'local', command: ['npx', '-y', 'gitnexus-mcp'], enabled: true },
  { name: 'loom-mcp', type: 'local', command: ['npx', '-y', '@opencode-ai/loom-mcp'], enabled: true },
  { name: 'openspace', type: 'local', command: ['npx', '-y', '@opencode-ai/openspace-mcp'], enabled: true },
  { name: 'context7', type: 'local', command: ['npx', '-y', '@opencode-ai/context7-mcp'], enabled: true },
  { name: 'exa', type: 'local', command: ['npx', '-y', '@opencode-ai/exa-mcp'], enabled: true },
  { name: 'gh_grep', type: 'local', command: ['npx', '-y', '@opencode-ai/gh-grep-mcp'], enabled: true },
  { name: 'deepwiki', type: 'local', command: ['npx', '-y', '@opencode-ai/deepwiki-mcp'], enabled: true },
  { name: 'sequential-thinking', type: 'local', command: ['npx', '-y', '@opencode-ai/sequential-thinking-mcp'], enabled: true },
  { name: 'agent-browser', type: 'local', command: ['npx', '-y', '@opencode-ai/agent-browser-mcp'], enabled: true },
];

export class McpBus {
  private servers: Map<string, McpServerConfig>;
  private healthStatuses: Map<string, McpHealthStatus>;
  private healthInterval: ReturnType<typeof setInterval> | null;

  constructor(serverConfigs?: McpServerConfig[]) {
    this.servers = new Map();
    this.healthStatuses = new Map();
    this.healthInterval = null;

    if (serverConfigs) {
      for (const config of serverConfigs) {
        this.servers.set(config.name, config);
      }
    }
  }

  registerServer(config: McpServerConfig): void {
    this.servers.set(config.name, config);
  }

  async connectAll(): Promise<McpHealthStatus[]> {
    const results: McpHealthStatus[] = [];
    const now = Date.now();

    for (const [name, config] of this.servers) {
      if (!config.enabled) {
        const status: McpHealthStatus = {
          server: name,
          online: false,
          lastCheck: now,
          error: 'server disabled',
        };
        this.healthStatuses.set(name, status);
        results.push(status);
        continue;
      }

      try {
        // For now, just mark as "connection attempted"
        // Actual subprocess spawning (local) or SSE/HTTP (remote) comes in Wave 2
        const status: McpHealthStatus = {
          server: name,
          online: true,
          lastCheck: now,
        };
        this.healthStatuses.set(name, status);
        results.push(status);
      } catch (err) {
        const status: McpHealthStatus = {
          server: name,
          online: false,
          lastCheck: now,
          error: err instanceof Error ? err.message : String(err),
        };
        this.healthStatuses.set(name, status);
        results.push(status);
      }
    }

    return results;
  }

  async healthCheck(): Promise<McpHealthStatus[]> {
    return this.connectAll();
  }

  getOnlineServers(): McpServerConfig[] {
    const online: McpServerConfig[] = [];
    for (const [name, config] of this.servers) {
      const health = this.healthStatuses.get(name);
      if (health?.online && config.enabled) {
        online.push(config);
      }
    }
    return online;
  }

  getHealth(serverName: string): McpHealthStatus | undefined {
    return this.healthStatuses.get(serverName);
  }

  startHealthMonitor(intervalMs: number = 30000): void {
    if (this.healthInterval) return;

    this.healthInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch {
        // silent — health check errors are captured per-server
      }
    }, intervalMs);
  }

  stopHealthMonitor(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  shutdown(): void {
    this.stopHealthMonitor();
    this.servers.clear();
    this.healthStatuses.clear();
  }
}
