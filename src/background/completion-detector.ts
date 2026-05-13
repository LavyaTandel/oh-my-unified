import type { TaskRecord } from '../persistence';

export const MIN_IDLE_MS = 100;
export const POLL_INTERVAL_MS = 2000;
export const STABILITY_THRESHOLD = 3;

export interface CompletionDetectorCallbacks {
  getTask(id: string): TaskRecord | null;
  updateStatus(id: string, status: TaskRecord['status'], extra?: Partial<TaskRecord>): void;
  getMessages(taskId: string): Array<{ role: string; content: string; timestamp?: number }>;
  getRunningTaskIds(): string[];
}

/**
 * Dual-path completion detection:
 * - Path A: Event-driven (session.idle) — never drops, always defers if too early
 * - Path B: Polling (every 2s) — checks all running tasks via message stability
 *
 * This approach fixes the bug where fast tasks finish before the next poll tick,
 * leaving them stuck permanently in "running" state.
 */
export class CompletionDetector {
  private callbacks: CompletionDetectorCallbacks;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private deferredChecks: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private messageCountSnapshot: Map<string, number> = new Map();
  private messageCountStable: Map<string, number> = new Map();

  constructor(callbacks: CompletionDetectorCallbacks) {
    this.callbacks = callbacks;
  }

  // ============================================================
  // Path A: Event-driven
  // ============================================================

  /**
   * Called when a session.idle event is received.
   *
   * - If elapsedMs < MIN_IDLE_MS: schedule a deferred check (never drop!)
   * - If elapsedMs >= MIN_IDLE_MS: check session messages for final content
   *
   * Returns 'deferred' | 'completed' | 'still-running'
   */
  onSessionIdle(
    taskId: string,
    _sessionId: string,
    elapsedMs: number,
  ): 'deferred' | 'completed' | 'still-running' {
    // Path A1: Too early — defer, never drop
    if (elapsedMs < MIN_IDLE_MS) {
      const remaining = MIN_IDLE_MS - elapsedMs;
      this.scheduleDeferredCheck(taskId, remaining);
      return 'deferred';
    }

    // Path A2: Check if the task has completed
    const messages = this.callbacks.getMessages(taskId);
    const hasFinalContent = messages.some(
      (m) => (m.role === 'assistant' || m.role === 'agent') && m.content && m.content.length > 0,
    );

    if (hasFinalContent) {
      // Find the final assistant/agent message content
      const finalMessages = messages.filter(
        (m) => (m.role === 'assistant' || m.role === 'agent') && m.content,
      );
      const finalContent = finalMessages.length > 0
        ? finalMessages[finalMessages.length - 1].content
        : undefined;

      this.callbacks.updateStatus(taskId, 'completed', {
        outputCache: finalContent,
        completedAt: Date.now(),
      });
      this.cleanupDeferred(taskId);
      return 'completed';
    }

    // No agent output yet — schedule a re-check
    this.scheduleDeferredCheck(taskId, 500);
    return 'still-running';
  }

  // ============================================================
  // Path B: Polling
  // ============================================================

  /**
   * Called on each poll tick. Checks all running tasks for:
   * - Message count stability (same count for STABILITY_THRESHOLD consecutive polls = done)
   */
  async onPollTick(): Promise<void> {
    const runningIds = this.callbacks.getRunningTaskIds();

    for (const taskId of runningIds) {
      const messages = this.callbacks.getMessages(taskId);
      const currentCount = messages.length;
      const prevCount = this.messageCountSnapshot.get(taskId) ?? -1;
      const stableCount = this.messageCountStable.get(taskId) ?? 0;

      if (currentCount === prevCount && currentCount > 0) {
        // Message count hasn't changed — increment stability counter
        const newStable = stableCount + 1;
        this.messageCountStable.set(taskId, newStable);

        if (newStable >= STABILITY_THRESHOLD) {
          // Task appears complete — mark as completed
          const finalContent = this.extractFinalContent(messages);
          this.callbacks.updateStatus(taskId, 'completed', {
            outputCache: finalContent,
            completedAt: Date.now(),
          });
          this.cleanupPollingState(taskId);
        }
      } else {
        // Message count changed or messages cleared — reset stability
        this.messageCountSnapshot.set(taskId, currentCount);
        this.messageCountStable.set(taskId, 0);
      }
    }

    // Clean up polling state for tasks no longer running
    this.cleanupStalePollingState(runningIds);
  }

  // ============================================================
  // Polling lifecycle
  // ============================================================

  startPolling(intervalMs: number = POLL_INTERVAL_MS): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.onPollTick().catch(() => {
        // poll errors are silent — individual task checks fail independently
      });
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // ============================================================
  // Internal helpers
  // ============================================================

  private scheduleDeferredCheck(taskId: string, delayMs: number): void {
    // Cancel existing deferred check if any
    this.cleanupDeferred(taskId);

    const timer = setTimeout(() => {
      this.deferredChecks.delete(taskId);
      // When the deferred check fires, treat it as an idle event with sufficient elapsed time
      this.onSessionIdle(taskId, '', MIN_IDLE_MS + 1);
    }, delayMs);

    // Don't prevent process exit
    if (typeof timer === 'object' && 'unref' in timer) {
      (timer as NodeJS.Timeout).unref();
    }

    this.deferredChecks.set(taskId, timer);
  }

  private cleanupDeferred(taskId: string): void {
    const existing = this.deferredChecks.get(taskId);
    if (existing) {
      clearTimeout(existing);
      this.deferredChecks.delete(taskId);
    }
  }

  private cleanupPollingState(taskId: string): void {
    this.messageCountSnapshot.delete(taskId);
    this.messageCountStable.delete(taskId);
  }

  private cleanupStalePollingState(runningIds: Set<string> | string[]): void {
    const runningSet = runningIds instanceof Set ? runningIds : new Set(runningIds);
    for (const taskId of this.messageCountSnapshot.keys()) {
      if (!runningSet.has(taskId)) {
        this.cleanupPollingState(taskId);
      }
    }
  }

  private extractFinalContent(
    messages: Array<{ role: string; content: string; timestamp?: number }>,
  ): string | undefined {
    const finalMessages = messages.filter(
      (m) => (m.role === 'assistant' || m.role === 'agent') && m.content,
    );
    return finalMessages.length > 0
      ? finalMessages[finalMessages.length - 1].content
      : undefined;
  }

  /**
   * Clean up all resources. Call during shutdown.
   */
  dispose(): void {
    this.stopPolling();
    for (const [taskId] of this.deferredChecks) {
      this.cleanupDeferred(taskId);
    }
    this.messageCountSnapshot.clear();
    this.messageCountStable.clear();
  }
}
