import type { McpServerConfig, McpHealthStatus } from './types';
export type { McpServerConfig, McpHealthStatus };
export declare const DEFAULT_MCP_SERVERS: McpServerConfig[];
export declare class McpBus {
    private servers;
    private healthStatuses;
    private healthInterval;
    private processes;
    private reconnectAttempts;
    private readonly MAX_RECONNECT_ATTEMPTS;
    private readonly HEALTH_PING_TIMEOUT_MS;
    constructor(serverConfigs?: McpServerConfig[]);
    registerServer(config: McpServerConfig): void;
    private spawnLocalMcp;
    private connectRemoteMcp;
    private pingServer;
    connectAll(): Promise<McpHealthStatus[]>;
    healthCheck(): Promise<McpHealthStatus[]>;
    getOnlineServers(): McpServerConfig[];
    getHealth(serverName: string): McpHealthStatus | undefined;
    startHealthMonitor(intervalMs?: number): void;
    stopHealthMonitor(): void;
    shutdown(): void;
}
//# sourceMappingURL=index.d.ts.map