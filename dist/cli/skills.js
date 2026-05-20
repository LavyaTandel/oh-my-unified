export function getSkillPermissionsForAgent(agentName, config) {
    const override = config?.agents?.[agentName];
    if (override?.skills) {
        return override.skills;
    }
    return undefined;
}
//# sourceMappingURL=skills.js.map