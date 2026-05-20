import { describe, expect, test } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { TaskRegistry } from './task-registry';
function withRegistry(fn) {
    const reg = new TaskRegistry(':memory:');
    try {
        return fn(reg);
    }
    finally {
        reg.close();
    }
}
function tempDbPath() {
    const dir = mkdtempSync(join(tmpdir(), 'oh-my-unified-test-'));
    return join(dir, 'task-registry.db');
}
function cleanTempDb(path) {
    try {
        rmSync(path, { force: true });
        rmSync(path + '-wal', { force: true });
        rmSync(path + '-shm', { force: true });
    }
    catch {
        // ignore cleanup errors
    }
}
const sampleTask = (overrides = {}) => ({
    id: 'bg_001',
    sessionId: 'ses_001',
    agent: 'test-agent',
    status: 'pending',
    description: 'Test task',
    ...overrides,
});
// ============================================================
// Tests
// ============================================================
describe('TaskRegistry', () => {
    test('1. creates database and tables in :memory:', () => {
        withRegistry((reg) => {
            const stats = reg.getStats();
            expect(stats.total).toBe(0);
            expect(stats.byStatus).toEqual({});
        });
    });
    test('2. createTask + getTask roundtrip', () => {
        withRegistry((reg) => {
            const task = reg.createTask(sampleTask());
            expect(task.id).toBe('bg_001');
            expect(task.createdAt).toBeGreaterThan(0);
            expect(task.updatedAt).toBe(task.createdAt);
            const retrieved = reg.getTask('bg_001');
            expect(retrieved).not.toBeNull();
            expect(retrieved.id).toBe('bg_001');
            expect(retrieved.sessionId).toBe('ses_001');
            expect(retrieved.agent).toBe('test-agent');
            expect(retrieved.status).toBe('pending');
            expect(retrieved.description).toBe('Test task');
        });
    });
    test('3. updateStatus changes status', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask());
            reg.updateStatus('bg_001', 'running');
            const retrieved = reg.getTask('bg_001');
            expect(retrieved).not.toBeNull();
            expect(retrieved.status).toBe('running');
            expect(retrieved.updatedAt).toBeGreaterThanOrEqual(retrieved.createdAt);
        });
    });
    test('4. task persists across registry instances (file-based persistence)', () => {
        const dbPath = tempDbPath();
        try {
            // First registry: create task
            const reg1 = new TaskRegistry(dbPath);
            reg1.createTask(sampleTask());
            reg1.close();
            // Second registry: verify task still exists
            const reg2 = new TaskRegistry(dbPath);
            const retrieved = reg2.getTask('bg_001');
            expect(retrieved).not.toBeNull();
            expect(retrieved.id).toBe('bg_001');
            expect(retrieved.description).toBe('Test task');
            expect(retrieved.sessionId).toBe('ses_001');
            reg2.close();
            // Third registry: verify with update
            const reg3 = new TaskRegistry(dbPath);
            reg3.updateStatus('bg_001', 'completed');
            const updated = reg3.getTask('bg_001');
            expect(updated).not.toBeNull();
            expect(updated.status).toBe('completed');
            expect(updated.completedAt).toBeGreaterThan(0);
            reg3.close();
        }
        finally {
            cleanTempDb(dbPath);
        }
    });
    test('5. listTasksByParent returns correct tasks', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask({ id: 'bg_001', parentSessionId: 'parent_1' }));
            reg.createTask(sampleTask({ id: 'bg_002', parentSessionId: 'parent_1' }));
            reg.createTask(sampleTask({ id: 'bg_003', parentSessionId: 'parent_2' }));
            const parent1Tasks = reg.listTasksByParent('parent_1');
            expect(parent1Tasks.length).toBe(2);
            expect(parent1Tasks.map((t) => t.id).sort()).toEqual(['bg_001', 'bg_002']);
            const parent2Tasks = reg.listTasksByParent('parent_2');
            expect(parent2Tasks.length).toBe(1);
            expect(parent2Tasks[0].id).toBe('bg_003');
        });
    });
    test('6. listRunningTasks returns only pending/running tasks', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask({ id: 'bg_001', status: 'pending' }));
            reg.createTask(sampleTask({ id: 'bg_002', status: 'running' }));
            reg.createTask(sampleTask({ id: 'bg_003', status: 'completed' }));
            reg.createTask(sampleTask({ id: 'bg_004', status: 'error' }));
            reg.createTask(sampleTask({ id: 'bg_005', status: 'cancelled' }));
            const running = reg.listRunningTasks();
            expect(running.length).toBe(2);
            expect(running.map((t) => t.id).sort()).toEqual(['bg_001', 'bg_002']);
        });
    });
    test('7. addMessage + getMessages roundtrip', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask());
            reg.addMessage('bg_001', 'user', 'Hello');
            reg.addMessage('bg_001', 'assistant', 'Hi there!');
            reg.addMessage('bg_001', 'tool', 'some result');
            const messages = reg.getMessages('bg_001');
            expect(messages.length).toBe(3);
            expect(messages[0].role).toBe('user');
            expect(messages[0].content).toBe('Hello');
            expect(messages[1].role).toBe('assistant');
            expect(messages[1].content).toBe('Hi there!');
            expect(messages[2].role).toBe('tool');
            expect(messages[2].content).toBe('some result');
        });
    });
    test('getTaskBySession returns task by session ID', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask({ id: 'bg_001', sessionId: 'ses_abc' }));
            reg.createTask(sampleTask({ id: 'bg_002', sessionId: 'ses_xyz' }));
            const task = reg.getTaskBySession('ses_xyz');
            expect(task).not.toBeNull();
            expect(task.id).toBe('bg_002');
            const missing = reg.getTaskBySession('ses_nonexistent');
            expect(missing).toBeNull();
        });
    });
    test('listTasksByStatus filters correctly', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask({ id: 'bg_001', status: 'pending' }));
            reg.createTask(sampleTask({ id: 'bg_002', status: 'running' }));
            reg.createTask(sampleTask({ id: 'bg_003', status: 'completed' }));
            const pending = reg.listTasksByStatus('pending');
            expect(pending.length).toBe(1);
            expect(pending[0].id).toBe('bg_001');
        });
    });
    test('deleteTask removes task and its messages', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask());
            reg.addMessage('bg_001', 'user', 'test');
            reg.deleteTask('bg_001');
            const task = reg.getTask('bg_001');
            expect(task).toBeNull();
            const messages = reg.getMessages('bg_001');
            expect(messages.length).toBe(0);
        });
    });
    test('getStats returns correct counts', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask({ id: 'bg_001', status: 'pending' }));
            reg.createTask(sampleTask({ id: 'bg_002', status: 'running' }));
            reg.createTask(sampleTask({ id: 'bg_003', status: 'completed' }));
            const stats = reg.getStats();
            expect(stats.total).toBe(3);
            expect(stats.byStatus['pending']).toBe(1);
            expect(stats.byStatus['running']).toBe(1);
            expect(stats.byStatus['completed']).toBe(1);
        });
    });
    test('updateStatus with extra fields', () => {
        withRegistry((reg) => {
            reg.createTask(sampleTask());
            reg.updateStatus('bg_001', 'running', {
                outputCache: 'cached output',
                metadata: JSON.stringify({ key: 'value' }),
            });
            const task = reg.getTask('bg_001');
            expect(task.outputCache).toBe('cached output');
            expect(task.metadata).toBe('{"key":"value"}');
            expect(task.status).toBe('running');
        });
    });
    test('getTask returns null for nonexistent task', () => {
        withRegistry((reg) => {
            const task = reg.getTask('nonexistent');
            expect(task).toBeNull();
        });
    });
});
//# sourceMappingURL=task-registry.test.js.map