import type { AgentConfig } from './index'

// TUI sidebar agent definitions for OpenCode's plugin sidebar
// Each primary agent gets a visible entry with status indicators

export interface TuiAgentEntry {
  id: string
  label: string
  description: string
  status: 'idle' | 'active' | 'busy' | 'error'
  model: string
}

export function buildTuiAgentList(agents: AgentConfig[]): TuiAgentEntry[] {
  return agents
    .filter(a => a.isPrimary)
    .map(a => ({
      id: a.name,
      label: a.displayName,
      description: a.description,
      status: 'idle' as const,
      model: a.model,
    }))
}
