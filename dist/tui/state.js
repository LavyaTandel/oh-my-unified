const state = {
    agents: {},
    messages: [],
    health: { agentCount: 0, toolCount: 0, mcpCount: 0, status: 'healthy' },
};
const subscribers = new Set();
export function getTuiState() {
    return state;
}
export function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}
function notify() {
    const snapshot = { ...state, agents: { ...state.agents }, messages: [...state.messages] };
    for (const fn of subscribers) {
        try {
            fn(snapshot);
        }
        catch { /* ignore */ }
    }
}
export function updateAgentModel(agentName, model, displayName, role) {
    const existing = state.agents[agentName];
    state.agents[agentName] = {
        name: agentName,
        model,
        displayName: displayName ?? existing?.displayName,
        status: existing?.status ?? 'ready',
        role: role ?? existing?.role,
        lastActiveAt: existing?.lastActiveAt,
    };
    notify();
}
export function setAgentStatus(agentName, status) {
    if (state.agents[agentName]) {
        state.agents[agentName].status = status;
        state.agents[agentName].lastActiveAt = Date.now();
        notify();
    }
}
export function setActiveAgent(agentName) {
    state.activeAgent = agentName;
    notify();
}
export function addMessage(role, content, agent) {
    state.messages.push({ role, content, agent, timestamp: Date.now() });
    if (state.messages.length > 100) {
        state.messages = state.messages.slice(-100);
    }
    notify();
}
export function updateHealth(health) {
    state.health = health;
    notify();
}
export function setSessionId(id) {
    state.sessionId = id;
    notify();
}
//# sourceMappingURL=state.js.map