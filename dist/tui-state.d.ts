export interface TuiState {
    agents: Record<string, {
        model: string;
        displayName?: string;
    }>;
}
export declare function recordTuiAgentModel(state: TuiState, agentName: string, model: string, displayName?: string): void;
export declare function recordTuiAgentModels(state: TuiState, agents: Record<string, {
    model: string;
    displayName?: string;
}>): void;
//# sourceMappingURL=tui-state.d.ts.map