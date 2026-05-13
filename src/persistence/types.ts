export interface TaskRecord {
  id: string; // bg_xxx
  sessionId: string; // ses_xxx
  parentSessionId?: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled' | 'interrupted';
  description: string;
  category?: string;
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
  completedAt?: number;
  outputCache?: string; // Last-known output text
  metadata?: string; // JSON string for extensibility
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
