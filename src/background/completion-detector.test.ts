import { describe, expect, test, beforeEach, afterEach, jest } from 'bun:test';
import { CompletionDetector, MIN_IDLE_MS, STABILITY_THRESHOLD, type CompletionDetectorCallbacks } from './completion-detector';
import type { TaskRecord } from '../persistence';

function createMockCallbacks(): CompletionDetectorCallbacks & {
  _tasks: Map<string, Partial<TaskRecord>>;
  _messages: Map<string, Array<{ role: string; content: string; timestamp?: number }>>;
  _updated: Array<{ id: string; status: string; extra?: Partial<TaskRecord> }>;
} {
  const _tasks = new Map<string, Partial<TaskRecord>>();
  const _messages = new Map<string, Array<{ role: string; content: string; timestamp?: number }>>();
  const _updated: Array<{ id: string; status: string; extra?: Partial<TaskRecord> }> = [];

  return {
    _tasks,
    _messages,
    _updated,
    getTask: (id: string) => (_tasks.get(id) as TaskRecord) ?? null,
    updateStatus: (id: string, status: TaskRecord['status'], extra?: Partial<TaskRecord>) => {
      _updated.push({ id, status, extra });
    },
    getMessages: (taskId: string) => _messages.get(taskId) ?? [],
    getRunningTaskIds: () => {
      const running: string[] = [];
      for (const [id, t] of _tasks) {
        if (t.status === 'running') running.push(id);
      }
      return running;
    },
  };
}

describe('CompletionDetector', () => {
  let callbacks: ReturnType<typeof createMockCallbacks>;
  let detector: CompletionDetector;

  beforeEach(() => {
    callbacks = createMockCallbacks();
    detector = new CompletionDetector(callbacks);
  });

  afterEach(() => {
    detector.dispose();
  });

  // ============================================================
  // 1. onSessionIdle defers when elapsed < MIN_IDLE_MS
  // ============================================================
  test('1. onSessionIdle defers when elapsed < MIN_IDLE_MS', () => {
    const result = detector.onSessionIdle('bg_001', 'ses_001', 10);
    expect(result).toBe('deferred');
    // No update should have happened yet
    expect(callbacks._updated.length).toBe(0);
  });

  // ============================================================
  // 2. onSessionIdle marks completed when session has assistant output
  // ============================================================
  test('2. onSessionIdle marks completed when session has agent output', () => {
    callbacks._messages.set('bg_001', [
      { role: 'user', content: 'do something' },
      { role: 'assistant', content: 'here is the result' },
    ]);

    const result = detector.onSessionIdle('bg_001', 'ses_001', 200);

    expect(result).toBe('completed');
    expect(callbacks._updated.length).toBe(1);
    expect(callbacks._updated[0].id).toBe('bg_001');
    expect(callbacks._updated[0].status).toBe('completed');
    expect(callbacks._updated[0].extra?.outputCache).toBe('here is the result');
  });

  // ============================================================
  // 3. onSessionIdle returns still-running when no agent output yet
  // ============================================================
  test('3. onSessionIdle returns still-running when no agent output', () => {
    callbacks._messages.set('bg_001', [
      { role: 'user', content: 'do something' },
    ]);

    const result = detector.onSessionIdle('bg_001', 'ses_001', 200);

    expect(result).toBe('still-running');
    // Should NOT have updated status
    expect(callbacks._updated.length).toBe(0);
  });

  // ============================================================
  // 4. onSessionIdle picks final assistant message
  // ============================================================
  test('4. onSessionIdle picks final assistant message', () => {
    callbacks._messages.set('bg_001', [
      { role: 'user', content: 'help' },
      { role: 'assistant', content: 'step one' },
      { role: 'tool', content: 'result' },
      { role: 'assistant', content: 'final answer' },
    ]);

    const result = detector.onSessionIdle('bg_001', 'ses_001', 200);

    expect(result).toBe('completed');
    expect(callbacks._updated[0].extra?.outputCache).toBe('final answer');
  });

  // ============================================================
  // 5. onPollTick detects completion via message stability
  // ============================================================
  test('5. onPollTick detects completion via message stability', () => {
    callbacks._tasks.set('bg_001', { id: 'bg_001', status: 'running' });
    callbacks._messages.set('bg_001', [
      { role: 'user', content: 'test' },
      { role: 'assistant', content: 'done' },
    ]);

    // First poll sets the snapshot, then need STABILITY_THRESHOLD stable checks
    for (let i = 0; i < STABILITY_THRESHOLD + 1; i++) {
      detector.onPollTick();
    }

    expect(callbacks._updated.length).toBe(1);
    expect(callbacks._updated[0].id).toBe('bg_001');
    expect(callbacks._updated[0].status).toBe('completed');
  });

  // ============================================================
  // 6. onPollTick resets stability when messages change
  // ============================================================
  test('6. onPollTick resets stability when messages change', () => {
    callbacks._tasks.set('bg_001', { id: 'bg_001', status: 'running' });
    callbacks._messages.set('bg_001', [{ role: 'user', content: 'initial' }]);

    // First tick: count=1
    detector.onPollTick();

    // Change messages (simulating new data)
    callbacks._messages.set('bg_001', [
      { role: 'user', content: 'initial' },
      { role: 'assistant', content: 'processing...' },
    ]);

    // Second tick: count changed (2 vs 1) — should reset stability
    detector.onPollTick();

    // Third tick: stable again at 2
    detector.onPollTick();

    // Should NOT have completed yet (only 1 stable tick after reset)
    expect(callbacks._updated.length).toBe(0);

    // More ticks to pass threshold
    for (let i = 0; i < STABILITY_THRESHOLD - 1; i++) {
      detector.onPollTick();
    }

    expect(callbacks._updated.length).toBe(1);
  });

  // ============================================================
  // 7. startPolling begins interval
  // ============================================================
  test('7. startPolling begins interval', () => {
    detector.startPolling(50000);
    // Should not throw — interval is set
    detector.stopPolling();
  });

  // ============================================================
  // 8. stopPolling clears interval
  // ============================================================
  test('8. stopPolling clears interval', () => {
    detector.startPolling(100);
    detector.stopPolling();
    // Calling twice should not throw
    detector.stopPolling();
  });

  // ============================================================
  // 9. dispose cleans up all state
  // ============================================================
  test('9. dispose cleans up all state', () => {
    detector.startPolling(100);
    detector.dispose();
    // After dispose, should be no-op
    detector.stopPolling();
  });
});
