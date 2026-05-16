import { Database } from '../utils/sqlite.js';
import type { TaskRecord, TaskMessage } from './types';

type TaskStatus = TaskRecord['status'];

interface DbTaskRow {
  id: string;
  session_id: string;
  parent_session_id: string | null;
  agent: string;
  status: string;
  description: string;
  category: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  output_cache: string | null;
  metadata: string | null;
}

interface DbMessageRow {
  id: number;
  task_id: string;
  role: string;
  content: string;
  timestamp: number;
}

function rowToTask(row: DbTaskRow): TaskRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    parentSessionId: row.parent_session_id ?? undefined,
    agent: row.agent,
    status: row.status as TaskStatus,
    description: row.description,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    outputCache: row.output_cache ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

export class TaskRegistry {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.run('PRAGMA journal_mode=WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        parent_session_id TEXT,
        agent TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        category TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        output_cache TEXT,
        metadata TEXT
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS task_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL REFERENCES tasks(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL REFERENCES tasks(id),
        depends_on_id TEXT NOT NULL REFERENCES tasks(id),
        PRIMARY KEY (task_id, depends_on_id)
      )
    `);
  }

  close(): void {
    this.db.close();
  }

  createTask(record: Omit<TaskRecord, 'createdAt' | 'updatedAt'>): TaskRecord {
    const now = Date.now();
    const task: TaskRecord = {
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    this.db
      .prepare(
        `INSERT INTO tasks (id, session_id, parent_session_id, agent, status, description, category, created_at, updated_at, completed_at, output_cache, metadata)
         VALUES ($id, $sessionId, $parentSessionId, $agent, $status, $description, $category, $createdAt, $updatedAt, $completedAt, $outputCache, $metadata)`,
      )
      .run({
        $id: task.id,
        $sessionId: task.sessionId,
        $parentSessionId: task.parentSessionId ?? null,
        $agent: task.agent,
        $status: task.status,
        $description: task.description,
        $category: task.category ?? null,
        $createdAt: task.createdAt,
        $updatedAt: task.updatedAt,
        $completedAt: task.completedAt ?? null,
        $outputCache: task.outputCache ?? null,
        $metadata: task.metadata ?? null,
      });

    return task;
  }

  getTask(id: string): TaskRecord | null {
    const row = this.db
      .prepare<DbTaskRow>('SELECT * FROM tasks WHERE id = $id')
      .get({ $id: id });

    return row ? rowToTask(row) : null;
  }

  getTaskBySession(sessionId: string): TaskRecord | null {
    const row = this.db
      .prepare<DbTaskRow>(
        'SELECT * FROM tasks WHERE session_id = $sessionId LIMIT 1',
      )
      .get({ $sessionId: sessionId });

    return row ? rowToTask(row) : null;
  }

  updateStatus(id: string, status: TaskStatus, extra?: Partial<TaskRecord>): void {
    const now = Date.now();
    const completedAt = status === 'completed' || status === 'error' ? now : null;

    const updates: string[] = ['updated_at = $updatedAt'];
    const params: Record<string, string | number | null> = { $updatedAt: now, $id: id };

    updates.push('status = $status');
    params.$status = status as string;

    if (completedAt !== null) {
      updates.push('completed_at = $completedAt');
      params.$completedAt = completedAt;
    }

    if (extra?.outputCache !== undefined) {
      updates.push('output_cache = $outputCache');
      params.$outputCache = extra.outputCache;
    }

    if (extra?.metadata !== undefined) {
      updates.push('metadata = $metadata');
      params.$metadata = extra.metadata;
    }

    if (extra?.description !== undefined) {
      updates.push('description = $description');
      params.$description = extra.description;
    }

    if (extra?.category !== undefined) {
      updates.push('category = $category');
      params.$category = extra.category;
    }

    if (extra?.parentSessionId !== undefined) {
      updates.push('parent_session_id = $parentSessionId');
      params.$parentSessionId = extra.parentSessionId;
    }

    this.db
      .prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $id`)
      .run(params);
  }

  listTasksByParent(parentSessionId: string): TaskRecord[] {
    const rows = this.db
      .prepare<DbTaskRow>(
        'SELECT * FROM tasks WHERE parent_session_id = $parentSessionId ORDER BY created_at ASC',
      )
      .all({ $parentSessionId: parentSessionId });

    return rows.map(rowToTask);
  }

  listTasksByStatus(status: TaskStatus): TaskRecord[] {
    const rows = this.db
      .prepare<DbTaskRow>(
        'SELECT * FROM tasks WHERE status = $status ORDER BY created_at DESC',
      )
      .all({ $status: status });

    return rows.map(rowToTask);
  }

  listRunningTasks(): TaskRecord[] {
    const rows = this.db
      .prepare<DbTaskRow>(
        "SELECT * FROM tasks WHERE status IN ('pending', 'running') ORDER BY created_at ASC",
      )
      .all();

    return rows.map(rowToTask);
  }

  deleteTask(id: string): void {
    this.db.prepare('DELETE FROM task_messages WHERE task_id = $id').run({ $id: id });
    this.db.prepare('DELETE FROM task_dependencies WHERE task_id = $id OR depends_on_id = $id').run({
      $id: id,
    });
    this.db.prepare('DELETE FROM tasks WHERE id = $id').run({ $id: id });
  }

  addMessage(taskId: string, role: string, content: string): void {
    this.db
      .prepare(
        `INSERT INTO task_messages (task_id, role, content, timestamp)
         VALUES ($taskId, $role, $content, $timestamp)`,
      )
      .run({
        $taskId: taskId,
        $role: role,
        $content: content,
        $timestamp: Date.now(),
      });
  }

  getMessages(taskId: string): TaskMessage[] {
    const rows = this.db
      .prepare<DbMessageRow>(
        'SELECT id, task_id, role, content, timestamp FROM task_messages WHERE task_id = $taskId ORDER BY timestamp ASC',
      )
      .all({ $taskId: taskId });

    return rows.map((row: DbMessageRow) => ({
      id: row.id,
      taskId: row.task_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
    }));
  }

  getStats(): { total: number; byStatus: Record<string, number> } {
    const row = this.db
      .prepare<{ total: number }>(
        'SELECT COUNT(*) as total FROM tasks',
      )
      .get() ?? { total: 0 };

    const statusRows = this.db
      .prepare<{ status: string; count: number }>(
        'SELECT status, COUNT(*) as count FROM tasks GROUP BY status',
      )
      .all();

    const byStatus: Record<string, number> = {};
    for (const sr of statusRows) {
      byStatus[sr.status] = sr.count;
    }

    return { total: row.total, byStatus };
  }
}
