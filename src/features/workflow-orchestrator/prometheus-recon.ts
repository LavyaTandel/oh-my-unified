import type { KnowledgeArea, ConfidenceLevel } from './types'

// Recon deploys a swarm of scouts for parallel information gathering
export interface ReconTask {
  target: string                    // what to investigate
  tool: 'mcp' | 'subagent' | 'skill' | 'user-question'
  /** Generic purpose — McpSkillCatalog resolves to actual MCP at runtime */
  purpose?: string                  // e.g. 'project-structure', 'stored-knowledge', 'code-patterns'
  subagentName?: string             // which sub-agent (@sif, @eir)
  skillName?: string                // which skill
  question?: string                 // question to ask user
  priority: 'high' | 'medium' | 'low'
}

// Execution plan for each workflow phase — maps to the /commands
// NOTE: MCP resolution happens at RUNTIME via McpSkillCatalog.
// The plan only describes WHAT to do — the system discovers WHICH MCP
// to use based on purpose matching. Subagents use `target` (human-readable
// name); MCP tasks use `purpose` (generic, resolved at runtime).
export function getPhaseExecutionPlan(phase: string) {
  const plans: Record<string, {
    description: string
    parallel?: Array<{ tool: string; purpose?: string; target?: string; action: string }>
    sequential?: Array<{ tool: string; purpose?: string; target?: string; action: string }>
    conditionalDelegation?: Array<{ if: string; then: string }>
    confidenceGate?: number
    userSatisfactionGate?: boolean
  }> = {
    assess: {
      description: 'Deploy recon swarm — gather all available context',
      parallel: [
        { tool: 'mcp', purpose: 'project-structure', action: 'Discover project structure and topology' },
        { tool: 'mcp', purpose: 'code-patterns', action: 'Analyze code communities and dependency flows' },
        { tool: 'mcp', purpose: 'stored-knowledge', action: 'Search existing project knowledge' },
        { tool: 'mcp', purpose: 'session-history', action: 'Check cross-session context and memory' },
        { tool: 'mcp', purpose: 'personal-notes', action: 'Search user notes and documents' },
      ],
      conditionalDelegation: [
        { if: 'codebase unclear', then: '@Sif deep search' },
        { if: 'docs needed', then: '@Eir doc lookup' },
      ],
      confidenceGate: 6,
    },
    assemble: {
      description: 'Research deep — architecture, patterns, deliberation',
      parallel: [
        { tool: 'subagent', target: '@Vidar', action: 'map architecture' },
        { tool: 'subagent', target: '@Eir', action: 'find relevant docs' },
        { tool: 'subagent', target: '@Sif', action: 'search for examples' },
        { tool: 'subagent', target: '@Forseti', action: 'deliberate approaches' },
      ],
      confidenceGate: 8,
    },
    improvise: {
      description: 'Critique the plan before execution',
      parallel: [
        { tool: 'subagent', target: '@Tyr', action: 'find flaws' },
        { tool: 'subagent', target: '@Heimdall', action: 'check for missed items' },
        { tool: 'subagent', target: '@Mimir', action: 'validate decisions' },
      ],
      userSatisfactionGate: true,
    },
    act: {
      description: 'Execute with full force',
      sequential: [
        { tool: 'subagent', target: '@Njord', action: 'orchestrate execution' },
        { tool: 'subagent', target: '@Thor', action: 'build implementation' },
        { tool: 'subagent', target: '@Hermod', action: 'implement scoped tasks' },
        { tool: 'subagent', target: '@Freyr', action: 'craft UI' },
      ],
    },
  }
  return plans[phase] || null
}

export class PrometheusRecon {
  private tasks: ReconTask[] = []
  private gatheredKnowledge: Map<string, string[]> = new Map()

  // Generate recon tasks based on what we know and don't know
  planRecon(knownAreas: KnowledgeArea[], _projectHint?: string): ReconTask[] {
    this.tasks = []

    // Always check these via MCPs first (free, no user effort)
    // NOTE: This uses GENERIC purposes — McpSkillCatalog resolves to
    // the user's actual installed MCPs at runtime by purpose matching,
    // so the plugin source has zero hardcoded MCP names.
    this.addTask('codebase-structure', 'mcp', 'project-structure', 'Map the full project structure using available tools')
    this.addTask('codebase-patterns', 'mcp', 'code-patterns', 'Analyze code communities and flows')
    this.addTask('existing-knowledge', 'mcp', 'stored-knowledge', 'Search for stored project context')
    this.addTask('user-history', 'mcp', 'session-history', 'Check cross-session memory for this project')
    this.addTask('personal-notes', 'mcp', 'personal-notes', 'Search user vault for relevant notes')

    // If codebase structure is fuzzy, deploy sub-agents
    if (this.needsMoreInfo(knownAreas, 'codebase-structure', 5)) {
      this.addTask('explore-api-routes', 'subagent', 'sif', 'Find all API routes and patterns')
      this.addTask('explore-dependencies', 'subagent', 'sif', 'Map dependency tree')
      this.addTask('find-docs', 'subagent', 'eir', 'Find docs for key dependencies')
    }

    // If architecture is unclear, deploy deeper
    if (this.needsMoreInfo(knownAreas, 'architecture', 6)) {
      this.addTask('architecture-review', 'subagent', 'vidar', 'Generate codemap of project')
      this.addTask('design-patterns', 'mcp', 'reasoning', 'Reason about architecture trade-offs')
    }

    return this.tasks
  }

  /**
   * Generate targeted questions for the user when knowledge gaps remain.
   * @param gathered  - knowledge gathered so far (area → info[])
   * @param knownAreas - area names the system is confident about
   * @returns an array of question strings to ask the user
   */
  generateQuestions(
    gathered: Map<string, string[]>,
    knownAreas: string[],
  ): string[] {
    const questions: string[] = []
    const knownSet = new Set(knownAreas)

    if (!knownSet.has('project-purpose')) {
      questions.push('What is the purpose of this project?')
    }

    if (!knownSet.has('codebase-structure')) {
      questions.push('Can you describe the project structure?')
    }

    if (!knownSet.has('tech-stack')) {
      questions.push('What tech stack is this project using?')
    }

    // If we discovered routes, ask for clarification about their purpose
    const routes = gathered.get('api-routes')
    if (routes && routes.length > 0) {
      questions.push(
        'I found API routes in the project. Could you clarify what domain ' +
        'this project serves so I can better understand the route patterns?',
      )
    }

    return questions
  }

  // Execute all recon tasks in parallel (conceptually)
  // Returns gathered info organized by area
  async executeRecon(tasks: ReconTask[]): Promise<Map<string, string[]>> {
    // Each task maps to a specific execution:
    for (const task of tasks) {
      switch (task.tool) {
        case 'mcp':
          // "Use the MCP tool to get information"
          break
        case 'subagent':
          // "Delegate to @sif or @eir"
          break
      }
    }
    return this.gatheredKnowledge
  }

  // Check if a knowledge area needs more information
  private needsMoreInfo(knownAreas: KnowledgeArea[], areaName: string, threshold: number): boolean {
    const area = knownAreas.find(a => a.area === areaName)
    return !area || area.confidence < threshold
  }

  private addTask(target: string, tool: ReconTask['tool'], purposeOrAgent: string, description: string): void {
    const task: ReconTask = {
      target,
      tool,
      priority: 'medium',
    }
    if (tool === 'mcp') {
      task.purpose = purposeOrAgent       // generic purpose, resolved at runtime
      task.question = description
    } else if (tool === 'subagent') {
      task.subagentName = purposeOrAgent
      task.question = description
    }
    this.tasks.push(task)
  }
}
