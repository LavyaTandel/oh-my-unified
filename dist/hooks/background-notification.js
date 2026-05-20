import { log } from '../utils/logger';
const DEFAULT_EVENTS = [
    'oh-my-unified.session.idle',
    'oh-my-unified.message.updated',
    'oh-my-unified.todo.updated',
    'oh-my-unified.session.error',
    'oh-my-unified.task.completed',
    'oh-my-unified.background.stopped',
];
/**
 * Creates a hook that routes background task lifecycle events to the
 * background manager and system observer. Listens for session state
 * changes, task completion, and error signals — forwarding actionable
 * payloads to the appropriate subsystems.
 */
export function createBackgroundNotificationHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        extraEvents: [],
        taskEngine: undefined,
        ...hookConfig,
    };
    const watchedEvents = new Set([
        ...DEFAULT_EVENTS,
        ...(cfg.extraEvents ?? []),
    ]);
    /**
     * session.idle — fires when the session enters idle state
     * (no active task or user interaction for a period).
     */
    async function handleSessionIdle(input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.session.idle'))
            return;
        log('[background-notification] oh-my-unified.session.idle — no active background tasks');
        const event = input.event;
        const props = event?.properties;
        const taskId = props?.taskId;
        const sessionId = props?.sessionId;
        const elapsedMs = props?.elapsedMs ?? 0;
        if (taskId && sessionId && cfg.taskEngine) {
            cfg.taskEngine.onSessionIdle(taskId, sessionId, elapsedMs, _ctx);
        }
    }
    /**
     * message.updated — fires when a background agent produces a new message.
     */
    async function handleMessageUpdated(input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.message.updated'))
            return;
        log('[background-notification] oh-my-unified.message.updated — background agent produced output');
        const event = input.event;
        const props = event?.properties;
        const taskId = props?.taskId;
        const sessionId = props?.sessionId;
        if (taskId && sessionId && cfg.taskEngine) {
            cfg.taskEngine.syncSessionMessages(taskId, sessionId, _ctx).catch(() => { });
        }
    }
    /**
     * todo.updated — fires when the todo list is modified by a background agent.
     */
    async function handleTodoUpdated(_input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.todo.updated'))
            return;
        log('[background-notification] oh-my-unified.todo.updated — background task updated todos');
    }
    /**
     * session.error — fires when a background session encounters an error.
     */
    async function handleSessionError(input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.session.error'))
            return;
        log('[background-notification] oh-my-unified.session.error — background session encountered error');
        const event = input.event;
        const props = event?.properties;
        const taskId = props?.taskId;
        if (taskId && cfg.taskEngine) {
            cfg.taskEngine.getRegistry().updateStatus(taskId, 'error', {
                completedAt: Date.now(),
            });
        }
    }
    /**
     * task.completed — fires when a background task finishes execution.
     */
    async function handleTaskCompleted(_input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.task.completed'))
            return;
        log('[background-notification] oh-my-unified.task.completed — background task finished');
    }
    /**
     * background.stopped — fires when the background engine stops.
     */
    async function handleBackgroundStopped(_input, _output) {
        if (!cfg.enabled || !watchedEvents.has('oh-my-unified.background.stopped'))
            return;
        log('[background-notification] oh-my-unified.background.stopped — background engine halted');
    }
    return {
        'oh-my-unified.session.idle': handleSessionIdle,
        'oh-my-unified.message.updated': handleMessageUpdated,
        'oh-my-unified.todo.updated': handleTodoUpdated,
        'oh-my-unified.session.error': handleSessionError,
        'oh-my-unified.task.completed': handleTaskCompleted,
        'oh-my-unified.background.stopped': handleBackgroundStopped,
    };
}
//# sourceMappingURL=background-notification.js.map