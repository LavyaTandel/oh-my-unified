import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * A serialisable representation of a single todo item.
 */
export interface TodoItem {
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'high' | 'medium' | 'low';
}
/**
 * Saved todo continuation state.
 */
export interface TodoContinuationState {
    todos: TodoItem[];
    activeSessionId?: string;
    currentTaskIndex?: number;
    metadata: Record<string, unknown>;
    savedAt: number;
}
/**
 * Configuration for todo continuation.
 */
export interface TodoContinuationConfig {
    /** Enable todo continuation (default: true) */
    enabled?: boolean;
    /** Auto-restore on session start (default: true) */
    autoRestore?: boolean;
    /** Auto-save on session events (default: true) */
    autoSave?: boolean;
}
/**
 * Creates a hook that saves the current todo list state to persistent
 * storage and restores it when a new session begins. This enables task
 * continuation across session boundaries — if work was interrupted,
 * the next session picks up where the last one left off.
 */
export declare function createTodoContinuationHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: TodoContinuationConfig): {
    saveTodos: (todos: TodoItem[], sessionId?: string, metadata?: Record<string, unknown>) => void;
    restoreTodos: () => TodoContinuationState | null;
    updateTodos: (todos: TodoItem[], sessionId?: string) => void;
    clearTodos: () => void;
    getTodos: () => TodoItem[];
    'session.start': (_input: Record<string, unknown>, output: Record<string, unknown>) => Promise<void>;
    'session.end': (_input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'todo.updated': (input: {
        todos?: TodoItem[];
    }, _output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=todo-continuation.d.ts.map