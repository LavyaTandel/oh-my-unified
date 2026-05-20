import { describe, it, expect } from 'bun:test';
import { ReviewWorkManager } from './index';
describe('ReviewWorkManager', () => {
    it('starts a review session', () => {
        const manager = new ReviewWorkManager();
        const state = manager.startReview('s1', 'Build auth', ['must use JWT'], ['src/auth.ts']);
        expect(state.sessionId).toBe('s1');
        expect(state.goal).toBe('Build auth');
        expect(state.completed).toBe(false);
        expect(state.agents).toHaveLength(0);
    });
    it('generates review prompts for each agent', () => {
        const manager = new ReviewWorkManager();
        const state = manager.startReview('s1', 'Test goal', ['constraint1'], ['file1.ts']);
        for (let i = 0; i < 5; i++) {
            const prompt = manager.getReviewPrompt(i, state);
            expect(prompt.length).toBeGreaterThan(0);
            expect(prompt).toContain('Test goal');
        }
    });
    it('returns empty prompt for invalid agent index', () => {
        const manager = new ReviewWorkManager();
        const state = manager.startReview('s1', 'Test', [], []);
        expect(manager.getReviewPrompt(5, state)).toBe('');
        expect(manager.getReviewPrompt(-1, state)).toBe('');
    });
    it('submits agent results and tracks completion', () => {
        const manager = new ReviewWorkManager();
        const state = manager.startReview('s1', 'Test', [], []);
        manager.submitResult('s1', {
            agentName: 'Goal Verifier',
            focus: 'test',
            verdict: 'PASS',
            confidence: 'HIGH',
            summary: 'All good',
            blockingIssues: [],
        });
        expect(state.agents).toHaveLength(1);
        expect(state.completed).toBe(false);
    });
    it('marks review complete when all 5 agents report', () => {
        const manager = new ReviewWorkManager();
        manager.startReview('s1', 'Test', [], []);
        for (let i = 0; i < 5; i++) {
            manager.submitResult('s1', {
                agentName: `Agent ${i}`,
                focus: 'test',
                verdict: 'PASS',
                confidence: 'HIGH',
                summary: 'ok',
                blockingIssues: [],
            });
        }
        const state = manager.getState('s1');
        expect(state?.completed).toBe(true);
        expect(state?.agents).toHaveLength(5);
    });
    it('generates final report', () => {
        const manager = new ReviewWorkManager();
        manager.startReview('s1', 'Test', [], []);
        for (let i = 0; i < 5; i++) {
            manager.submitResult('s1', {
                agentName: `Agent ${i}`,
                focus: 'test',
                verdict: i === 2 ? 'FAIL' : 'PASS',
                confidence: 'HIGH',
                summary: `Summary ${i}`,
                blockingIssues: i === 2 ? ['Critical issue'] : [],
            });
        }
        const report = manager.getReport('s1');
        expect(report).not.toBeNull();
        expect(report).toContain('FAILED');
        expect(report).toContain('Critical issue');
        expect(report).toContain('Agent 2');
    });
    it('returns null for incomplete review', () => {
        const manager = new ReviewWorkManager();
        manager.startReview('s1', 'Test', [], []);
        expect(manager.getReport('s1')).toBeNull();
    });
    it('returns null for unknown session', () => {
        const manager = new ReviewWorkManager();
        expect(manager.getReport('unknown')).toBeNull();
        expect(manager.getState('unknown')).toBeUndefined();
    });
    it('disposes all sessions', () => {
        const manager = new ReviewWorkManager();
        manager.startReview('s1', 'Test', [], []);
        manager.startReview('s2', 'Test2', [], []);
        manager.dispose();
        expect(manager.getState('s1')).toBeUndefined();
        expect(manager.getState('s2')).toBeUndefined();
    });
});
//# sourceMappingURL=index.test.js.map