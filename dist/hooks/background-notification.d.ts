import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
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
/**
 * Creates a hook that routes background task lifecycle events to the
 * background manager and system observer. Listens for session state
 * changes, task completion, and error signals — forwarding actionable
 * payloads to the appropriate subsystems.
 */
export declare function createBackgroundNotificationHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: BackgroundNotificationConfig): {
    'oh-my-unified.session.idle': (input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'oh-my-unified.message.updated': (input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'oh-my-unified.todo.updated': (_input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'oh-my-unified.session.error': (input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'oh-my-unified.task.completed': (_input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'oh-my-unified.background.stopped': (_input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=background-notification.d.ts.map