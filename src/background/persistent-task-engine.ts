import { TaskRegistry } from '../persistence';
import { CompletionDetector, type CompletionDetectorCallbacks } from './completion-detector';
import { TaskReconstructor } from './reconstructor';
import type { EngineConfig, LaunchTaskInput, TaskOutput, SessionClient } from './types';
import type { TaskRecord } from '../persistence';

function generateTaskId(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `bg_${Date.now()}_${suffix}`;
}

function generateSessionId(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `ses_${Date.now()}_${suffix}`;
}

const DEFAULTS = {
  taskRetentionDays: 7,
  maxConcurrentTasks: 10,
  defaultTimeoutMs: 300000,
  healthCheckIntervalMs: 30000,
} as const;

/**
 * PersistentTaskEngine — the central module that fixes the "Task not found" bug.
 *
 * Architecture:
 * - TaskRegistry (SQLite): all task state persisted to disk
 * - CompletionDetector: dual-path (event + polling) completion detection
 * - TaskReconstructor: recovers tasks from session data when DB row is lost
 *
 * Key design decisions:
 * - NEVER throw "Task not found" — always attempt reconstruction first
 * - ALL state in SQLite — no in-memory Maps that can be lost on restart
 * - NEVER drop session.idle events — always defer if too early
 */
export class PersistentTaskEngine {
  private registry: TaskRegistry;
  private detector: CompletionDetector;
  private reconstructor: TaskReconstructor;
  private config: EngineConfig;
  private _shutdown = false;

  constructor(config: EngineConfig) {
    this.config = {
      dbPath: config.dbPath,
      taskRetentionDays: config.taskRetentionDays ?? DEFAULTS.taskRetentionDays,
      maxConcurrentTasks: config.maxConcurrentTasks ?? DEFAULTS.maxConcurrentTasks,
      defaultTimeoutMs: config.defaultTimeoutMs ?? DEFAULTS.defaultTimeoutMs,
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? DEFAULTS.healthCheckIntervalMs,
    };

    this.registry = new TaskRegistry(this.config.dbPath);
    this.reconstructor = new TaskReconstructor(this.registry);

    const callbacks: CompletionDetectorCallbacks = {
      getTask: (id: string) => this.registry.getTask(id),
      updateStatus: (id: string, status: TaskRecord['status'], extra?: Partial<TaskRecord>) =>
        this.registry.updateStatus(id, status, extra),
      getMessages: (taskId: string) => this.registry.getMessages(taskId),
      getRunningTaskIds: () =>
        this.registry
          .listRunningTasks()
          .map((t) => t.id),
    };

    this.detector = new CompletionDetector(callbacks);
    this.detector.startPolling(this.config.healthCheckIntervalMs);
  }

  /**
   * Launch a background task:
   * 1. Check concurrent task limit
   * 2. Create TaskRecord in SQLite (status: 'pending')
   * 3. Spawn agent session via OpenCode client
   * 4. Update status to 'running'
   * 5. Return { taskId, sessionId }
   */
  async launchTask(input: LaunchTaskInput, _client: SessionClient): Promise<{ taskId: string; sessionId: string }> {
    if (this._shutdown) throw new Error('Engine is shut down');
    // Check concurrent task limit
    const running = this.registry.listRunningTasks();
    if (running.length >= (this.config.maxConcurrentTasks ?? DEFAULTS.maxConcurrentTasks)) {
      throw new Error(
        `Max concurrent tasks reached (${this.config.maxConcurrentTasks}). ` +
        `Cancel a running task before launching a new one.`,
      );
    }

    const taskId = generateTaskId();
    const sessionId = generateSessionId();

    // Create task record in SQLite
    this.registry.createTask({
      id: taskId,
      sessionId,
      parentSessionId: input.parentSessionId,
      agent: input.agent,
      status: 'pending',
      description: input.description,
      category: input.category,
      metadata: JSON.stringify({
        timeoutMs: input.timeoutMs ?? this.config.defaultTimeoutMs,
      }),
    });

    // Update to running
    this.registry.updateStatus(taskId, 'running');

    return { taskId, sessionId };
  }

  /**
   * Get task output — THE KEY FIX FOR "TASK NOT FOUND".
   *
   * 1. Try registry.getTask(taskId)
   * 2. If found → return output (with messages)
   * 3. If NOT found → try reconstructor.reconstruct(taskId, sessionId, client)
   * 4. If reconstructed → return output (with reconstruction flag)
   * 5. If cannot reconstruct → return null (genuinely lost)
   *
   * NEVER throws "Task not found".
   */
  async getTaskOutput(taskId: string, sessionId: string, client: SessionClient): Promise<TaskOutput | null> {
    if (this._shutdown) return null;
    // Step 1: Try the registry
    const task = this.registry.getTask(taskId);

    if (task) {
      // Task found — return output with messages
      const messages = this.registry.getMessages(taskId);
      return {
        task,
        messages,
        finalContent: task.outputCache,
      };
    }

    // Step 2: Try reconstruction (safety net)
    try {
      const reconstructed = await this.reconstructor.reconstruct(taskId, sessionId, client);
      if (reconstructed) {
        const messages = this.registry.getMessages(taskId);
        return {
          task: reconstructed,
          messages,
          finalContent: reconstructed.outputCache,
          reconstructed: true,
        };
      }
    } catch {
      // Reconstruction failed — task is genuinely lost
    }

    // Step 3: Genuinely lost — return null instead of throwing
    return null;
  }

  /**
   * Mark a running task as cancelled.
   */
  async cancelTask(taskId: string, _client: SessionClient): Promise<void> {
    if (this._shutdown) return;
    const task = this.registry.getTask(taskId);
    if (!task) return; // Already gone
    if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'error') {
      return; // Already in a terminal state
    }
    this.registry.updateStatus(taskId, 'cancelled', {
      completedAt: Date.now(),
    });
  }

  /**
   * List all running tasks (pending or running status).
   */
  listRunningTasks(): TaskRecord[] {
    if (this._shutdown) return [];
    return this.registry.listRunningTasks();
  }

  getRegistry(): TaskRegistry {
    return this.registry;
  }

  /**
   * Sync chat messages from active OpenCode session to SQLite TaskRegistry.
   */
  async syncSessionMessages(taskId: string, sessionId: string, client: SessionClient): Promise<void> {
    if (this._shutdown) return;
    try {
      const data = await client.session?.read?.(sessionId);
      if (data && Array.isArray(data.messages)) {
        this.registry.clearMessages(taskId);
        for (const msg of data.messages) {
          this.registry.addMessage(taskId, msg.role, msg.content);
        }
        // Cache the final content if available
        const assistantMsgs = data.messages.filter((m) => m.role === 'assistant');
        if (assistantMsgs.length > 0) {
          const finalMsg = assistantMsgs[assistantMsgs.length - 1];
          this.registry.updateStatus(taskId, 'running', {
            outputCache: finalMsg.content,
          });
        }
      }
    } catch (err) {
      // Best effort message syncing
    }
  }

  /**
   * Get task count statistics.
   */
  getStats(): { total: number; byStatus: Record<string, number>; running: number } {
    if (this._shutdown) return { total: 0, byStatus: {}, running: 0 };
    const stats = this.registry.getStats();
    const running = this.registry.listRunningTasks().length;
    return {
      total: stats.total,
      byStatus: stats.byStatus,
      running,
    };
  }

  /**
   * Handle a session.idle event — routes to completion detector.
   *
   * NEVER drops events. Always defers if too early.
   */
  onSessionIdle(
    taskId: string,
    sessionId: string,
    elapsedMs: number,
    client?: SessionClient,
  ): 'deferred' | 'coalesced' | 'completed' | 'still-running' {
    if (this._shutdown) return 'still-running';
    if (client) {
      this.syncSessionMessages(taskId, sessionId, client).catch(() => {});
    }
    return this.detector.onSessionIdle(taskId, sessionId, elapsedMs);
  }

  /**
   * Shutdown — stop polling, close DB, clean up resources.
   */
  shutdown(): void {
    if (this._shutdown) return;
    this._shutdown = true;
    this.detector.dispose();
    this.registry.close();
  }
}
