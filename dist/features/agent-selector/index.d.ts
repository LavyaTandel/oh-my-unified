import type { AgentConfig } from '../agent-commands';
export interface AgentMetadata extends AgentConfig {
    currentModel: string;
    modelCapabilities: string[];
    assignedMCPs: string[];
    healthStatus: 'healthy' | 'degraded' | 'error';
    lastActiveAt: number;
    errorRate: number;
    sessionCount: number;
}
export interface AgentSuggestion {
    agent: AgentMetadata;
    relevance: number;
    reason: string;
}
export declare class AgentSelector {
    private metadata;
    private modelCapabilities;
    private agentMCPs;
    private agentHealth;
    private lastSuggestionTime;
    private suggestionCooldownMs;
    registerAgent(agent: AgentConfig): void;
    setModelCapabilities(agentName: string, capabilities: string[]): void;
    setAssignedMCPs(agentName: string, mcps: string[]): void;
    recordSuccess(agentName: string): void;
    recordError(agentName: string): void;
    getAgentList(): AgentMetadata[];
    getAgentByMention(mention: string): AgentMetadata | undefined;
    getSuggestions(context: string, sessionId?: string): AgentSuggestion[];
    getSlashCommandOutput(): string;
    getStats(): {
        total: number;
        healthy: number;
        degraded: number;
        error: number;
    };
}
export declare function createAgentSelector(): AgentSelector;
//# sourceMappingURL=index.d.ts.map