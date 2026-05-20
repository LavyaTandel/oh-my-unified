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
export class TaskReconstructor {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
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
    async reconstruct(taskId, sessionId, client) {
        const recovered = await this.recoverSessionData(taskId, sessionId, client);
        if (!recovered)
            return null;
        const now = Date.now();
        const record = {
            id: taskId,
            sessionId,
            agent: recovered.agentName,
            status: recovered.status,
            description: recovered.description,
            category: 'reconstructed',
            completedAt: recovered.status === 'completed' || recovered.status === 'error'
                ? now
                : undefined,
            outputCache: this.extractFinalContent(recovered.messages),
            metadata: JSON.stringify({ reconstructed: true, recoveredAt: now }),
        };
        const task = this.registry.createTask(record);
        // Restore messages
        for (const msg of recovered.messages) {
            this.registry.addMessage(taskId, msg.role, msg.content);
        }
        return task;
    }
    async recoverSessionData(taskId, sessionId, client) {
        // Strategy: try session.read first (richest data), fall back to session.info
        let messages = [];
        let status = 'completed';
        let agentName = 'unknown';
        let description = `Reconstructed task ${taskId}`;
        // Try session.read
        if (client.session?.read) {
            try {
                const readResult = await client.session.read(sessionId);
                if (readResult) {
                    if (readResult.messages && Array.isArray(readResult.messages)) {
                        messages = readResult.messages.map((m) => ({
                            role: m.role ?? 'unknown',
                            content: m.content ?? '',
                            timestamp: m.ts ?? m.timestamp ?? Date.now(),
                        }));
                    }
                    if (readResult.status) {
                        status = this.mapStatus(readResult.status);
                    }
                    // If we have messages, we can infer agent and description
                    if (messages.length > 0) {
                        const firstMsg = messages[0];
                        agentName = firstMsg.role === 'user' ? 'orchestrator' : firstMsg.role;
                        description = messages
                            .filter((m) => m.role === 'user')
                            .map((m) => m.content.slice(0, 100))
                            .join('; ') || `Reconstructed from session ${sessionId}`;
                    }
                    return { messages, status, agentName, description };
                }
            }
            catch {
                // session.read failed — fall through to session.info
            }
        }
        // Fallback: try session.info
        if (client.session?.info) {
            try {
                const infoResult = await client.session.info(sessionId);
                if (infoResult) {
                    // Even without messages, we can create a minimal record
                    return {
                        messages: [], // No messages recovered
                        status: infoResult.status ?? 'completed',
                        agentName: agentName,
                        description: `Reconstructed from session info: ${infoResult.status ?? 'completed'}`,
                    };
                }
            }
            catch {
                // session.info failed too — task is genuinely lost
            }
        }
        return null;
    }
    mapStatus(sessionStatus) {
        switch (sessionStatus) {
            case 'completed':
            case 'finished':
            case 'done':
                return 'completed';
            case 'error':
            case 'failed':
            case 'errored':
                return 'error';
            case 'running':
            case 'active':
            case 'in_progress':
                return 'running';
            case 'cancelled':
            case 'canceled':
                return 'cancelled';
            default:
                return 'completed';
        }
    }
    extractFinalContent(messages) {
        const finalMessages = messages.filter((m) => (m.role === 'assistant' || m.role === 'agent') && m.content);
        return finalMessages.length > 0
            ? finalMessages[finalMessages.length - 1].content
            : undefined;
    }
}
//# sourceMappingURL=reconstructor.js.map