export type KanbanStatus = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed'

export interface KanbanTask {
  id: string
  phase: 'assess' | 'assemble' | 'improvise' | 'act'
  agentName: string
  agentDisplay: string
  description: string
  status: KanbanStatus
  startedAt?: number
  completedAt?: number
  result?: string
  dependsOn: string[]  // task IDs that must complete first
}

export interface KanbanReport {
  phase: string
  overallStatus: 'running' | 'completed' | 'blocked'
  tasks: KanbanTask[]
  completedCount: number
  totalCount: number
}

export class KanbanTracker {
  private tasks: Map<string, KanbanTask> = new Map()
  private taskCounter = 0

  // Add a task to the kanban board
  addTask(
    phase: KanbanTask['phase'],
    agentName: string,
    agentDisplay: string,
    description: string,
    dependsOn: string[] = [],
  ): KanbanTask {
    this.taskCounter++
    const task: KanbanTask = {
      id: `task-${this.taskCounter}`,
      phase,
      agentName,
      agentDisplay,
      description,
      status: 'pending',
      dependsOn,
    }
    this.tasks.set(task.id, task)
    return task
  }

  // Mark task in progress
  startTask(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'pending') return false
    task.status = 'in-progress'
    task.startedAt = Date.now()
    return true
  }

  // Mark task complete with result
  completeTask(id: string, result: string): boolean {
    const task = this.tasks.get(id)
    if (!task) return false
    task.status = 'completed'
    task.completedAt = Date.now()
    task.result = result
    return true
  }

  // Mark task blocked
  blockTask(id: string, reason: string): boolean {
    const task = this.tasks.get(id)
    if (!task) return false
    task.status = 'blocked'
    task.result = reason
    return true
  }

  // Mark task failed
  failTask(id: string, reason: string): boolean {
    const task = this.tasks.get(id)
    if (!task) return false
    task.status = 'failed'
    task.result = reason
    return true
  }

  // Get next ready task (dependencies met, not started)
  getNextReady(): KanbanTask | undefined {
    return Array.from(this.tasks.values()).find(t => {
      if (t.status !== 'pending') return false
      return t.dependsOn.every(depId => {
        const dep = this.tasks.get(depId)
        return dep && dep.status === 'completed'
      })
    })
  }

  // Get all tasks in dependency order (topological sort)
  getDependencyOrder(): KanbanTask[] {
    const visited = new Set<string>()
    const result: KanbanTask[] = []

    const visit = (task: KanbanTask) => {
      if (visited.has(task.id)) return
      visited.add(task.id)
      for (const depId of task.dependsOn) {
        const dep = this.tasks.get(depId)
        if (dep) visit(dep)
      }
      result.push(task)
    }

    for (const task of this.tasks.values()) {
      visit(task)
    }

    return result
  }

  // Get full report
  getReport(phase?: string): KanbanReport {
    const filtered = phase
      ? Array.from(this.tasks.values()).filter(t => t.phase === phase)
      : Array.from(this.tasks.values())
    const completed = filtered.filter(t => t.status === 'completed').length
    const blocked = filtered.some(t => t.status === 'blocked')
    return {
      phase: phase || 'all',
      overallStatus: blocked ? 'blocked' : completed === filtered.length ? 'completed' : 'running',
      tasks: filtered,
      completedCount: completed,
      totalCount: filtered.length,
    }
  }

  // Generate quick status line for TUI
  statusLine(): string {
    const all = Array.from(this.tasks.values())
    const done = all.filter(t => t.status === 'completed').length
    const active = all.find(t => t.status === 'in-progress')
    return `[${done}/${all.length}] ${active ? `Active: ${active.agentDisplay}` : 'Waiting'}`
  }
}
