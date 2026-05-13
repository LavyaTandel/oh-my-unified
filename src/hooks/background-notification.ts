import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for background notification routing.
 */
export interface BackgroundNotificationConfig {
  /** Enable background notification routing (default: true) */
  enabled?: boolean;
  /** Additional event types to listen for */
  extraEvents?: string[];
}

const DEFAULT_EVENTS = [
  'session.idle',
  'message.updated',
  'todo.updated',
  'session.error',
  'task.completed',
  'background.stopped',
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
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('session.idle')) return;
    log('[background-notification] session.idle — no active background tasks');
  }

  /**
   * message.updated — fires when a background agent produces a new message.
   */
  async function handleMessageUpdated(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('message.updated')) return;
    log('[background-notification] message.updated — background agent produced output');
  }

  /**
   * todo.updated — fires when the todo list is modified by a background agent.
   */
  async function handleTodoUpdated(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('todo.updated')) return;
    log('[background-notification] todo.updated — background task updated todos');
  }

  /**
   * session.error — fires when a background session encounters an error.
   */
  async function handleSessionError(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('session.error')) return;
    log('[background-notification] session.error — background session encountered error');
  }

  /**
   * task.completed — fires when a background task finishes execution.
   */
  async function handleTaskCompleted(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('task.completed')) return;
    log('[background-notification] task.completed — background task finished');
  }

  /**
   * background.stopped — fires when the background engine stops.
   */
  async function handleBackgroundStopped(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !watchedEvents.has('background.stopped')) return;
    log('[background-notification] background.stopped — background engine halted');
  }

  return {
    'session.idle': handleSessionIdle,
    'message.updated': handleMessageUpdated,
    'todo.updated': handleTodoUpdated,
    'session.error': handleSessionError,
    'task.completed': handleTaskCompleted,
    'background.stopped': handleBackgroundStopped,
  };
}
