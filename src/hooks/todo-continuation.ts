import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';
import { getPersistedData, setPersistedData } from '../utils/persist';
import type { TaskRecord } from '../persistence';

const STORAGE_KEY = 'todo-continuation';

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
export function createTodoContinuationHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: TodoContinuationConfig,
) {
  const cfg: Required<TodoContinuationConfig> = {
    enabled: true,
    autoRestore: true,
    autoSave: true,
    ...hookConfig,
  };

  let currentTodos: TodoItem[] = [];
  let hasRestored = false;
  let sessionActive = false;

  /**
   * Saves the current todo state to persistent storage.
   */
  function saveTodos(
    todos: TodoItem[],
    sessionId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!cfg.enabled || !cfg.autoSave) return;

    const state: TodoContinuationState = {
      todos,
      activeSessionId: sessionId,
      metadata: metadata ?? {},
      savedAt: Date.now(),
    };

    try {
      setPersistedData(STORAGE_KEY, state);
      log(`[todo-continuation] saved ${todos.length} todo(s)`);
    } catch (err) {
      log(`[todo-continuation] failed to save: ${err}`);
    }
  }

  /**
   * Restores saved todo state from persistent storage.
   * Returns the saved state, or null if none exists.
   */
  function restoreTodos(): TodoContinuationState | null {
    if (!cfg.enabled || !cfg.autoRestore) return null;

    try {
      const saved = getPersistedData<TodoContinuationState | null>(
        STORAGE_KEY,
        null,
      );
      if (!saved) return null;

      currentTodos = saved.todos;
      hasRestored = true;
      log(
        `[todo-continuation] restored ${saved.todos.length} todo(s) ` +
        `from session "${saved.activeSessionId ?? 'unknown'}"`,
      );
      return saved;
    } catch (err) {
      log(`[todo-continuation] failed to restore: ${err}`);
      return null;
    }
  }

  /**
   * Updates the current todo list in memory and optionally persists it.
   */
  function updateTodos(
    todos: TodoItem[],
    sessionId?: string,
  ): void {
    currentTodos = [...todos];
    if (cfg.autoSave) {
      saveTodos(currentTodos, sessionId);
    }
  }

  /**
   * Clears saved todo state (e.g. when all tasks are complete).
   */
  function clearTodos(): void {
    currentTodos = [];
    try {
      setPersistedData(STORAGE_KEY, null);
      log('[todo-continuation] cleared saved todos');
    } catch (err) {
      log(`[todo-continuation] failed to clear: ${err}`);
    }
  }

  /**
   * Returns the current in-memory todo list.
   */
  function getTodos(): TodoItem[] {
    return [...currentTodos];
  }

  /**
   * Hook that fires when the session starts. Automatically restores
   * saved todos if enabled.
   */
  async function handleSessionStart(
    _input: Record<string, unknown>,
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    sessionActive = true;

    if (cfg.autoRestore) {
      const saved = restoreTodos();
      if (saved && saved.todos.length > 0) {
        (output as Record<string, unknown>).restoredTodos = saved.todos;
        log(
          `[todo-continuation] session start — restored ${saved.todos.length} todo(s)`,
        );
      }
    }
  }

  /**
   * Hook that fires when the session ends. Auto-saves current todos.
   */
  async function handleSessionEnd(
    _input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    sessionActive = false;

    if (cfg.autoSave && currentTodos.length > 0) {
      saveTodos(currentTodos);
      log(
        `[todo-continuation] session end — saved ${currentTodos.length} todo(s)`,
      );
    }
  }

  /**
   * Hook that fires on todo updates. Persists the new state.
   */
  async function handleTodoUpdated(
    input: { todos?: TodoItem[] },
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled || !cfg.autoSave) return;
    if (!input.todos) return;

    currentTodos = input.todos;
    saveTodos(currentTodos);
  }

  return {
    saveTodos,
    restoreTodos,
    updateTodos,
    clearTodos,
    getTodos,
    'session.start': handleSessionStart,
    'session.end': handleSessionEnd,
    'todo.updated': handleTodoUpdated,
  };
}
