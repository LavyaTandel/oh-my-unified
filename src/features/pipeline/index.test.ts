import { describe, it, expect, beforeEach } from 'bun:test'
import { PipelineOrchestrator } from './index'

describe('PipelineOrchestrator', () => {
  let pipeline: PipelineOrchestrator

  beforeEach(() => {
    pipeline = new PipelineOrchestrator()
  })

  // ── 1. Construction ───────────────────────────────────────────────────

  it('1. PipelineOrchestrator constructs successfully', () => {
    expect(pipeline).toBeInstanceOf(PipelineOrchestrator)
  })

  it('2. Default conductor is odin', () => {
    expect(pipeline.getConductor()).toBe('odin')
  })

  // ── 3. Getters ────────────────────────────────────────────────────────

  it('3. getKanban returns a KanbanTracker instance', () => {
    const kanban = pipeline.getKanban()
    expect(kanban).toBeDefined()
    expect(typeof kanban.addTask).toBe('function')
    expect(typeof kanban.getReport).toBe('function')
  })

  it('4. getWorkflow returns a WorkflowEngine instance', () => {
    const workflow = pipeline.getWorkflow()
    expect(workflow).toBeDefined()
    expect(typeof workflow.getPhase).toBe('function')
    expect(typeof workflow.getConfidence).toBe('function')
  })

  it('5. getRoleEnforcer returns a RoleEnforcer instance', () => {
    const enforcer = pipeline.getRoleEnforcer()
    expect(enforcer).toBeDefined()
    expect(typeof enforcer.checkPermission).toBe('function')
    expect(typeof enforcer.canDelegate).toBe('function')
  })

  it('6. getSubSessions returns an empty map initially', () => {
    const sessions = pipeline.getSubSessions()
    expect(sessions).toBeInstanceOf(Map)
    expect(sessions.size).toBe(0)
  })

  // ── 7-8. Conductor selection ─────────────────────────────────────────

  it('7. selectConductor returns true for a valid primary agent', () => {
    const result = pipeline.selectConductor('njord')
    expect(result).toBe(true)
    expect(pipeline.getConductor()).toBe('njord')
  })

  it('8. selectConductor returns false for a non-primary agent', () => {
    const result = pipeline.selectConductor('sif')
    expect(result).toBe(false)
    // Conductor should still be default
    expect(pipeline.getConductor()).toBe('odin')
  })

  it('9. selectConductor returns false for an unknown agent', () => {
    const result = pipeline.selectConductor('nonexistent')
    expect(result).toBe(false)
    expect(pipeline.getConductor()).toBe('odin')
  })

  // ── 10-13. callAgent ──────────────────────────────────────────────────

  it('10. callAgent creates a SubSession with correct fields', async () => {
    const session = await pipeline.callAgent('sif', 'Search for API route patterns')

    expect(session.agentName).toBe('sif')
    expect(session.displayName).toBe('@Sif')
    expect(session.sessionId).toMatch(/^sub-sif-\d+$/)
    expect(session.taskDescription).toBe('Search for API route patterns')
    expect(session.status).toBe('launched')
    expect(session.visible).toBe(true)
    expect(session.promptInstructions).toBe('Search for API route patterns')
    expect(pipeline.getSubSessions().has(session.sessionId)).toBe(true)
  })

  it('11. callAgent also creates a kanban task for the agent', async () => {
    await pipeline.callAgent('eir', 'Find documentation for auth flow')

    const report = pipeline.getKanban().getReport()
    const tasks = report.tasks
    expect(tasks.length).toBe(1)
    expect(tasks[0].agentName).toBe('eir')
    expect(tasks[0].description).toBe('Find documentation for auth flow')
  })

  it('12. callAgent throws for an unknown agent', async () => {
    await expect(pipeline.callAgent('nonexistent', 'do something')).rejects.toThrow('Unknown agent')
  })

  it('13. callAgent works for primary agents (they go to sub-sessions too)', async () => {
    // Only the conductor stays in main session — other primaries get sub-sessions
    const session = await pipeline.callAgent('vidar', 'Map the codebase architecture')

    expect(session.agentName).toBe('vidar')
    expect(session.status).toBe('launched')
    expect(session.visible).toBe(true)
    expect(pipeline.getSubSessions().has(session.sessionId)).toBe(true)
  })

  // ── 14-17. waitForAllSubSessions ─────────────────────────────────────

  it('14. waitForAllSubSessions returns true when no sub-sessions', async () => {
    const result = await pipeline.waitForAllSubSessions(1000)
    expect(result).toBe(true)
    expect(pipeline.isWaiting()).toBe(false)
  })

  it('15. waitForAllSubSessions returns true when all sub-sessions complete', async () => {
    const session1 = await pipeline.callAgent('sif', 'Search patterns')
    const session2 = await pipeline.callAgent('eir', 'Find docs')

    // Complete both sub-sessions
    pipeline.completeSubSession(session1.sessionId, 'Found patterns in src/')
    pipeline.completeSubSession(session2.sessionId, 'Found docs in wiki/')

    const result = await pipeline.waitForAllSubSessions(5000)
    expect(result).toBe(true)
    expect(pipeline.isWaiting()).toBe(false)
  })

  it('16. waitForAllSubSessions returns false on timeout', async () => {
    await pipeline.callAgent('sif', 'Long running search')

    // Don't complete — should timeout
    const result = await pipeline.waitForAllSubSessions(500)
    expect(result).toBe(false)
    expect(pipeline.isWaiting()).toBe(false)
  })

  // ── 18-19. completeSubSession ────────────────────────────────────────

  it('17. completeSubSession marks session as completed with result', async () => {
    const session = await pipeline.callAgent('sif', 'Search patterns')

    const result = pipeline.completeSubSession(session.sessionId, 'Found matching patterns')

    expect(result).toBe(true)
    expect(session.status).toBe('completed')
    expect(session.result).toBe('Found matching patterns')
  })

  it('18. completeSubSession returns false for unknown session', () => {
    const result = pipeline.completeSubSession('nonexistent', 'result')
    expect(result).toBe(false)
  })

  // ── 20-21. isWaiting / getVisibleSubSessions / clearCompleted ────────

  it('19. getVisibleSubSessions returns only sub-sessions (all are visible)', async () => {
    await pipeline.callAgent('sif', 'Search')
    await pipeline.callAgent('eir', 'Find docs')

    const visible = pipeline.getVisibleSubSessions()
    expect(visible.length).toBe(2)
    expect(visible[0].visible).toBe(true)
    expect(visible[1].visible).toBe(true)
  })

  it('20. clearCompletedSubSessions removes completed and failed sessions', async () => {
    const session1 = await pipeline.callAgent('sif', 'Search')
    const session2 = await pipeline.callAgent('eir', 'Find docs')

    pipeline.completeSubSession(session1.sessionId, 'Done')

    expect(pipeline.getSubSessions().size).toBe(2)

    pipeline.clearCompletedSubSessions()

    expect(pipeline.getSubSessions().size).toBe(1)
    expect(pipeline.getSubSessions().has(session1.sessionId)).toBe(false)
    expect(pipeline.getSubSessions().has(session2.sessionId)).toBe(true)
  })

  // ── 22. runFullPipeline ──────────────────────────────────────────────

  it('21. runFullPipeline starts conductor interview + deploys sub-sessions', async () => {
    await pipeline.runFullPipeline('Build a new feature for the dashboard')

    const report = pipeline.getKanban().getReport()
    const subSessions = pipeline.getSubSessions()

    // Conductor (odin) interview is on kanban
    const conductorTask = report.tasks.find(t => t.agentName === 'odin')
    expect(conductorTask).toBeDefined()
    expect(conductorTask!.description).toContain('Interview:')

    // Frigg and Mimir deployed as sub-sessions
    const subNames = Array.from(subSessions.values()).map(s => s.agentName)
    expect(subNames).toContain('frigg')
    expect(subNames).toContain('mimir')

    // Sub-sessions are visible
    for (const s of subSessions.values()) {
      expect(s.visible).toBe(true)
      expect(s.promptInstructions).toBeDefined()
    }
  })

  // ── 23. runPhase — every non-conductor agent → sub-session ───────────

  it('22. runPhase deploys non-conductor agents to sub-sessions', async () => {
    await pipeline.runPhase('assemble')

    const report = pipeline.getKanban().getReport()
    const subSessions = pipeline.getSubSessions()

    // assemble phase: Vidar (primary), Eir (sub), Sif (sub), Forseti (primary)
    // ALL non-conductor agents go to sub-sessions (even other primary agents)
    const subNames = Array.from(subSessions.values()).map(s => s.agentName)
    expect(subNames).toContain('vidar')
    expect(subNames).toContain('eir')
    expect(subNames).toContain('sif')
    expect(subNames).toContain('forseti')

    // Agents deployed via callAgent also appear on kanban for tracking
    const kanbanNames = report.tasks.map(t => t.agentName)
    expect(kanbanNames).toContain('vidar')
    expect(kanbanNames).toContain('eir')
    expect(kanbanNames).toContain('sif')
    expect(kanbanNames).toContain('forseti')

    // Sub-sessions are visible
    for (const s of subSessions.values()) {
      expect(s.visible).toBe(true)
    }
  })

  it('23. runPhase skips conductor — they stay in main session', async () => {
    pipeline.selectConductor('vidar')
    await pipeline.runPhase('assemble')

    const report = pipeline.getKanban().getReport()
    const subSessions = pipeline.getSubSessions()

    // Vidar is the conductor, so they should be on kanban, NOT in sub-sessions
    const kanbanNames = report.tasks.map(t => t.agentName)
    expect(kanbanNames).toContain('vidar')

    const subNames = Array.from(subSessions.values()).map(s => s.agentName)
    expect(subNames).not.toContain('vidar')
  })

  // ── 24-25. synthesize ────────────────────────────────────────────────

  it('24. synthesize generates a formatted markdown report', async () => {
    await pipeline.runFullPipeline('Build a login system')

    const report = pipeline.synthesize()

    expect(report).toContain('# Synthesis Report')
    expect(report).toContain('@Odin')
    expect(report).toContain('## Summary')
    expect(report).toContain('tasks complete')
    expect(report).toContain('Confidence:')
  })

  it('25. synthesize includes sub-session summaries when subs exist', async () => {
    await pipeline.runFullPipeline('Build a login system')

    const report = pipeline.synthesize()

    expect(report).toContain('## Sub-Sessions')
    expect(report).toContain('@Frigg')
    expect(report).toContain('@Mimir')
  })

  // ── 26. collectSubSessionResults ─────────────────────────────────────

  it('26. collectSubSessionResults returns summaries of all sub-sessions', async () => {
    await pipeline.callAgent('sif', 'Search for patterns')
    await pipeline.callAgent('eir', 'Find documentation')

    const results = pipeline.collectSubSessionResults()

    expect(results.length).toBe(2)
    expect(results[0]).toContain('@Sif')
    expect(results[1]).toContain('@Eir')
    expect(results[0]).toContain('launched')
  })

  it('27. collectSubSessionResults returns no-tasks message when empty', () => {
    const results = pipeline.collectSubSessionResults()
    expect(results).toEqual(['No sub-session tasks deployed.'])
  })
})
