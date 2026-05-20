import { describe, it, expect } from 'bun:test';
import { PlanOrchestrator } from './index';
describe('PlanOrchestrator', () => {
    it('starts a plan', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Build auth system');
        expect(plan.sessionId).toBe('s1');
        expect(plan.topic).toBe('Build auth system');
        expect(plan.phase).toBe('assess');
        expect(plan.status).toBe('active');
    });
    it('advances through phases', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Test');
        expect(plan.phase).toBe('assess');
        o.advancePhase(plan.id);
        expect(o.getPlan(plan.id)?.phase).toBe('assemble');
        o.advancePhase(plan.id);
        expect(o.getPlan(plan.id)?.phase).toBe('act');
        o.advancePhase(plan.id);
        expect(o.getPlan(plan.id)?.phase).toBe('improvise');
        o.advancePhase(plan.id);
        expect(o.getPlan(plan.id)?.status).toBe('completed');
    });
    it('adds findings', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Test');
        o.addFinding(plan.id, 'assess', 'Missing requirements');
        expect(o.getPlan(plan.id)?.findings.assess).toHaveLength(1);
    });
    it('adds decisions', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Test');
        o.addDecision(plan.id, 'Use PostgreSQL');
        expect(o.getPlan(plan.id)?.decisions).toHaveLength(1);
    });
    it('returns phase prompts', () => {
        const o = new PlanOrchestrator();
        for (const phase of ['assess', 'assemble', 'act', 'improvise']) {
            expect(o.getPhasePrompt(phase).length).toBeGreaterThan(0);
        }
    });
    it('returns model routing', () => {
        const o = new PlanOrchestrator();
        expect(o.getModelForPhase('assess')).toContain('nemotron');
        expect(o.getModelForPhase('act')).toContain('deepseek');
    });
    it('gets active plan by session', () => {
        const o = new PlanOrchestrator();
        o.startPlan('s1', 'Test');
        const active = o.getActivePlan('s1');
        expect(active).toBeDefined();
        expect(o.getActivePlan('unknown')).toBeUndefined();
    });
    it('generates status text', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Test');
        o.addFinding(plan.id, 'assess', 'Finding 1');
        const text = o.getStatusText(plan);
        expect(text).toContain('Test');
        expect(text).toContain('assess');
    });
    it('generates report', () => {
        const o = new PlanOrchestrator();
        const plan = o.startPlan('s1', 'Test');
        o.addFinding(plan.id, 'assess', 'Finding 1');
        o.addDecision(plan.id, 'Decision 1');
        o.advancePhase(plan.id);
        o.advancePhase(plan.id);
        o.advancePhase(plan.id);
        o.advancePhase(plan.id);
        const report = o.getReport(plan.id);
        expect(report).not.toBeNull();
        expect(report).toContain('Test');
        expect(report).toContain('Finding 1');
        expect(report).toContain('Decision 1');
    });
    it('lists plans sorted by date', () => {
        const o = new PlanOrchestrator();
        o.startPlan('s1', 'First');
        // Small delay to ensure different timestamps
        const start = Date.now();
        while (Date.now() === start) { /* spin */ }
        o.startPlan('s2', 'Second');
        const plans = o.listPlans();
        expect(plans).toHaveLength(2);
        expect(plans[0].topic).toBe('Second');
    });
    it('disposes cleanly', () => {
        const o = new PlanOrchestrator();
        o.startPlan('s1', 'Test');
        o.dispose();
        expect(o.listPlans()).toHaveLength(0);
    });
});
//# sourceMappingURL=index.test.js.map