import type { TaskRegistry } from '../persistence';
import type { TaskRecord } from '../persistence';
import type { SessionClient } from './types';
/**
 * TaskReconstructor — recovers task state from session data when the DB row is lost.
 *
 * This is the safety net for the "Task not found" bug:
 * 1. Task registry doesn't have the row (lost during compaction/restart)
 * 2. Reconstructor pulls data from session_read() and session_info()
 * 3. Creates a new TaskRecord in the registry
 * 4. Returns the reconstructed task
 *
 * If the session is also gone, the task is genuinely lost.
 */
export declare class TaskReconstructor {
    private registry;
    constructor(registry: TaskRegistry);
    /**
     * Attempt to reconstruct a task from session data.
     *
     * Steps:
     * 1. Query session.info(id) for metadata
     * 2. Query session.read(id) for messages
     * 3. Create a TaskRecord with recovered data
     * 4. Store messages in the registry
     * 5. If both session.info and session.read fail, return null (genuinely lost)
     */
    reconstruct(taskId: string, sessionId: string, client: SessionClient): Promise<TaskRecord | null>;
    private recoverSessionData;
    private mapStatus;
    private extractFinalContent;
}
//# sourceMappingURL=reconstructor.d.ts.map