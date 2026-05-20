import { describe, it, expect } from 'bun:test';
import { createAgentSelector } from './index';
describe('AgentSelector', () => {
    it('registers all agents on creation', () => {
        const selector = createAgentSelector();
        const list = selector.getAgentList();
        expect(list.length).toBeGreaterThan(10);
    });
    it('returns agent by mention', () => {
        const selector = createAgentSelector();
        const agent = selector.getAgentByMention('@odin');
        expect(agent).toBeDefined();
        expect(agent?.name).toBe('odin');
        expect(agent?.currentModel).toBeDefined();
    });
    it('returns undefined for unknown agent', () => {
        const selector = createAgentSelector();
        expect(selector.getAgentByMention('@nonexistent')).toBeUndefined();
    });
    it('tracks successes and errors', () => {
        const selector = createAgentSelector();
        selector.recordSuccess('odin');
        selector.recordSuccess('odin');
        let meta = selector.getAgentByMention('@odin');
        expect(meta?.errorRate).toBe(0);
        expect(meta?.healthStatus).toBe('healthy');
        expect(meta?.sessionCount).toBe(2);
        selector.recordError('odin');
        meta = selector.getAgentByMention('@odin');
        expect(meta?.errorRate).toBeCloseTo(0.333, 2);
        expect(meta?.healthStatus).toBe('degraded');
    });
    it('sets model capabilities', () => {
        const selector = createAgentSelector();
        selector.setModelCapabilities('odin', ['reasoning', 'planning']);
        const agent = selector.getAgentByMention('@odin');
        expect(agent?.modelCapabilities).toContain('reasoning');
        expect(agent?.modelCapabilities).toContain('planning');
    });
    it('sets assigned MCPs', () => {
        const selector = createAgentSelector();
        selector.setAssignedMCPs('thor', ['github', 'filesystem']);
        const agent = selector.getAgentByMention('@thor');
        expect(agent?.assignedMCPs).toContain('github');
        expect(agent?.assignedMCPs).toContain('filesystem');
    });
    it('suggests agents based on context', () => {
        const selector = createAgentSelector();
        const suggestions = selector.getSuggestions('need help with planning');
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].reason).toContain('planning');
    });
    it('suggests implementation agents', () => {
        const selector = createAgentSelector();
        const suggestions = selector.getSuggestions('implementation task');
        const names = suggestions.map((s) => s.agent.name);
        expect(names).toContain('thor');
        expect(names).toContain('hermod');
    });
    it('returns slash command output', () => {
        const selector = createAgentSelector();
        const output = selector.getSlashCommandOutput();
        expect(output).toContain('Available Agents');
        expect(output).toContain('@Odin');
    });
    it('returns stats', () => {
        const selector = createAgentSelector();
        const stats = selector.getStats();
        expect(stats.total).toBeGreaterThan(10);
        expect(stats.healthy).toBe(stats.total);
        expect(stats.degraded).toBe(0);
        expect(stats.error).toBe(0);
    });
    it('excludes error agents from suggestions', () => {
        const selector = createAgentSelector();
        selector.recordError('odin');
        selector.recordError('odin');
        selector.recordError('odin');
        const suggestions = selector.getSuggestions('planning');
        const odinInSuggestions = suggestions.some((s) => s.agent.name === 'odin');
        expect(odinInSuggestions).toBe(false);
    });
});
describe('createAgentSelector', () => {
    it('pre-registers all agents', () => {
        const selector = createAgentSelector();
        const stats = selector.getStats();
        expect(stats.total).toBeGreaterThanOrEqual(15);
    });
});
//# sourceMappingURL=index.test.js.map