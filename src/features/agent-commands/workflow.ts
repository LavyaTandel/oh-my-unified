export const WORKFLOW_PHASES = {
  ASSESS: { name: 'assess', description: 'Understand requirements', agents: ['odin', 'frigg', 'mimir'] },
  ASSEMBLE: { name: 'assemble', description: 'Structure approach', agents: ['vidar', 'eir', 'sif', 'forseti'] },
  ACT: { name: 'act', description: 'Execute plan', agents: ['njord', 'thor', 'hermod', 'freyr'] },
  IMPROVISE: { name: 'improvise', description: 'Review and adapt', agents: ['tyr', 'heimdall', 'mimir'] },
} as const
