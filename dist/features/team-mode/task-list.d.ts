import type { TeamTask } from './types';
export declare class TeamTaskList {
    private db;
    constructor(dbPath?: string);
    close(): void;
    createTask(task: TeamTask): void;
    assignTask(taskId: string, agentName: string): void;
    updateStatus(taskId: string, status: TeamTask['status']): void;
    getTasksByTeam(teamId: string): TeamTask[];
    getTasksByAgent(agentName: string): TeamTask[];
    getBlockedTasks(): TeamTask[];
}
//# sourceMappingURL=task-list.d.ts.map