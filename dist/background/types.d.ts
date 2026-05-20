import type { TaskRecord } from '../persistence';
export interface EngineConfig {
    dbPath: string;
    taskRetentionDays?: number;
    maxConcurrentTasks?: number;
    defaultTimeoutMs?: number;
    healthCheckIntervalMs?: number;
}
export interface LaunchTaskInput {
    agent: string;
    description: string;
    category?: string;
    parentSessionId?: string;
    timeoutMs?: number;
}
export interface TaskOutput {
    task: TaskRecord;
    messages: Array<{
        role: string;
        content: string;
        timestamp?: number;
    }>;
    finalContent?: string;
    reconstructed?: boolean;
}
export interface SessionClient {
    session?: {
        read?: (id: string) => Promise<{
            messages?: Array<{
                role: string;
                content: string;
                ts?: number;
            }>;
            status?: string;
        }>;
        info?: (id: string) => Promise<{
            id: string;
            status?: string;
            messageCount?: number;
        }>;
    };
    client?: {
        app?: {
            log?: (input: {
                body: {
                    service: string;
                    level: string;
                    message: string;
                };
            }) => Promise<void>;
        };
    };
}
//# sourceMappingURL=types.d.ts.map