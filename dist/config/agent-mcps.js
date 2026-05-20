export function getAgentMcpList(agentName, config) {
    const override = config?.agents?.[agentName];
    if (override && Array.isArray(override.mcps)) {
        return override.mcps;
    }
    return undefined;
}
export function getSkillPermissionsForAgent(agentName, config) {
    const override = config?.agents?.[agentName];
    if (override?.skills) {
        return override.skills;
    }
    return undefined;
}
//# sourceMappingURL=agent-mcps.js.map