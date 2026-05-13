// Capability requirements for each agent
export interface AgentModelRequirements {
  agentName: string
  reasoning: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10  // 10 = needs highest reasoning
  speed: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10       // 10 = needs fastest response
  creativity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10   // 10 = needs most creative
  context: 'small' | 'medium' | 'large' | 'xlarge'      // context window needed
}

// A model known to the system
export interface ModelInfo {
  id: string
  provider: string
  capabilities: {
    reasoning: number
    speed: number
    creativity: number
    context: 'small' | 'medium' | 'large' | 'xlarge'
  }
  available: boolean  // is this model connected/usable?
}

// Routing result
export interface ModelRoute {
  agentName: string
  assignedModel: string
  fallbackUsed: boolean
  reason: string
}
