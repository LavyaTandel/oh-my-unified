import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { CompletionDetector, STABILITY_THRESHOLD, IDLE_COALESCE_MS } from './completion-detector';
function createMockCallbacks() {
    const _tasks = new Map();
    const _messages = new Map();
    const _updated = [];
    return {
        _tasks,
        _messages,
        _updated,
        getTask: (id) => _tasks.get(id) ?? null,
        updateStatus: (id, status, extra) => {
            _updated.push({ id, status, extra });
        },
        getMessages: (taskId) => _messages.get(taskId) ?? [],
        getRunningTaskIds: () => {
            const running = [];
            for (const [id, t] of _tasks) {
                if (t.status === 'running')
                    running.push(id);
            }
            return running;
        },
    };
}
function flushCoalescing() {
    return new Promise((resolve) => setTimeout(resolve, IDLE_COALESCE_MS + 20));
}
describe('CompletionDetector', () => {
    let callbacks;
    let detector;
    beforeEach(() => {
        callbacks = createMockCallbacks();
        detector = new CompletionDetector(callbacks);
    });
    afterEach(() => {
        detector.dispose();
    });
    // ============================================================
    // 1. onSessionIdle returns coalesced (debounced)
    // ============================================================
    test('1. onSessionIdle returns coalesced for all cases (debounced)', async () => {
        const result = detector.onSessionIdle('bg_001', 'ses_001', 10);
        expect(result).toBe('coalesced');
        // No update should have happened yet — still in debounce window
        expect(callbacks._updated.length).toBe(0);
    });
    // ============================================================
    // 2. onSessionIdle marks completed after debounce when session has agent output
    // ============================================================
    test('2. onSessionIdle marks completed after debounce when session has agent output', async () => {
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'do something' },
            { role: 'assistant', content: 'here is the result' },
        ]);
        const result = detector.onSessionIdle('bg_001', 'ses_001', 200);
        expect(result).toBe('coalesced');
        // Wait for debounce to fire
        await flushCoalescing();
        expect(callbacks._updated.length).toBe(1);
        expect(callbacks._updated[0].id).toBe('bg_001');
        expect(callbacks._updated[0].status).toBe('completed');
        expect(callbacks._updated[0].extra?.outputCache).toBe('here is the result');
    });
    // ============================================================
    // 3. onSessionIdle stays still-running after debounce when no agent output
    // ============================================================
    test('3. onSessionIdle stays still-running after debounce when no agent output', async () => {
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'do something' },
        ]);
        const result = detector.onSessionIdle('bg_001', 'ses_001', 200);
        expect(result).toBe('coalesced');
        await flushCoalescing();
        // Should NOT have updated status (still running)
        expect(callbacks._updated.length).toBe(0);
    });
    // ============================================================
    // 4. onSessionIdle picks final assistant message after debounce
    // ============================================================
    test('4. onSessionIdle picks final assistant message after debounce', async () => {
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'help' },
            { role: 'assistant', content: 'step one' },
            { role: 'tool', content: 'result' },
            { role: 'assistant', content: 'final answer' },
        ]);
        const result = detector.onSessionIdle('bg_001', 'ses_001', 200);
        expect(result).toBe('coalesced');
        await flushCoalescing();
        expect(callbacks._updated.length).toBe(1);
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
        for (let i = 0; i < STABILITY_THRESHOLD + 1; i++) {
            detector.onPollTick();
        }
        expect(callbacks._updated.length).toBe(1);
        expect(callbacks._updated[0].status).toBe('completed');
        expect(callbacks._updated[0].extra?.outputCache).toBe('done');
    });
    // ============================================================
    // 6. onPollTick resets stability when messages change
    // ============================================================
    test('6. onPollTick resets stability when messages change', () => {
        callbacks._tasks.set('bg_001', { id: 'bg_001', status: 'running' });
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'test' },
            { role: 'assistant', content: 'done' },
        ]);
        detector.onPollTick();
        detector.onPollTick();
        // Change messages — resets stability counter
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'test' },
            { role: 'assistant', content: 'done' },
            { role: 'assistant', content: 'more output' },
        ]);
        detector.onPollTick();
        detector.onPollTick();
        detector.onPollTick();
        // Should NOT have completed — stability was reset
        expect(callbacks._updated.length).toBe(0);
    });
    // ============================================================
    // 7. startPolling begins interval
    // ============================================================
    test('7. startPolling begins interval', () => {
        detector.startPolling(100);
        // No error means it started
    });
    // ============================================================
    // 8. stopPolling clears interval
    // ============================================================
    test('8. stopPolling clears interval', () => {
        detector.startPolling(100);
        detector.stopPolling();
        detector.stopPolling(); // idempotent
    });
    // ============================================================
    // 9. dispose cleans up all state
    // ============================================================
    test('9. dispose cleans up all state', () => {
        detector.dispose();
        detector.dispose(); // idempotent
    });
    // ============================================================
    // 10. Rapid-fire idle events are coalesced (only last fires)
    // ============================================================
    test('10. Rapid-fire idle events are coalesced', async () => {
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'test' },
            { role: 'assistant', content: 'final result' },
        ]);
        // Fire 5 idle events in rapid succession
        detector.onSessionIdle('bg_001', 'ses_001', 10);
        detector.onSessionIdle('bg_001', 'ses_001', 20);
        detector.onSessionIdle('bg_001', 'ses_001', 30);
        detector.onSessionIdle('bg_001', 'ses_001', 40);
        detector.onSessionIdle('bg_001', 'ses_001', 200);
        // All return coalesced
        // Only the LAST one (200ms elapsed) should fire after debounce
        await flushCoalescing();
        expect(callbacks._updated.length).toBe(1);
        expect(callbacks._updated[0].status).toBe('completed');
        expect(callbacks._updated[0].extra?.outputCache).toBe('final result');
    });
    // ============================================================
    // 11. Deferred check fires for short elapsed tasks
    // ============================================================
    test('11. Deferred check fires for short elapsed tasks', async () => {
        callbacks._messages.set('bg_001', [
            { role: 'user', content: 'test' },
            { role: 'assistant', content: 'done' },
        ]);
        // Short elapsed — should defer inside the coalesced handler
        const result = detector.onSessionIdle('bg_001', 'ses_001', 5);
        expect(result).toBe('coalesced');
        // Wait for coalesce + deferred check
        await new Promise((resolve) => setTimeout(resolve, IDLE_COALESCE_MS + 500 + 20));
        // Should have completed via deferred path
        expect(callbacks._updated.length).toBe(1);
        expect(callbacks._updated[0].status).toBe('completed');
    });
});
//# sourceMappingURL=completion-detector.test.js.map