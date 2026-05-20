import type { TaskRecord } from '../persistence';
export declare const MIN_IDLE_MS = 100;
export declare const POLL_INTERVAL_MS = 2000;
export declare const STABILITY_THRESHOLD = 3;
export declare const IDLE_COALESCE_MS = 100;
export interface CompletionDetectorCallbacks {
    getTask(id: string): TaskRecord | null;
    updateStatus(id: string, status: TaskRecord['status'], extra?: Partial<TaskRecord>): void;
    getMessages(taskId: string): Array<{
        role: string;
        content: string;
        timestamp?: number;
    }>;
    getRunningTaskIds(): string[];
}
/**
 * Dual-path completion detection:
 * - Path A: Event-driven (session.idle) — never drops, always defers if too early
 * - Path B: Polling (every 2s) — checks all running tasks via message stability
 *
 * Idle coalescing: rapid-fire idle notifications from the parent session are
 * debounced with a 100ms window. Only the last idle event in a burst triggers
 * completion detection, preventing redundant checks and race conditions.
 *
 * This approach fixes the bug where fast tasks finish before the next poll tick,
 * leaving them stuck permanently in "running" state.
 */
export declare class CompletionDetector {
    private callbacks;
    private pollInterval;
    private deferredChecks;
    private messageCountSnapshot;
    private messageCountStable;
    private idleCoalesceTimers;
    private pendingIdlePayloads;
    constructor(callbacks: CompletionDetectorCallbacks);
    /**
     * Called when a session.idle event is received.
     *
     * Rapid-fire idle events are coalesced: we schedule a 100ms debounce timer
     * and only process the LAST idle event in the burst. This prevents
     * redundant completion checks when the parent fires multiple idle events
     * in quick succession.
     *
     * - If elapsedMs < MIN_IDLE_MS: schedule a deferred check (never drop!)
     * - If elapsedMs >= MIN_IDLE_MS: check session messages for final content
     *
     * Returns 'deferred' | 'coalesced' | 'completed' | 'still-running'
     */
    onSessionIdle(taskId: string, sessionId: string, elapsedMs: number): 'deferred' | 'coalesced' | 'completed' | 'still-running';
    /**
     * Process a single idle event after coalescing debounce window.
     */
    private processIdleEvent;
    /**
     * Called on each poll tick. Checks all running tasks for:
     * - Message count stability (same count for STABILITY_THRESHOLD consecutive polls = done)
     */
    onPollTick(): Promise<void>;
    startPolling(intervalMs?: number): void;
    stopPolling(): void;
    private scheduleDeferredCheck;
    private cleanupDeferred;
    private cleanupPollingState;
    private cleanupStalePollingState;
    private extractFinalContent;
    /**
     * Clean up all resources. Call during shutdown.
     */
    dispose(): void;
}
//# sourceMappingURL=completion-detector.d.ts.map