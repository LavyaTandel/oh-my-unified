import type { TaskRecord } from '../persistence';

export interface EngineConfig {
  dbPath: string;
  taskRetentionDays?: number;  // default 7
  maxConcurrentTasks?: number; // default 10
  defaultTimeoutMs?: number;   // default 300000 (5 min)
  healthCheckIntervalMs?: number; // default 30000
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
  messages: Array<{ role: string; content: string; timestamp?: number }>;
  finalContent?: string;
  reconstructed?: boolean;
}

export interface SessionClient {
  session?: {
    read?: (id: string) => Promise<{
      messages?: Array<{ role: string; content: string; ts?: number }>;
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
      log?: (input: { body: { service: string; level: string; message: string } }) => Promise<void>;
    };
  };
}
