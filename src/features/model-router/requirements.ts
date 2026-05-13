import type { AgentModelRequirements } from './types'

// Each agent's capability requirements
// This is the ROUTING LOGIC — how we know which model an agent needs
export const AGENT_REQUIREMENTS: Record<string, AgentModelRequirements> = {
  // Primary agents
  prometheus:  { agentName: 'prometheus',  reasoning: 9,  speed: 5, creativity: 7, context: 'large' },
  sisyphus:    { agentName: 'sisyphus',    reasoning: 8,  speed: 6, creativity: 6, context: 'large' },
  oracle:      { agentName: 'oracle',      reasoning: 10, speed: 4, creativity: 5, context: 'large' },
  atlas:       { agentName: 'atlas',       reasoning: 8,  speed: 5, creativity: 4, context: 'xlarge' },
  hephaestus:  { agentName: 'hephaestus',  reasoning: 6,  speed: 8, creativity: 5, context: 'large' },
  council:     { agentName: 'council',     reasoning: 8,  speed: 3, creativity: 8, context: 'large' },
  metis:       { agentName: 'metis',       reasoning: 9,  speed: 4, creativity: 6, context: 'large' },
  momus:       { agentName: 'momus',       reasoning: 8,  speed: 4, creativity: 4, context: 'medium' },
  // Sub-agents
  explorer:    { agentName: 'explorer',    reasoning: 4,  speed: 9, creativity: 3, context: 'medium' },
  librarian:   { agentName: 'librarian',   reasoning: 5,  speed: 7, creativity: 4, context: 'medium' },
  designer:    { agentName: 'designer',    reasoning: 5,  speed: 6, creativity: 9, context: 'medium' },
  fixer:       { agentName: 'fixer',       reasoning: 5,  speed: 9, creativity: 3, context: 'medium' },
  observer:    { agentName: 'observer',    reasoning: 4,  speed: 6, creativity: 5, context: 'medium' },
  'sisyphus-junior': { agentName: 'sisyphus-junior', reasoning: 4, speed: 9, creativity: 3, context: 'small' },
  councillor:  { agentName: 'councillor',  reasoning: 7,  speed: 5, creativity: 6, context: 'medium' },
}
