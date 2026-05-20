export interface AgentModelRequirements {
    agentName: string;
    reasoning: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    speed: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    creativity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    context: 'small' | 'medium' | 'large' | 'xlarge';
}
export interface ModelInfo {
    id: string;
    provider: string;
    capabilities: {
        reasoning: number;
        speed: number;
        creativity: number;
        context: 'small' | 'medium' | 'large' | 'xlarge';
    };
    available: boolean;
}
export interface ModelRoute {
    agentName: string;
    assignedModel: string;
    fallbackUsed: boolean;
    reason: string;
}
//# sourceMappingURL=types.d.ts.map