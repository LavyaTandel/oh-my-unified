import { spawn, type ChildProcess } from 'node:child_process';
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
  { name: 'exa', type: 'remote', url: 'https://mcp.exa.ai/mcp', enabled: true },
  { name: 'gh_grep', type: 'remote', url: 'https://mcp.grep.app', enabled: true },
  { name: 'deepwiki', type: 'local', command: ['npx', '-y', '@opencode-ai/deepwiki-mcp'], enabled: true },
  { name: 'sequential-thinking', type: 'local', command: ['npx', '-y', '@opencode-ai/sequential-thinking-mcp'], enabled: true },
  { name: 'agent-browser', type: 'local', command: ['npx', '-y', '@opencode-ai/agent-browser-mcp'], enabled: true },
];

interface ServerProcess {
  process: ChildProcess;
}

export class McpBus {
  private servers: Map<string, McpServerConfig>;
  private healthStatuses: Map<string, McpHealthStatus>;
  private healthInterval: ReturnType<typeof setInterval> | null;
  private processes: Map<string, ServerProcess>;
  private reconnectAttempts: Map<string, number>;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly HEALTH_PING_TIMEOUT_MS = 5000;

  constructor(serverConfigs?: McpServerConfig[]) {
    this.servers = new Map();
    this.healthStatuses = new Map();
    this.healthInterval = null;
    this.processes = new Map();
    this.reconnectAttempts = new Map();

    if (serverConfigs) {
      for (const config of serverConfigs) {
        this.servers.set(config.name, config);
      }
    }
  }

  registerServer(config: McpServerConfig): void {
    this.servers.set(config.name, config);
  }

  private async spawnLocalMcp(config: McpServerConfig): Promise<ServerProcess> {
    if (!config.command || config.command.length === 0) {
      throw new Error(`No command specified for local MCP server: ${config.name}`);
    }

    const [cmd, ...args] = config.command;
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    if (!child.stdin || !child.stdout) {
      child.kill();
      throw new Error(`Failed to spawn subprocess for MCP server: ${config.name}`);
    }

    child.on('error', (err) => {
      const status: McpHealthStatus = {
        server: config.name,
        online: false,
        lastCheck: Date.now(),
        error: `subprocess error: ${err.message}`,
      };
      this.healthStatuses.set(config.name, status);
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        const status: McpHealthStatus = {
          server: config.name,
          online: false,
          lastCheck: Date.now(),
          error: `subprocess exited with code ${code}`,
        };
        this.healthStatuses.set(config.name, status);
        this.processes.delete(config.name);
      }
    });

    return { process: child };
  }

  private async connectRemoteMcp(config: McpServerConfig): Promise<void> {
    if (!config.url) {
      throw new Error(`No URL specified for remote MCP server: ${config.name}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.HEALTH_PING_TIMEOUT_MS);

    try {
      const response = await fetch(config.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'text/event-stream' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pingServer(name: string, config: McpServerConfig): Promise<boolean> {
    if (config.type === 'local') {
      const existing = this.processes.get(name);
      if (existing && !existing.process.killed) {
        return true;
      }

      try {
        const proc = await this.spawnLocalMcp(config);
        this.processes.set(name, proc);
        this.reconnectAttempts.set(name, 0);
        return true;
      } catch (err) {
        const attempts = (this.reconnectAttempts.get(name) ?? 0) + 1;
        this.reconnectAttempts.set(name, attempts);
        throw err;
      }
    } else {
      return this.connectRemoteMcp(config).then(() => true);
    }
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
        const online = await this.pingServer(name, config);
        const status: McpHealthStatus = {
          server: name,
          online,
          lastCheck: Date.now(),
        };
        this.healthStatuses.set(name, status);
        results.push(status);
      } catch (err) {
        const attempts = this.reconnectAttempts.get(name) ?? 0;
        const status: McpHealthStatus = {
          server: name,
          online: false,
          lastCheck: Date.now(),
          error: err instanceof Error ? err.message : String(err),
        };
        this.healthStatuses.set(name, status);
        results.push(status);

        if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
          setTimeout(async () => {
            try {
              await this.pingServer(name, config);
              this.healthStatuses.set(name, {
                server: name,
                online: true,
                lastCheck: Date.now(),
              });
            } catch {
              // Reconnect failed — will retry on next health check cycle
            }
          }, Math.min(1000 * Math.pow(2, attempts), 30000));
        }
      }
    }

    return results;
  }

  async healthCheck(): Promise<McpHealthStatus[]> {
    const results: McpHealthStatus[] = [];
    const now = Date.now();

    for (const [name, config] of this.servers) {
      if (!config.enabled) continue;

      try {
        if (config.type === 'local') {
          const proc = this.processes.get(name);
          if (proc && !proc.process.killed) {
            results.push({ server: name, online: true, lastCheck: now });
          } else {
            await this.pingServer(name, config);
            results.push({ server: name, online: true, lastCheck: Date.now() });
          }
        } else {
          await this.connectRemoteMcp(config);
          results.push({ server: name, online: true, lastCheck: Date.now() });
        }
      } catch (err) {
        results.push({
          server: name,
          online: false,
          lastCheck: Date.now(),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return results;
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
    for (const [name, proc] of this.processes) {
      proc.process.kill();
    }
    this.processes.clear();
    this.servers.clear();
    this.healthStatuses.clear();
    this.reconnectAttempts.clear();
  }
}
