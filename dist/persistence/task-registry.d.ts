import type { TaskRecord, TaskMessage } from './types';
type TaskStatus = TaskRecord['status'];
export declare class TaskRegistry {
    private db;
    constructor(dbPath: string);
    private migrate;
    close(): void;
    createTask(record: Omit<TaskRecord, 'createdAt' | 'updatedAt'>): TaskRecord;
    getTask(id: string): TaskRecord | null;
    getTaskBySession(sessionId: string): TaskRecord | null;
    updateStatus(id: string, status: TaskStatus, extra?: Partial<TaskRecord>): void;
    listTasksByParent(parentSessionId: string): TaskRecord[];
    listTasksByStatus(status: TaskStatus): TaskRecord[];
    listRunningTasks(): TaskRecord[];
    deleteTask(id: string): void;
    addMessage(taskId: string, role: string, content: string): void;
    clearMessages(taskId: string): void;
    getMessages(taskId: string): TaskMessage[];
    getStats(): {
        total: number;
        byStatus: Record<string, number>;
    };
}
export {};
//# sourceMappingURL=task-registry.d.ts.map