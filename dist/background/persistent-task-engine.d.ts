import { TaskRegistry } from '../persistence';
import type { EngineConfig, LaunchTaskInput, TaskOutput, SessionClient } from './types';
import type { TaskRecord } from '../persistence';
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
export declare class PersistentTaskEngine {
    private registry;
    private detector;
    private reconstructor;
    private config;
    private _shutdown;
    constructor(config: EngineConfig);
    /**
     * Launch a background task:
     * 1. Check concurrent task limit
     * 2. Create TaskRecord in SQLite (status: 'pending')
     * 3. Spawn agent session via OpenCode client
     * 4. Update status to 'running'
     * 5. Return { taskId, sessionId }
     */
    launchTask(input: LaunchTaskInput, _client: SessionClient): Promise<{
        taskId: string;
        sessionId: string;
    }>;
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
    getTaskOutput(taskId: string, sessionId: string, client: SessionClient): Promise<TaskOutput | null>;
    /**
     * Mark a running task as cancelled.
     */
    cancelTask(taskId: string, _client: SessionClient): Promise<void>;
    /**
     * List all running tasks (pending or running status).
     */
    listRunningTasks(): TaskRecord[];
    getRegistry(): TaskRegistry;
    /**
     * Sync chat messages from active OpenCode session to SQLite TaskRegistry.
     */
    syncSessionMessages(taskId: string, sessionId: string, client: SessionClient): Promise<void>;
    /**
     * Get task count statistics.
     */
    getStats(): {
        total: number;
        byStatus: Record<string, number>;
        running: number;
    };
    /**
     * Handle a session.idle event — routes to completion detector.
     *
     * NEVER drops events. Always defers if too early.
     */
    onSessionIdle(taskId: string, sessionId: string, elapsedMs: number, client?: SessionClient): 'deferred' | 'coalesced' | 'completed' | 'still-running';
    /**
     * Shutdown — stop polling, close DB, clean up resources.
     */
    shutdown(): void;
}
//# sourceMappingURL=persistent-task-engine.d.ts.map