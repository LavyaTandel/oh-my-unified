// Our own /commands — NOT copied from openagent or slim
// These are commands that OUR unified plugin provides

import { getPhaseExecutionPlan } from '../workflow-orchestrator/prometheus-recon'

export type UnifiedCommand = {
  name: string
  description: string
  template: string
  executionPlan?: ReturnType<typeof getPhaseExecutionPlan>
}

export const UNIFIED_COMMANDS: Record<string, UnifiedCommand> = {
  assess: {
    name: 'assess',
    description: 'Start requirements assessment (Odin + Frigg + Mimir)',
    template: 'Begin the ASSESS phase: interview user, research, identify gaps',
    executionPlan: getPhaseExecutionPlan('assess'),
  },
  assemble: {
    name: 'assemble',
    description: 'Structure approach and gather resources (Vidar + Eir + Forseti)',
    template: 'Begin the ASSEMBLE phase: map architecture, research, deliberate',
    executionPlan: getPhaseExecutionPlan('assemble'),
  },
  act: {
    name: 'act',
    description: 'Execute plan (Njord + Thor + Hermod + Freyr)',
    template: 'Begin the ACT phase: delegate tasks, implement, build',
    executionPlan: getPhaseExecutionPlan('act'),
  },
  improvise: {
    name: 'improvise',
    description: 'Review and adapt (Tyr + Heimdall + Mimir)',
    template: 'Begin the IMPROVISE phase: review output, check quality, fix issues',
    executionPlan: getPhaseExecutionPlan('improvise'),
  },
  status: {
    name: 'status',
    description: 'Show system health and agent activity',
    template: 'Report current system status from the SystemObserver',
  },
  plan: {
    name: 'plan',
    description: 'Full Assess→Assemble→Act→Improvise workflow',
    template: 'Run the complete planning and execution workflow',
  },
  synthesize: {
    name: 'synthesize',
    description: 'Deploy ALL agents, collect findings, synthesize into unified report',
    template: 'Fan out all agents, gather their analysis, synthesize into one report with confidence tracking',
  },
}

// Each command now includes the execution plan from the workflow orchestrator
export function getCommandPlan(commandName: string) {
  return getPhaseExecutionPlan(commandName)
}
