export function recordTuiAgentModel(state, agentName, model, displayName) {
    state.agents[agentName] = { model, displayName };
}
export function recordTuiAgentModels(state, agents) {
    Object.assign(state.agents, agents);
}
//# sourceMappingURL=tui-state.js.map