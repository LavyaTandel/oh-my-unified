import { Database } from '../../utils/sqlite.js';
function serializeDependsOn(deps) {
    return deps.join(',');
}
function deserializeDependsOn(raw) {
    if (!raw || raw === '')
        return [];
    return raw.split(',');
}
function rowToTask(row) {
    return {
        id: row.id,
        teamId: row.team_id,
        title: row.title,
        description: row.description,
        assignedTo: row.assigned_to || undefined,
        status: row.status,
        dependsOn: deserializeDependsOn(row.depends_on),
        createdAt: row.created_at,
    };
}
export class TeamTaskList {
    db;
    constructor(dbPath) {
        this.db = new Database(dbPath ?? ':memory:');
        this.db.run('PRAGMA journal_mode = WAL;');
        this.db.run(`CREATE TABLE IF NOT EXISTS team_tasks (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      title TEXT,
      description TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'pending',
      depends_on TEXT,
      created_at INTEGER
    );`);
    }
    close() {
        this.db.close();
    }
    createTask(task) {
        this.db.run(`INSERT INTO team_tasks (id, team_id, title, description, assigned_to, status, depends_on, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            task.id,
            task.teamId,
            task.title,
            task.description,
            task.assignedTo ?? null,
            task.status,
            serializeDependsOn(task.dependsOn),
            task.createdAt,
        ]);
    }
    assignTask(taskId, agentName) {
        const result = this.db.run(`UPDATE team_tasks SET assigned_to = ? WHERE id = ?`, [agentName, taskId]);
        if (result.changes === 0) {
            throw new Error(`Task with id "${taskId}" not found`);
        }
    }
    updateStatus(taskId, status) {
        const result = this.db.run(`UPDATE team_tasks SET status = ? WHERE id = ?`, [status, taskId]);
        if (result.changes === 0) {
            throw new Error(`Task with id "${taskId}" not found`);
        }
    }
    getTasksByTeam(teamId) {
        const rows = this.db
            .prepare(`SELECT * FROM team_tasks WHERE team_id = ? ORDER BY created_at ASC`)
            .all(teamId);
        return rows.map(rowToTask);
    }
    getTasksByAgent(agentName) {
        const rows = this.db
            .prepare(`SELECT * FROM team_tasks WHERE assigned_to = ? ORDER BY created_at ASC`)
            .all(agentName);
        return rows.map(rowToTask);
    }
    getBlockedTasks() {
        const rows = this.db
            .prepare(`SELECT * FROM team_tasks WHERE status = 'blocked' ORDER BY created_at ASC`)
            .all();
        return rows.map(rowToTask);
    }
}
//# sourceMappingURL=task-list.js.map