// Our own /commands — NOT copied from openagent or slim
// These are commands that OUR unified plugin provides

import { PipelineOrchestrator } from '../pipeline'

// Create a single pipeline instance
let _pipeline: PipelineOrchestrator | null = null

export function getPipeline(): PipelineOrchestrator {
  if (!_pipeline) _pipeline = new PipelineOrchestrator()
  return _pipeline
}

export type UnifiedCommand = {
  name: string
  description: string
  template: string
  action?: () => Promise<string | void>
}

// Each command is now an action on the pipeline
export const UNIFIED_COMMANDS: Record<string, UnifiedCommand> = {
  plan: {
    name: 'plan',
    description: 'Run full pipeline — Assess→Assemble→Improvise→Act',
    template: `Run the complete pipeline:
1. /assess — Odin interviews and researches
2. /assemble — Vidar maps, Forseti deliberates
3. /improvise — Tyr reviews, Mimir validates
4. /act — Thor builds, Hermod implements`,
    action: async () => {
      const p = getPipeline()
      await p.runFullPipeline('Full project analysis')
      return p.synthesize()
    }
  },
  assess: {
    name: 'assess',
    description: 'Start requirements assessment — Odin deploys recon swarm',
    template: `Odin deploys parallel recon:
- MCPs scan project structure
- @Frigg analyzes gaps
- @Mimir reviews architecture
- User questions fill remaining gaps`,
    action: async () => {
      const p = getPipeline()
      p.selectConductor('odin')
      await p.runPhase('assess')
      return 'Assessment in progress. Check kanban for status.'
    }
  },
  assemble: {
    name: 'assemble',
    description: 'Research deep — architecture, patterns, deliberation',
    template: `Research phase:
- @Vidar maps codebase
- @Sif searches patterns
- @Eir finds docs
- @Forseti deliberates approaches`
  },
  improvise: {
    name: 'improvise',
    description: 'Critique and refine the plan before execution',
    template: `Review phase:
- @Tyr reviews for flaws
- @Heimdall checks completeness
- @Mimir validates decisions`
  },
  act: {
    name: 'act',
    description: 'Execute with full force',
    template: `Execution phase:
- @Njord orchestrates
- @Thor builds
- @Hermod fixes
- @Freyr crafts UI`
  },
  synthesize: {
    name: 'synthesize',
    description: 'Deploy ALL agents, collect findings, synthesize into unified report',
    template: 'Fan out all agents, gather analysis, synthesize into one report with confidence tracking',
    action: async () => {
      const p = getPipeline()
      return p.synthesize()
    }
  },
  health: {
    name: 'health',
    description: 'Display system health dashboard with component status',
    template: 'Show the complete system health dashboard'
  },
  status: {
    name: 'status',
    description: 'Show current pipeline status and kanban progress',
    template: 'Show pipeline phase, completed tasks, and active sessions'
  },
}
