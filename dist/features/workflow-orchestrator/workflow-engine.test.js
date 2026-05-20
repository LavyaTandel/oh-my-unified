import { describe, it, expect, beforeEach } from 'bun:test';
import { WorkflowEngine } from './workflow-engine';
import { PrometheusRecon } from './prometheus-recon';
// ─── WorkflowEngine Tests ─────────────────────────────────────────────
describe('WorkflowEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new WorkflowEngine();
    });
    it('1. starts in idle phase', () => {
        expect(engine.getPhase()).toBe('idle');
        expect(engine.getConfidence()).toBe(0);
    });
    it('2. can transition to assess phase (threshold 0 always allows)', () => {
        const result = engine.transitionTo('assess');
        expect(result.allowed).toBe(true);
        expect(engine.getPhase()).toBe('assess');
    });
    it('3. cannot transition to act with low confidence', () => {
        // Confidence starts at 0, threshold for act is 9
        const result = engine.transitionTo('act');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Confidence 0');
        expect(result.reason).toContain('required 9');
        // Phase should remain unchanged
        expect(engine.getPhase()).toBe('idle');
    });
    it('4. can transition to act with high confidence', () => {
        // Push overall confidence to >= 9
        engine.updateConfidence('codebase', 10);
        engine.updateConfidence('architecture', 10);
        // Confidence should now be 10
        expect(engine.getConfidence()).toBeGreaterThanOrEqual(9);
        const result = engine.transitionTo('act');
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('Transitioned to act');
        expect(engine.getPhase()).toBe('act');
    });
    it('5. updateConfidence raises overall confidence', () => {
        expect(engine.getConfidence()).toBe(0);
        engine.updateConfidence('codebase', 8);
        expect(engine.getConfidence()).toBe(8);
        engine.updateConfidence('architecture', 10);
        // (8 + 10) / 2 = 9
        expect(engine.getConfidence()).toBe(9);
    });
    it('6. getThresholdFor returns correct values for all phases', () => {
        // Access the private method via cast
        const e = engine;
        expect(e.getThresholdFor('idle')).toBe(0);
        expect(e.getThresholdFor('assess')).toBe(0);
        expect(e.getThresholdFor('assemble')).toBe(6);
        expect(e.getThresholdFor('improvise')).toBe(8);
        expect(e.getThresholdFor('act')).toBe(9);
        expect(e.getThresholdFor('complete')).toBe(0);
    });
    it('7. cannot transition to assemble with low confidence', () => {
        const result = engine.transitionTo('assemble');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('required 6');
        expect(engine.getPhase()).toBe('idle');
    });
    it('8. cannot transition to improvise with low confidence', () => {
        const result = engine.transitionTo('improvise');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('required 8');
        expect(engine.getPhase()).toBe('idle');
    });
    it('9. transition returns correct phase name in reason', () => {
        const result = engine.transitionTo('assess');
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('Transitioned to assess');
        // Build up confidence
        engine.updateConfidence('a', 10);
        engine.updateConfidence('b', 10);
        const result2 = engine.transitionTo('assemble');
        expect(result2.allowed).toBe(true);
        expect(result2.reason).toBe('Transitioned to assemble');
    });
    it('10. phase timing is tracked', () => {
        const startedAt = Date.now();
        const e = new WorkflowEngine();
        // startedAt should be close to now
        const state = e;
        expect(state.state.startedAt).toBeGreaterThanOrEqual(startedAt);
        expect(state.state.startedAt).toBeLessThanOrEqual(Date.now());
        const t1 = state.state.currentPhaseStartedAt;
        // Transition should update currentPhaseStartedAt
        e.transitionTo('assess');
        expect(state.state.currentPhaseStartedAt).toBeGreaterThanOrEqual(t1);
    });
    it('11. multiple knowledge areas contribute to overall correctly', () => {
        engine.updateConfidence('codebase', 10);
        engine.updateConfidence('auth-system', 10);
        engine.updateConfidence('database', 10);
        engine.updateConfidence('deployment', 10);
        // 4 areas each at 10 → avg = 10
        expect(engine.getConfidence()).toBe(10);
        // Add a low-confidence area
        engine.updateConfidence('new-feature', 2);
        // (10 + 10 + 10 + 10 + 2) / 5 = 42 / 5 = 8.4 → 8
        expect(engine.getConfidence()).toBe(8);
    });
    it('12. updateConfidence keeps max value per area (idempotent)', () => {
        engine.updateConfidence('codebase', 8);
        expect(engine.getConfidence()).toBe(8);
        // Lower value should not decrease
        engine.updateConfidence('codebase', 3);
        expect(engine.getConfidence()).toBe(8);
        // Higher value should increase
        engine.updateConfidence('codebase', 10);
        expect(engine.getConfidence()).toBe(10);
    });
    it('13. empty knowledge map results in zero confidence', () => {
        expect(engine.getConfidence()).toBe(0);
        // Add then effectively no change — edge case
        engine.updateConfidence('temp', 5);
        expect(engine.getConfidence()).toBe(5);
    });
});
// ─── PrometheusRecon Tests ────────────────────────────────────────────
describe('PrometheusRecon', () => {
    let recon;
    beforeEach(() => {
        recon = new PrometheusRecon();
    });
    it('14. plans recon tasks for unknown project', () => {
        const tasks = recon.planRecon([]);
        // Should have at least the always-run MCP tasks
        expect(tasks.length).toBeGreaterThanOrEqual(5);
        // Should include MCP tasks
        const mcpTasks = tasks.filter(t => t.tool === 'mcp');
        expect(mcpTasks.length).toBeGreaterThanOrEqual(5);
    });
    it('15. deploys sub-agent tasks when codebase knowledge is low', () => {
        const knownAreas = [
            {
                area: 'codebase-structure',
                confidence: 2, // Below threshold of 5
                sources: [],
                questionsAsked: [],
                answersReceived: [],
            },
        ];
        const tasks = recon.planRecon(knownAreas);
        const subagentTasks = tasks.filter(t => t.tool === 'subagent');
        expect(subagentTasks.length).toBeGreaterThan(0);
        expect(subagentTasks.some(t => t.target === 'explore-api-routes')).toBe(true);
        expect(subagentTasks.some(t => t.target === 'explore-dependencies')).toBe(true);
    });
    it('16. skips sub-agent tasks when codebase knowledge is sufficient', () => {
        const knownAreas = [
            {
                area: 'codebase-structure',
                confidence: 8, // Above threshold of 5
                sources: ['gitnexus'],
                questionsAsked: [],
                answersReceived: [],
            },
            {
                area: 'architecture',
                confidence: 8, // Above threshold of 6
                sources: ['codemap'],
                questionsAsked: [],
                answersReceived: [],
            },
        ];
        const tasks = recon.planRecon(knownAreas);
        const subagentTasks = tasks.filter(t => t.tool === 'subagent');
        expect(subagentTasks.length).toBe(0);
    });
    it('17. generates questions when there are knowledge gaps', () => {
        const gathered = new Map();
        const questions = recon.generateQuestions(gathered, []);
        expect(questions.length).toBeGreaterThan(0);
        // Should ask about project purpose
        expect(questions.some(q => q.includes('purpose'))).toBe(true);
        // Should ask about project structure
        expect(questions.some(q => q.includes('project structure'))).toBe(true);
    });
    it('18. generates no questions when all knowledge is present', () => {
        const gathered = new Map([['codebase-structure', ['src/', 'tests/']]]);
        const questions = recon.generateQuestions(gathered, ['project-purpose', 'codebase-structure', 'tech-stack']);
        expect(questions.length).toBe(0);
    });
    it('19. generates clarification question when routes are found', () => {
        const gathered = new Map([['api-routes', ['/api/users', '/api/auth']]]);
        const questions = recon.generateQuestions(gathered, ['project-purpose']);
        expect(questions.some(q => q.includes('routes'))).toBe(true);
    });
    it('20. addTask sets correct fields for each tool type', () => {
        // We can't easily access private methods, but planRecon exercises the method
        // Just verify MCP tasks have purpose set (generic, not hardcoded MCP name)
        const tasks = recon.planRecon([]);
        const mcpTask = tasks.find(t => t.tool === 'mcp');
        expect(mcpTask).toBeDefined();
        if (mcpTask) {
            expect(mcpTask.purpose).toBeDefined();
            expect(typeof mcpTask.purpose).toBe('string');
        }
    });
    it('21. executeRecon returns gathered knowledge map', async () => {
        const tasks = recon.planRecon([]);
        const result = await recon.executeRecon(tasks);
        expect(result).toBeInstanceOf(Map);
    });
});
//# sourceMappingURL=workflow-engine.test.js.map