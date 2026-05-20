export interface TuiAgent {
    name: string;
    model: string;
    displayName?: string;
    status: 'ready' | 'busy' | 'error';
    role?: string;
    lastActiveAt?: number;
}
export interface TuiMessage {
    role: string;
    content: string;
    agent?: string;
    timestamp: number;
}
export interface TuiState {
    agents: Record<string, TuiAgent>;
    activeAgent?: string;
    messages: TuiMessage[];
    health: {
        agentCount: number;
        toolCount: number;
        mcpCount: number;
        status: 'healthy' | 'warning' | 'critical';
    };
    sessionId?: string;
}
export declare function getTuiState(): TuiState;
export declare function subscribe(fn: (s: TuiState) => void): () => void;
export declare function updateAgentModel(agentName: string, model: string, displayName?: string, role?: string): void;
export declare function setAgentStatus(agentName: string, status: TuiAgent['status']): void;
export declare function setActiveAgent(agentName: string): void;
export declare function addMessage(role: string, content: string, agent?: string): void;
export declare function updateHealth(health: TuiState['health']): void;
export declare function setSessionId(id: string): void;
//# sourceMappingURL=state.d.ts.map