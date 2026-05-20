import { getAgent } from '../agent-commands';
export class RoleEnforcer {
    // Check if an agent is allowed to perform an action
    checkPermission(agentName, action) {
        const agent = getAgent(agentName);
        if (!agent)
            return { agentName, violation: 'Unknown agent', blocked: true };
        switch (agent.role) {
            case 'Strategist': // Odin — can do everything
                return { agentName, violation: '', blocked: false };
            case 'Orchestrator': // Njord — can delegate and read
                if (action === 'edit')
                    return { agentName, violation: 'Orchestrators cannot edit files directly', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Advisor': // Mimir — read-only (but can research)
                if (action !== 'read' && action !== 'research')
                    return { agentName, violation: 'Advisors are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Mapper': // Vidar — read + research
                if (action === 'edit')
                    return { agentName, violation: 'Mappers cannot edit', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Builder': // Thor — can edit and delegate
                return { agentName, violation: '', blocked: false };
            case 'Analyst': // Frigg — read + research
                if (action === 'edit' || action === 'delegate')
                    return { agentName, violation: 'Analysts are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Critic': // Tyr — read-only review
                if (action !== 'read' && action !== 'research')
                    return { agentName, violation: 'Critics are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Runner': // Hermod — execute only
                if (action === 'delegate')
                    return { agentName, violation: 'Runners cannot delegate', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Artisan': // Freyr — can edit and research
                return { agentName, violation: '', blocked: false };
            case 'Deliberator': // Forseti — read + delegate (to council)
                if (action === 'edit')
                    return { agentName, violation: 'Deliberators cannot edit', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Voter': // Hod — read-only
                if (action !== 'read' && action !== 'research')
                    return { agentName, violation: 'Voters are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Follower': // Magni — read + edit, no delegate
                if (action === 'delegate')
                    return { agentName, violation: 'Followers cannot delegate', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Scout': // Sif — read-only search
                if (action !== 'read' && action !== 'research')
                    return { agentName, violation: 'Scouts are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Scholar': // Eir — read + research
                if (action === 'edit' || action === 'delegate')
                    return { agentName, violation: 'Scholars are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            case 'Watcher': // Heimdall — read-only visual analysis
                if (action !== 'read' && action !== 'research')
                    return { agentName, violation: 'Watchers are read-only', blocked: true };
                return { agentName, violation: '', blocked: false };
            default:
                return { agentName, violation: '', blocked: false };
        }
    }
    // Check if agent can delegate to another agent
    canDelegate(fromAgent, toAgent) {
        const agent = getAgent(fromAgent);
        if (!agent)
            return { agentName: fromAgent, violation: 'Unknown agent', blocked: true };
        if (!agent.canDelegate)
            return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate`, blocked: true };
        if (agent.delegatableAgents && !agent.delegatableAgents.includes(toAgent)) {
            return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate to ${toAgent}`, blocked: true };
        }
        return { agentName: fromAgent, violation: '', blocked: false };
    }
}
//# sourceMappingURL=index.js.map