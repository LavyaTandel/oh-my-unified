export interface SkillMcpConfig {
    name?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
}
export interface SkillMcpEntry {
    skillName: string;
    serverName: string;
    config: SkillMcpConfig;
}
export interface SkillMcpConnection {
    skillName: string;
    serverName: string;
    status: 'connecting' | 'connected' | 'error' | 'disconnected';
    error?: string;
    tools?: string[];
}
export declare class SkillMcpManager {
    private registry;
    private connections;
    register(skillName: string, serverName: string, config: SkillMcpConfig): void;
    unregister(skillName: string, serverName: string): void;
    connect(skillName: string, serverName: string): Promise<SkillMcpConnection>;
    disconnect(skillName: string, serverName: string): void;
    disconnectAll(skillName: string): void;
    getConnection(skillName: string, serverName: string): SkillMcpConnection | undefined;
    getAllConnections(): SkillMcpConnection[];
    getRegistry(): SkillMcpEntry[];
    parseSkillMcpYaml(yaml: string, skillName: string): SkillMcpConfig[];
    private discoverStdioTools;
    private discoverHttpTools;
    dispose(): void;
}
//# sourceMappingURL=index.d.ts.map