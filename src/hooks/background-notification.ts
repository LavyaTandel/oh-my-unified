import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';
import type { PersistentTaskEngine } from '../background/persistent-task-engine';

/**
 * Configuration for background notification routing.
 */
export interface BackgroundNotificationConfig {
  /** Enable background notification routing (default: true) */
  enabled?: boolean;
  /** Additional event types to listen for */
  extraEvents?: string[];
  /** Reference to the PersistentTaskEngine */
  taskEngine?: PersistentTaskEngine;
}

const DEFAULT_EVENTS = [
  'oh-my-unified.session.idle',
  'oh-my-unified.message.updated',
  'oh-my-unified.todo.updated',
  'oh-my-unified.session.error',
  'oh-my-unified.task.completed',
  'oh-my-unified.background.stopped',
] as const;

type BackgroundEvent = (typeof DEFAULT_EVENTS)[number] | string;

/**
 * Creates a hook that routes background task lifecycle events to the
 * background manager and system observer. Listens for session state
 * changes, task completion, and error signals — forwarding actionable
 * payloads to the appropriate subsystems.
 */
export function createBackgroundNotificationHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: BackgroundNotificationConfig,
) {
  const cfg: Required<BackgroundNotificationConfig> = {
    enabled: true,
    extraEvents: [],
    taskEngine: undefined as any,
    ...hookConfig,
  };

  const watchedEvents = new Set<BackgroundEvent>([
    ...DEFAULT_EVENTS,
    ...(cfg.extraEvents ?? []),
  ]);

  /**
   * session.idle — fires when the session enters idle state
   * (no active task or user interaction for a period).
   */
  async function handleSessionIdle(
    input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.session.idle')) return;
    log('[background-notification] oh-my-unified.session.idle — no active background tasks');

    const event = input.event as Record<string, any> | undefined;
    const props = event?.properties as Record<string, any> | undefined;
    const taskId = props?.taskId as string | undefined;
    const sessionId = props?.sessionId as string | undefined;
    const elapsedMs = (props?.elapsedMs as number) ?? 0;

    if (taskId && sessionId && cfg.taskEngine) {
      cfg.taskEngine.onSessionIdle(taskId, sessionId, elapsedMs, _ctx as any);
    }
  }

  /**
   * message.updated — fires when a background agent produces a new message.
   */
  async function handleMessageUpdated(
    input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.message.updated')) return;
    log('[background-notification] oh-my-unified.message.updated — background agent produced output');

    const event = input.event as Record<string, any> | undefined;
    const props = event?.properties as Record<string, any> | undefined;
    const taskId = props?.taskId as string | undefined;
    const sessionId = props?.sessionId as string | undefined;

    if (taskId && sessionId && cfg.taskEngine) {
      cfg.taskEngine.syncSessionMessages(taskId, sessionId, _ctx as any).catch(() => {});
    }
  }

  /**
   * todo.updated — fires when the todo list is modified by a background agent.
   */
  async function handleTodoUpdated(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.todo.updated')) return;
    log('[background-notification] oh-my-unified.todo.updated — background task updated todos');
  }

  /**
   * session.error — fires when a background session encounters an error.
   */
  async function handleSessionError(
    input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.session.error')) return;
    log('[background-notification] oh-my-unified.session.error — background session encountered error');

    const event = input.event as Record<string, any> | undefined;
    const props = event?.properties as Record<string, any> | undefined;
    const taskId = props?.taskId as string | undefined;

    if (taskId && cfg.taskEngine) {
      cfg.taskEngine.getRegistry().updateStatus(taskId, 'error', {
        completedAt: Date.now(),
      });
    }
  }

  /**
   * task.completed — fires when a background task finishes execution.
   */
  async function handleTaskCompleted(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.task.completed')) return;
    log('[background-notification] oh-my-unified.task.completed — background task finished');
  }

  /**
   * background.stopped — fires when the background engine stops.
   */
  async function handleBackgroundStopped(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('oh-my-unified.background.stopped')) return;
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
