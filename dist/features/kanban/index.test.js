import { describe, it, expect, beforeEach } from 'bun:test';
import { KanbanTracker } from './index';
describe('KanbanTracker', () => {
    let kanban;
    beforeEach(() => {
        kanban = new KanbanTracker();
    });
    // ── 1. Add task creates pending task ───────────────────────────────────
    it('1. addTask creates a pending task with correct properties', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        expect(task.id).toBe('task-1');
        expect(task.phase).toBe('assess');
        expect(task.agentName).toBe('odin');
        expect(task.agentDisplay).toBe('@Odin');
        expect(task.description).toBe('Interview user');
        expect(task.status).toBe('pending');
        expect(task.dependsOn).toEqual([]);
    });
    // ── 2. Start task marks as in-progress ─────────────────────────────────
    it('2. startTask marks a pending task as in-progress', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        const started = kanban.startTask(task.id);
        expect(started).toBe(true);
        const report = kanban.getReport();
        const updated = report.tasks[0];
        expect(updated.status).toBe('in-progress');
        expect(updated.startedAt).toBeDefined();
        expect(typeof updated.startedAt).toBe('number');
    });
    // ── 3. Complete task marks as completed with result ────────────────────
    it('3. completeTask marks task completed with result', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        kanban.startTask(task.id);
        const completed = kanban.completeTask(task.id, 'Requirements gathered');
        expect(completed).toBe(true);
        const report = kanban.getReport();
        const updated = report.tasks[0];
        expect(updated.status).toBe('completed');
        expect(updated.result).toBe('Requirements gathered');
        expect(updated.completedAt).toBeDefined();
        expect(typeof updated.completedAt).toBe('number');
    });
    // ── 4. Block task marks as blocked ─────────────────────────────────────
    it('4. blockTask marks task as blocked with reason', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        const blocked = kanban.blockTask(task.id, 'User unavailable');
        expect(blocked).toBe(true);
        const report = kanban.getReport();
        const updated = report.tasks[0];
        expect(updated.status).toBe('blocked');
        expect(updated.result).toBe('User unavailable');
    });
    // ── 5. Fail task marks as failed ───────────────────────────────────────
    it('5. failTask marks task as failed with reason', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        const failed = kanban.failTask(task.id, 'Timeout');
        expect(failed).toBe(true);
        const report = kanban.getReport();
        const updated = report.tasks[0];
        expect(updated.status).toBe('failed');
        expect(updated.result).toBe('Timeout');
    });
    // ── 6. Cannot start already started task ───────────────────────────────
    it('6. startTask returns false for non-pending task', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview user');
        kanban.startTask(task.id);
        // Try starting again
        const result = kanban.startTask(task.id);
        expect(result).toBe(false);
    });
    // ── 7. Cannot complete unknown task ────────────────────────────────────
    it('7. completeTask returns false for unknown task', () => {
        const result = kanban.completeTask('nonexistent', 'result');
        expect(result).toBe(false);
    });
    // ── 8. getNextReady with dependencies ──────────────────────────────────
    it('8. getNextReady respects dependency ordering', () => {
        const task1 = kanban.addTask('assess', 'odin', '@Odin', 'Interview');
        const task2 = kanban.addTask('assess', 'frigg', '@Frigg', 'Analyze', [task1.id]);
        // task1 has no deps — should be ready first
        expect(kanban.getNextReady().id).toBe(task1.id);
        // Complete task1
        kanban.startTask(task1.id);
        kanban.completeTask(task1.id, 'Done');
        // Now task2 should be ready
        const next = kanban.getNextReady();
        expect(next).toBeDefined();
        expect(next.id).toBe(task2.id);
    });
    // ── 9. getNextReady returns undefined when all done ────────────────────
    it('9. getNextReady returns undefined when no tasks are pending', () => {
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview');
        kanban.startTask(task.id);
        kanban.completeTask(task.id, 'Done');
        expect(kanban.getNextReady()).toBeUndefined();
    });
    // ── 10. getReport with phase filter ────────────────────────────────────
    it('10. getReport filters by phase', () => {
        kanban.addTask('assess', 'odin', '@Odin', 'Assess 1');
        kanban.addTask('act', 'thor', '@Thor', 'Act 1');
        kanban.addTask('act', 'thor', '@Thor', 'Act 2');
        const assessReport = kanban.getReport('assess');
        expect(assessReport.totalCount).toBe(1);
        expect(assessReport.tasks[0].description).toBe('Assess 1');
        const actReport = kanban.getReport('act');
        expect(actReport.totalCount).toBe(2);
    });
    // ── 11. getReport overallStatus tracking ───────────────────────────────
    it('11. getReport overallStatus reflects completed state', () => {
        expect(kanban.getReport().overallStatus).toBe('completed');
        kanban.addTask('assess', 'odin', '@Odin', 'Task');
        expect(kanban.getReport().overallStatus).toBe('running');
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Task 2');
        kanban.blockTask(task.id, 'blocked');
        expect(kanban.getReport().overallStatus).toBe('blocked');
    });
    // ── 12. statusLine output format ───────────────────────────────────────
    it('12. statusLine shows correct format', () => {
        expect(kanban.statusLine()).toContain('Waiting');
        const task = kanban.addTask('assess', 'odin', '@Odin', 'Interview');
        kanban.startTask(task.id);
        expect(kanban.statusLine()).toContain('[0/1]');
        expect(kanban.statusLine()).toContain('Active: @Odin');
        kanban.completeTask(task.id, 'Done');
        expect(kanban.statusLine()).toContain('[1/1]');
        expect(kanban.statusLine()).toContain('Waiting');
    });
});
//# sourceMappingURL=index.test.js.map