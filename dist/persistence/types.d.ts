export interface TaskRecord {
    id: string;
    sessionId: string;
    parentSessionId?: string;
    agent: string;
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled' | 'interrupted';
    description: string;
    category?: string;
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    outputCache?: string;
    metadata?: string;
}
export interface TaskMessage {
    id?: number;
    taskId: string;
    role: string;
    content: string;
    timestamp: number;
}
export interface TaskDependency {
    taskId: string;
    dependsOnId: string;
}
//# sourceMappingURL=types.d.ts.map