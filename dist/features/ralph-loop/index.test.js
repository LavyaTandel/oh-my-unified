import { describe, it, expect } from 'bun:test';
import { RalphLoopManager, createRalphLoopHook } from './index';
describe('RalphLoopManager', () => {
    it('starts a loop', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt', { maxIterations: 5 });
        expect(manager.isActive('session-1')).toBe(true);
    });
    it('does not start when disabled', () => {
        const manager = new RalphLoopManager({ enabled: false });
        manager.startLoop('session-1', 'Test prompt');
        expect(manager.isActive('session-1')).toBe(false);
    });
    it('increments iteration', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt', { maxIterations: 5 });
        const iteration = manager.incrementIteration('session-1');
        expect(iteration).toBe(1);
    });
    it('stops loop at max iterations', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt', { maxIterations: 2 });
        manager.incrementIteration('session-1');
        manager.incrementIteration('session-1');
        expect(manager.isActive('session-1')).toBe(false);
    });
    it('stops loop explicitly', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt');
        manager.stopLoop('session-1');
        expect(manager.isActive('session-1')).toBe(false);
    });
    it('cancels all loops', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt');
        manager.startLoop('session-2', 'Another prompt');
        manager.cancelAll();
        expect(manager.getActiveCount()).toBe(0);
    });
    it('generates refine continuation prompt', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt', { strategy: 'refine' });
        const state = manager.getState('session-1');
        const prompt = manager.getContinuationPrompt(state);
        expect(prompt).toContain('refining and improving');
        expect(prompt).toContain('<ralph-complete/>');
    });
    it('generates verify continuation prompt', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt', { strategy: 'verify' });
        const state = manager.getState('session-1');
        const prompt = manager.getContinuationPrompt(state);
        expect(prompt).toContain('verifying');
    });
    it('detects completion signals', () => {
        const manager = new RalphLoopManager();
        expect(manager.containsCompletionSignal('<ralph-complete/>')).toBe(true);
        expect(manager.containsCompletionSignal('<ralph_complete/>')).toBe(true);
        expect(manager.containsCompletionSignal('RALPH_COMPLETE')).toBe(true);
        expect(manager.containsCompletionSignal('task is complete and no further improvements needed')).toBe(true);
        expect(manager.containsCompletionSignal('still working')).toBe(false);
    });
    it('returns active sessions', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt');
        manager.startLoop('session-2', 'Another prompt');
        const sessions = manager.getActiveSessions();
        expect(sessions).toContain('session-1');
        expect(sessions).toContain('session-2');
    });
    it('disposes all loops', () => {
        const manager = new RalphLoopManager();
        manager.startLoop('session-1', 'Test prompt');
        manager.dispose();
        expect(manager.isActive('session-1')).toBe(false);
    });
});
describe('createRalphLoopHook', () => {
    it('creates hook with manager', () => {
        const hook = createRalphLoopHook({});
        expect(hook.manager).toBeDefined();
        expect(hook['tool.execute.after']).toBeDefined();
        expect(hook['event']).toBeDefined();
    });
    it('detects completion signal in tool output', async () => {
        const hook = createRalphLoopHook({});
        hook.manager.startLoop('session-1', 'Test prompt');
        await hook['tool.execute.after']({ tool: 'write', sessionID: 'session-1' }, { title: 'write', output: '<ralph-complete/>', metadata: {} });
        expect(hook.manager.isActive('session-1')).toBe(false);
    });
    it('handles session deletion', async () => {
        const hook = createRalphLoopHook({});
        hook.manager.startLoop('session-1', 'Test prompt');
        await hook['event']({
            event: {
                type: 'session.deleted',
                properties: { sessionID: 'session-1' },
            },
        });
        expect(hook.manager.isActive('session-1')).toBe(false);
    });
});
//# sourceMappingURL=index.test.js.map