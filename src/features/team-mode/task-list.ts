import { Database } from 'bun:sqlite'
import type { TeamTask } from './types'

function serializeDependsOn(deps: string[]): string {
  return deps.join(',')
}

function deserializeDependsOn(raw: string | null): string[] {
  if (!raw || raw === '') return []
  return raw.split(',')
}

function rowToTask(row: Record<string, unknown>): TeamTask {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    title: row.title as string,
    description: row.description as string,
    assignedTo: (row.assigned_to as string) || undefined,
    status: row.status as TeamTask['status'],
    dependsOn: deserializeDependsOn(row.depends_on as string | null),
    createdAt: row.created_at as number,
  }
}

export class TeamTaskList {
  private db: Database

  constructor(dbPath?: string) {
    this.db = new Database(dbPath ?? ':memory:')
    this.db.run('PRAGMA journal_mode = WAL;')
    this.db.run(`CREATE TABLE IF NOT EXISTS team_tasks (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      title TEXT,
      description TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'pending',
      depends_on TEXT,
      created_at INTEGER
    );`)
  }

  close(): void {
    this.db.close()
  }

  createTask(task: TeamTask): void {
    this.db.run(
      `INSERT INTO team_tasks (id, team_id, title, description, assigned_to, status, depends_on, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.teamId,
        task.title,
        task.description,
        task.assignedTo ?? null,
        task.status,
        serializeDependsOn(task.dependsOn),
        task.createdAt,
      ],
    )
  }

  assignTask(taskId: string, agentName: string): void {
    const result = this.db.run(
      `UPDATE team_tasks SET assigned_to = ? WHERE id = ?`,
      [agentName, taskId],
    )
    if (result.changes === 0) {
      throw new Error(`Task with id "${taskId}" not found`)
    }
  }

  updateStatus(taskId: string, status: TeamTask['status']): void {
    const result = this.db.run(
      `UPDATE team_tasks SET status = ? WHERE id = ?`,
      [status, taskId],
    )
    if (result.changes === 0) {
      throw new Error(`Task with id "${taskId}" not found`)
    }
  }

  getTasksByTeam(teamId: string): TeamTask[] {
    const rows = this.db.query(
      `SELECT * FROM team_tasks WHERE team_id = ? ORDER BY created_at ASC`,
    ).all(teamId) as Record<string, unknown>[]
    return rows.map(rowToTask)
  }

  getTasksByAgent(agentName: string): TeamTask[] {
    const rows = this.db.query(
      `SELECT * FROM team_tasks WHERE assigned_to = ? ORDER BY created_at ASC`,
    ).all(agentName) as Record<string, unknown>[]
    return rows.map(rowToTask)
  }

  getBlockedTasks(): TeamTask[] {
    const rows = this.db.query(
      `SELECT * FROM team_tasks WHERE status = 'blocked' ORDER BY created_at ASC`,
    ).all() as Record<string, unknown>[]
    return rows.map(rowToTask)
  }
}
