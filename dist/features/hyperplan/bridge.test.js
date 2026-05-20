import { describe, it, expect } from 'bun:test';
import { createHyperplanBridge } from './bridge';
describe('HyperplanToReviewBridge', () => {
    function makeState(overrides = {}) {
        return {
            sessionId: 's1',
            topic: 'Build auth system',
            members: [
                { name: 'Skeptic', role: 'unspecified-low', perspective: '...', verdict: 'FAIL', findings: ['[CRITICAL] No rate limiting'] },
                { name: 'Validator', role: 'unspecified-high', perspective: '...', verdict: 'PASS', findings: [] },
                { name: 'Architect', role: 'ultrabrain', perspective: '...', verdict: 'PASS', findings: [] },
                { name: 'Creative', role: 'artistry', perspective: '...', findings: ['Use OAuth2 instead'] },
            ],
            phase: 'distill',
            startedAt: Date.now(),
            completed: false,
            distilledInsights: [],
            ...overrides,
        };
    }
    it('converts findings', () => {
        const bridge = createHyperplanBridge();
        const state = makeState();
        const context = bridge.convertFindings(state);
        expect(context.topic).toBe('Build auth system');
        expect(context.criticalFindings).toHaveLength(1);
        expect(context.alternatives).toHaveLength(1);
        expect(context.memberConsensus).toContain('2 passed');
    });
    it('detects FAIL for auto-trigger', () => {
        const bridge = createHyperplanBridge();
        const state = makeState();
        expect(bridge.shouldAutoTrigger(state)).toBe(true);
    });
    it('does not trigger when all PASS', () => {
        const bridge = createHyperplanBridge();
        const state = makeState({
            members: [
                { name: 'Skeptic', role: 'unspecified-low', perspective: '...', verdict: 'PASS', findings: [] },
                { name: 'Validator', role: 'unspecified-high', perspective: '...', verdict: 'PASS', findings: [] },
            ],
        });
        expect(bridge.shouldAutoTrigger(state)).toBe(false);
    });
    it('builds review context', () => {
        const bridge = createHyperplanBridge();
        const state = makeState();
        const context = bridge.buildReviewContext(state);
        expect(context.goal).toContain('Build auth system');
        expect(context.constraints.length).toBeGreaterThan(0);
        expect(context.constraints[0]).toContain('Must address');
    });
    it('converts to ReviewWorkState', () => {
        const bridge = createHyperplanBridge();
        const state = makeState();
        const reviewState = bridge.toReviewWorkState(state);
        expect(reviewState.sessionId).toBe('s1');
        expect(reviewState.goal).toBeDefined();
        expect(reviewState.constraints).toBeDefined();
    });
});
//# sourceMappingURL=bridge.test.js.map