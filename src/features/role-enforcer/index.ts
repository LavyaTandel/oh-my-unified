import { getAgent } from '../agent-commands'

export interface RoleViolation {
  agentName: string
  violation: string
  blocked: boolean
}

export class RoleEnforcer {
  // Check if an agent is allowed to perform an action
  checkPermission(agentName: string, action: 'delegate' | 'edit' | 'read' | 'research'): RoleViolation {
    const agent = getAgent(agentName)
    if (!agent) return { agentName, violation: 'Unknown agent', blocked: true }

    // Role-based permission check
    switch (agent.role) {
      case 'Strategist':   // Odin — can do everything
        return { agentName, violation: '', blocked: false }
      case 'Orchestrator': // Njord — can delegate and read
        if (action === 'edit') return { agentName, violation: 'Orchestrators cannot edit files directly', blocked: true }
        return { agentName, violation: '', blocked: false }
      case 'Advisor':      // Mimir — read-only (but can research)
        if (action !== 'read' && action !== 'research') return { agentName, violation: 'Advisors are read-only', blocked: true }
        return { agentName, violation: '', blocked: false }
      case 'Mapper':       // Vidar — read + research
        if (action === 'edit') return { agentName, violation: 'Mappers cannot edit', blocked: true }
        return { agentName, violation: '', blocked: false }
      case 'Builder':      // Thor — can edit and delegate
        return { agentName, violation: '', blocked: false }
      case 'Runner':       // Hermod — execute only
        if (action === 'delegate') return { agentName, violation: 'Runners cannot delegate', blocked: true }
        return { agentName, violation: '', blocked: false }
      case 'Scout': case 'Scholar': case 'Watcher': // Read-only but can research
        if (action !== 'read' && action !== 'research') return { agentName, violation: `${agent.role}s are read-only`, blocked: true }
        return { agentName, violation: '', blocked: false }
      default:
        return { agentName, violation: '', blocked: false }
    }
  }

  // Check if agent can delegate to another agent
  canDelegate(fromAgent: string, toAgent: string): RoleViolation {
    const agent = getAgent(fromAgent)
    if (!agent) return { agentName: fromAgent, violation: 'Unknown agent', blocked: true }
    if (!agent.canDelegate) return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate`, blocked: true }
    if (agent.delegatableAgents && !agent.delegatableAgents.includes(toAgent)) {
      return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate to ${toAgent}`, blocked: true }
    }
    return { agentName: fromAgent, violation: '', blocked: false }
  }
}
