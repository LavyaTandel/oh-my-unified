export function buildTuiAgentList(agents) {
    return agents
        .filter(a => a.isPrimary)
        .map(a => ({
        id: a.name,
        label: a.displayName,
        description: a.description,
        status: 'idle',
        model: a.model,
    }));
}
//# sourceMappingURL=tui-integration.js.map