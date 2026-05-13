import type { AgentModelRequirements } from './types'

// Each agent's capability requirements
// This is the ROUTING LOGIC — how we know which model an agent needs
export const AGENT_REQUIREMENTS: Record<string, AgentModelRequirements> = {
  // Primary agents
  odin:    { agentName: 'odin',    reasoning: 9,  speed: 5, creativity: 7, context: 'large' },
  njord:   { agentName: 'njord',   reasoning: 8,  speed: 6, creativity: 6, context: 'large' },
  mimir:   { agentName: 'mimir',   reasoning: 10, speed: 4, creativity: 5, context: 'large' },
  vidar:   { agentName: 'vidar',   reasoning: 8,  speed: 5, creativity: 4, context: 'xlarge' },
  thor:    { agentName: 'thor',    reasoning: 6,  speed: 8, creativity: 5, context: 'large' },
  forseti: { agentName: 'forseti', reasoning: 8,  speed: 3, creativity: 8, context: 'large' },
  frigg:   { agentName: 'frigg',   reasoning: 9,  speed: 4, creativity: 6, context: 'large' },
  tyr:     { agentName: 'tyr',     reasoning: 8,  speed: 4, creativity: 4, context: 'medium' },
  // Sub-agents
  sif:     { agentName: 'sif',     reasoning: 4,  speed: 9, creativity: 3, context: 'medium' },
  eir:     { agentName: 'eir',     reasoning: 7,  speed: 4, creativity: 7, context: 'large' },
  freyr:   { agentName: 'freyr',   reasoning: 5,  speed: 6, creativity: 9, context: 'medium' },
  hermod:  { agentName: 'hermod',  reasoning: 5,  speed: 9, creativity: 3, context: 'medium' },
  heimdall:{ agentName: 'heimdall',reasoning: 4,  speed: 6, creativity: 5, context: 'medium' },
  magni:   { agentName: 'magni',   reasoning: 4,  speed: 9, creativity: 3, context: 'small' },
  hod:     { agentName: 'hod',     reasoning: 7,  speed: 5, creativity: 6, context: 'medium' },
}
