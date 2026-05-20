import { describe, it, expect } from 'bun:test';
import { HyperplanManager } from './index';
describe('HyperplanManager', () => {
    it('starts a plan', () => {
        const manager = new HyperplanManager();
        const state = manager.startPlan('s1', 'Build auth system');
        expect(state.sessionId).toBe('s1');
        expect(state.topic).toBe('Build auth system');
        expect(state.members).toHaveLength(4);
        expect(state.phase).toBe('brainstorm');
    });
    it('generates challenge prompts', () => {
        const manager = new HyperplanManager();
        const state = manager.startPlan('s1', 'Test topic');
        const prompt = manager.getChallengePrompt(state.members[0], state);
        expect(prompt).toContain('Test topic');
        expect(prompt).toContain('Skeptic');
    });
    it('tracks member results and advances phase', () => {
        const manager = new HyperplanManager();
        manager.startPlan('s1', 'Test');
        manager.submitMemberResult('s1', 'Skeptic', 'PASS', ['Minor issue']);
        manager.submitMemberResult('s1', 'Validator', 'PASS', []);
        manager.submitMemberResult('s1', 'Architect', 'PASS', []);
        manager.submitMemberResult('s1', 'Creative', 'PASS', ['Alternative idea']);
        const state = manager.getState('s1');
        expect(state?.phase).toBe('distill');
        expect(state?.distilledInsights.length).toBeGreaterThan(0);
    });
    it('generates report', () => {
        const manager = new HyperplanManager();
        manager.startPlan('s1', 'Test');
        for (const m of ['Skeptic', 'Validator', 'Architect', 'Creative']) {
            manager.submitMemberResult('s1', m, m === 'Skeptic' ? 'FAIL' : 'PASS', ['finding']);
        }
        const report = manager.getReport('s1');
        expect(report).not.toBeNull();
        expect(report).toContain('FAIL');
        expect(report).toContain('critical issues must be addressed');
    });
    it('returns null for incomplete plan', () => {
        const manager = new HyperplanManager();
        manager.startPlan('s1', 'Test');
        expect(manager.getReport('s1')).toBeNull();
    });
    it('disposes cleanly', () => {
        const manager = new HyperplanManager();
        manager.startPlan('s1', 'Test');
        manager.dispose();
        expect(manager.getState('s1')).toBeUndefined();
    });
});
//# sourceMappingURL=index.test.js.map