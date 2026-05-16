import { KanbanTracker, type KanbanTask } from '../kanban'
import { WorkflowEngine, getNextPhase } from '../workflow-orchestrator/workflow-engine'
import { RoleEnforcer } from '../role-enforcer'
import { getPhaseExecutionPlan } from '../workflow-orchestrator/prometheus-recon'
import { getAgent, type AgentConfig } from '../agent-commands'
import { TaskRegistry } from '../../persistence'

/**
 * A SubSession represents ANY agent deployed to work autonomously.
 * The user can WATCH what they do but CANNOT interact.
 *
 * Critical rule: ONLY the conductor stays in the main session.
 * EVERY other agent (including other primary agents) gets a sub-session.
 * The conductor WAITS for all sub-sessions to complete before proceeding.
 */
export interface SubSession {
  agentName: string
  displayName: string
  sessionId: string
  taskId: string
  taskDescription: string
  status: 'launched' | 'running' | 'completed' | 'failed'
  visible: true           // User can watch but not interact
  result?: string
  promptInstructions: string  // The instructions given to this sub-agent
}

/**
 * Structured delegation task for sub-agents.
 * Mirrors the oh-my-openagent Sisyphus delegation pattern:
 *   What to do, Must do, Must NOT do, QA checks.
 */
export interface DelegatedTask {
  agentName: string
  objective: string
  mustDo: string[]
  mustNotDo: string[]
  dependsOn: string[]
  qa: string[]
  reportFormat: string
}

/**
 * Generate a structured task prompt in the openagent format.
 * Produces a clear sectioned prompt that the sub-agent can follow precisely.
 */
export function generateTaskPrompt(task: DelegatedTask): string {
  const lines: string[] = []
  lines.push(`## Task for @${task.agentName}`)
  lines.push('')
  lines.push(`### Objective`)
  lines.push(task.objective)
  lines.push('')
  lines.push('### What to do')
  task.mustDo.forEach(d => lines.push(`- ${d}`))
  lines.push('')
  lines.push('### What NOT to do')
  task.mustNotDo.forEach(d => lines.push(`- ${d}`))
  lines.push('')
  lines.push('### Dependencies')
  if (task.dependsOn.length === 0) {
    lines.push('- None (can start immediately)')
  } else {
    task.dependsOn.forEach(d => lines.push(`- Wait for: ${d}`))
  }
  lines.push('')
  lines.push('### Quality Assurance')
  task.qa.forEach(q => lines.push(`- [ ] ${q}`))
  lines.push('')
  lines.push('### Report Format')
  lines.push(task.reportFormat)
  lines.push('')
  lines.push('After completing: VERIFY against What to do and What NOT to do.')
  return lines.join('\n')
}

function generateTaskId(): string {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `task_${Date.now()}_${suffix}`
}

function generateSessionId(): string {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `sub_${Date.now()}_${suffix}`
}

export class PipelineOrchestrator {
  private conductor: string = 'odin'
  private subSessions: Map<string, SubSession> = new Map()
  private kanban: KanbanTracker
  private workflow: WorkflowEngine
  private roleEnforcer: RoleEnforcer
  private waitingForSubs: boolean = false
  private taskRegistry: TaskRegistry | null = null

  constructor(taskRegistry?: TaskRegistry) {
    this.kanban = new KanbanTracker()
    this.workflow = new WorkflowEngine()
    this.roleEnforcer = new RoleEnforcer()
    this.taskRegistry = taskRegistry ?? null
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  getKanban(): KanbanTracker { return this.kanban }
  getWorkflow(): WorkflowEngine { return this.workflow }
  getRoleEnforcer(): RoleEnforcer { return this.roleEnforcer }
  getSubSessions(): Map<string, SubSession> { return this.subSessions }

  // ── Conductor selection ────────────────────────────────────────────────

  /**
   * Set who's conducting (selected from TUI).
   * Only one conductor — they stay in the main session.
   * Returns false if the agent doesn't exist or isn't a primary agent.
   */
  selectConductor(agentName: string): boolean {
    const agent = getAgent(agentName)
    if (!agent || !agent.isPrimary) return false
    this.conductor = agentName
    return true
  }

  /** Get the current conductor's agent name */
  getConductor(): string { return this.conductor }

  // ── Sub-session management ─────────────────────────────────────────────

  /**
   * Deploy ANY agent to a visible sub-session.
   * They work autonomously — user can watch but NOT interact.
   * The conductor WAITS for all sub-sessions to complete before proceeding.
   *
   * Even primary agents (other than the conductor) get sub-sessions.
   * Only the conductor stays in the main session.
   */
  async callAgent(task: DelegatedTask, parentSessionId?: string): Promise<SubSession> {
    const agent = getAgent(task.agentName)
    if (!agent) throw new Error(`Unknown agent: ${task.agentName}`)

    const permission = this.roleEnforcer.checkPermission(task.agentName, 'research')
    if (permission.blocked) throw new Error(permission.violation)

    const prompt = generateTaskPrompt(task)
    const taskId = generateTaskId()
    const sessionId = generateSessionId()

    if (this.taskRegistry) {
      this.taskRegistry.createTask({
        id: taskId,
        sessionId,
        parentSessionId,
        agent: task.agentName,
        status: 'pending',
        description: task.objective,
        category: 'pipeline',
        metadata: JSON.stringify({
          phase: this.workflow.getPhase(),
          conductor: this.conductor,
          dependsOn: task.dependsOn,
        }),
      })
      this.taskRegistry.updateStatus(taskId, 'running')
    }

    const session: SubSession = {
      agentName: task.agentName,
      displayName: agent.displayName,
      sessionId,
      taskId,
      taskDescription: task.objective.slice(0, 100),
      status: 'launched',
      visible: true,
      promptInstructions: prompt,
    }

    this.subSessions.set(session.sessionId, session)
    this.kanban.addTask(this.workflow.getPhase() as KanbanTask['phase'], task.agentName, agent.displayName, task.objective)

    return session
  }

  /**
   * The conductor calls this to WAIT for all sub-sessions to complete.
   * The conductor does NOT move forward until all sub-sessions finish or timeout.
   */
  async waitForAllSubSessions(timeoutMs = 300000): Promise<boolean> {
    this.waitingForSubs = true
    const startTime = Date.now()

    while (this.subSessions.size > 0) {
      for (const [id, session] of this.subSessions) {
        if (session.status === 'launched' || session.status === 'running') {
          if (this.taskRegistry) {
            const task = this.taskRegistry.getTask(session.taskId)
            if (task) {
              if (task.status === 'completed') {
                session.status = 'completed'
                session.result = task.outputCache ?? 'Task completed'
              } else if (task.status === 'error' || task.status === 'cancelled') {
                session.status = 'failed'
                session.result = `Task ${task.status}`
              }
            }
          }
        }
      }

      const allDone = Array.from(this.subSessions.values()).every(s =>
        s.status === 'completed' || s.status === 'failed'
      )

      if (allDone) {
        this.waitingForSubs = false
        return true
      }

      if (Date.now() - startTime > timeoutMs) {
        for (const session of this.subSessions.values()) {
          if (session.status === 'launched' || session.status === 'running') {
            session.status = 'failed'
            session.result = 'Task timed out'
            if (this.taskRegistry) {
              this.taskRegistry.updateStatus(session.taskId, 'error', {
                outputCache: 'Task timed out',
                completedAt: Date.now(),
              })
            }
          }
        }
        this.waitingForSubs = false
        return false
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    this.waitingForSubs = false
    return true
  }

  /** Mark a sub-session as completed with result */
  completeSubSession(sessionId: string, result: string): boolean {
    const session = this.subSessions.get(sessionId)
    if (!session) return false
    session.status = 'completed'
    session.result = result
    this.kanban.completeTask(sessionId, result)
    if (this.taskRegistry) {
      this.taskRegistry.updateStatus(session.taskId, 'completed', {
        outputCache: result,
        completedAt: Date.now(),
      })
    }
    return true
  }

  /** Check if conductor is waiting for sub-sessions */
  isWaiting(): boolean { return this.waitingForSubs }

  /** List all visible sub-sessions for the TUI */
  getVisibleSubSessions(): SubSession[] {
    return Array.from(this.subSessions.values()).filter(s => s.visible)
  }

  /** Clear completed sub-sessions */
  clearCompletedSubSessions(): void {
    for (const [id, session] of this.subSessions) {
      if (session.status === 'completed' || session.status === 'failed') {
        this.subSessions.delete(id)
      }
    }
  }

  // ── Pipeline orchestration ─────────────────────────────────────────────

  /**
   * Start full pipeline: /plan
   * Only the conductor stays in the main session.
   * EVERY other agent gets a sub-session.
   */
  async runFullPipeline(userRequest: string): Promise<void> {
    this.workflow.updateConfidence('initial', 10)
    this.workflow.transitionTo('assess')

    this.kanban.addTask('assess', this.conductor, `@${this.conductor.charAt(0).toUpperCase() + this.conductor.slice(1)}`, `Interview: ${userRequest.slice(0, 50)}...`)

    await this.callAgent({
      agentName: 'frigg',
      objective: `Gap analysis on requirements: ${userRequest}`,
      mustDo: [
        'Analyze the user request for implicit requirements',
        'Identify gaps, contradictions, and missing context',
        'List assumptions that need validation',
        'Categorize gaps by severity (blocking / important / nice-to-have)',
      ],
      mustNotDo: [
        'Do not propose solutions or architecture',
        'Do not write code or pseudocode',
        'Do not make unsupported assumptions',
      ],
      dependsOn: [],
      qa: [
        'Are all gaps clearly labeled by severity?',
        'Are assumptions explicitly called out?',
        'Is the analysis actionable for planning?',
      ],
      reportFormat: 'Bullet-list gap analysis with severity labels. Conclude with top-3 most critical gaps.',
    })
    await this.callAgent({
      agentName: 'mimir',
      objective: `Architecture advice for: ${userRequest}`,
      mustDo: [
        'Review the request from an architectural standpoint',
        'Identify relevant patterns, technologies, and approaches',
        'Flag potential architectural risks or concerns',
        'Suggest architectural considerations for the plan',
      ],
      mustNotDo: [
        'Do not produce a full implementation plan',
        'Do not write code or configuration',
        'Do not make technology recommendations without reasoning',
      ],
      dependsOn: [],
      qa: [
        'Are architectural risks clearly identified?',
        'Is each recommendation backed by reasoning?',
        'Are trade-offs discussed?',
      ],
      reportFormat: 'Structured analysis with sections: Risks, Considerations, Recommendations. Conclude with a go/no-go assessment.',
    })
  }

  /**
   * Run a workflow phase.
   * ALL agents (primary + sub) get deployed to visible sub-sessions.
   * Only the conductor stays in the main session.
   */
  async runPhase(phase: string): Promise<void> {
    const plan = getPhaseExecutionPlan(phase)
    if (!plan) return

    for (const item of [...(plan.parallel ?? []), ...(plan.sequential ?? [])]) {
      if (item.tool === 'subagent' && item.target) {
        const agentName = item.target.replace('@', '').toLowerCase()

        if (agentName === this.conductor) {
          this.kanban.addTask(phase as KanbanTask['phase'], agentName, item.target, item.action)
          continue
        }

        const agent = getAgent(agentName)
        if (!agent) continue

        const check = this.roleEnforcer.checkPermission(agentName, 'read')
        if (check.blocked && agent.isPrimary) {
          this.kanban.addTask(phase as KanbanTask['phase'], agentName, item.target, item.action)
          continue
        }

        await this.callAgent({
          agentName,
          objective: item.action,
          mustDo: [
            'Execute the assigned action completely',
            'Report findings in the specified format',
            'Flag any blockers or dependencies encountered',
          ],
          mustNotDo: [
            'Do not modify any files outside the scope of this task',
            'Do not deviate from the assigned objective',
            'Do not delegate to other agents unless explicitly permitted',
          ],
          dependsOn: [],
          qa: [
            'Was the objective fully addressed?',
            'Are all findings documented?',
            'Are blockers clearly communicated?',
          ],
          reportFormat: 'Concise summary of findings. If action produced output, include relevant excerpts.',
        })
      }
    }
  }

  /** Collect results from all sub-sessions */
  collectSubSessionResults(): string[] {
    const results: string[] = []
    for (const [sessionId, session] of this.subSessions) {
      const status = session.status
      const line = `[${sessionId}] ${session.displayName}: ${status} — "${session.taskDescription.slice(0, 60)}"`
      results.push(line)
    }
    if (results.length === 0) {
      results.push('No sub-session tasks deployed.')
    }
    return results
  }

  /** Synthesize all results into one report */
  synthesize(): string {
    const report = this.kanban.getReport()
    const lines: string[] = ['# Synthesis Report', '']
    for (const task of report.tasks) {
      const icon =
        task.status === 'completed'
          ? '✅'
          : task.status === 'in-progress'
            ? '🔄'
            : task.status === 'blocked'
              ? '❌'
              : '⏳'
      lines.push(`${icon} **${task.agentDisplay}**: ${task.description}`)
      if (task.result) lines.push(`   ${task.result.slice(0, 100)}`)
    }

    const subResults = this.collectSubSessionResults()
    if (subResults.length > 0 && subResults[0] !== 'No sub-session tasks deployed.') {
      lines.push('', '## Sub-Sessions')
      for (const r of subResults) {
        lines.push(`  - ${r}`)
      }
    }

    lines.push('', '## Summary')
    lines.push(`**${report.completedCount}/${report.totalCount}** tasks complete. Confidence: ${this.workflow.getConfidence()}/10`)
    return lines.join('\n')
  }
}
