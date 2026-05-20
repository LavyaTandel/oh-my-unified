export type KanbanStatus = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed';
export interface KanbanTask {
    id: string;
    phase: 'assess' | 'assemble' | 'improvise' | 'act';
    agentName: string;
    agentDisplay: string;
    description: string;
    status: KanbanStatus;
    startedAt?: number;
    completedAt?: number;
    result?: string;
    dependsOn: string[];
}
export interface KanbanReport {
    phase: string;
    overallStatus: 'running' | 'completed' | 'blocked';
    tasks: KanbanTask[];
    completedCount: number;
    totalCount: number;
}
export declare class KanbanTracker {
    private tasks;
    private taskCounter;
    addTask(phase: KanbanTask['phase'], agentName: string, agentDisplay: string, description: string, dependsOn?: string[]): KanbanTask;
    startTask(id: string): boolean;
    completeTask(id: string, result: string): boolean;
    blockTask(id: string, reason: string): boolean;
    failTask(id: string, reason: string): boolean;
    getNextReady(): KanbanTask | undefined;
    getDependencyOrder(): KanbanTask[];
    getReport(phase?: string): KanbanReport;
    statusLine(): string;
}
//# sourceMappingURL=index.d.ts.map