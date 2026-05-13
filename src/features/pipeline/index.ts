import { KanbanTracker, type KanbanTask } from '../kanban'
import { WorkflowEngine, getNextPhase } from '../workflow-orchestrator/workflow-engine'
import { RoleEnforcer } from '../role-enforcer'
import { getPhaseExecutionPlan } from '../workflow-orchestrator/prometheus-recon'
import { getAgent, type AgentConfig } from '../agent-commands'

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
  taskDescription: string
  status: 'launched' | 'running' | 'completed' | 'failed'
  visible: true           // User can watch but not interact
  result?: string
  promptInstructions: string  // The instructions given to this sub-agent
}

export class PipelineOrchestrator {
  private conductor: string = 'odin'  // Who's in the main session
  private subSessions: Map<string, SubSession> = new Map()
  private kanban: KanbanTracker
  private workflow: WorkflowEngine
  private roleEnforcer: RoleEnforcer
  private waitingForSubs: boolean = false

  constructor() {
    this.kanban = new KanbanTracker()
    this.workflow = new WorkflowEngine()
    this.roleEnforcer = new RoleEnforcer()
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
  async callAgent(agentName: string, instructions: string): Promise<SubSession> {
    const agent = getAgent(agentName)
    if (!agent) throw new Error(`Unknown agent: ${agentName}`)

    // Role check — sub-session agents perform read-only research work
    const permission = this.roleEnforcer.checkPermission(agentName, 'read')
    if (permission.blocked && !agent.canDelegate) {
      throw new Error(permission.violation)
    }

    // Create visible sub-session
    const session: SubSession = {
      agentName,
      displayName: agent.displayName,
      sessionId: `sub-${agentName}-${Date.now()}`,
      taskDescription: instructions.slice(0, 100),
      status: 'launched',
      visible: true,
      promptInstructions: instructions,
    }

    this.subSessions.set(session.sessionId, session)
    this.kanban.addTask(this.workflow.getPhase() as KanbanTask['phase'], agentName, agent.displayName, instructions)

    return session
  }

  /**
   * The conductor calls this to WAIT for all sub-sessions to complete.
   * The conductor does NOT move forward until all sub-sessions finish or timeout.
   */
  async waitForAllSubSessions(timeoutMs = 300000): Promise<boolean> {
    this.waitingForSubs = true
    const startTime = Date.now()

    // Poll until all sub-sessions complete (or timeout)
    while (this.subSessions.size > 0) {
      const allDone = Array.from(this.subSessions.values()).every(s =>
        s.status === 'completed' || s.status === 'failed'
      )

      if (allDone) {
        this.waitingForSubs = false
        return true
      }

      if (Date.now() - startTime > timeoutMs) {
        this.waitingForSubs = false
        return false  // timeout
      }

      // Wait before polling again
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

    // Only the conductor works in the main session for the interview
    this.kanban.addTask('assess', this.conductor, `@${this.conductor.charAt(0).toUpperCase() + this.conductor.slice(1)}`, `Interview: ${userRequest.slice(0, 50)}...`)

    // Deploy sub-sessions for supporting agents (frigg + mimir research in background)
    await this.callAgent('frigg', `Gap analysis on requirements: ${userRequest}`)
    await this.callAgent('mimir', `Architecture advice for: ${userRequest}`)
  }

  /**
   * Run a workflow phase.
   * ALL agents (primary + sub) get deployed to visible sub-sessions.
   * Only the conductor stays in the main session.
   */
  async runPhase(phase: string): Promise<void> {
    const plan = getPhaseExecutionPlan(phase)
    if (!plan) return

    // Deploy agents according to the phase plan
    // Every agent gets a sub-session — primaries are NOT special anymore
    for (const item of [...(plan.parallel ?? []), ...(plan.sequential ?? [])]) {
      if (item.tool === 'subagent' && item.target) {
        const agentName = item.target.replace('@', '').toLowerCase()

        // Skip the conductor — they stay in the main session
        if (agentName === this.conductor) {
          this.kanban.addTask(phase as KanbanTask['phase'], agentName, item.target, item.action)
          continue
        }

        const agent = getAgent(agentName)
        if (!agent) continue

        const check = this.roleEnforcer.checkPermission(agentName, 'read')
        if (check.blocked && agent.isPrimary) {
          // Even primary agents go to sub-sessions, but still need basic permissions
          this.kanban.addTask(phase as KanbanTask['phase'], agentName, item.target, item.action)
          continue
        }

        // Deploy to visible sub-session
        await this.callAgent(agentName, item.action)
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

    // Add sub-session summaries
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
