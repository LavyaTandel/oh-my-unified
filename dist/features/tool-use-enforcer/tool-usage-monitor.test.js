import { describe, it, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { McpSkillCatalog } from './mcp-skill-catalog';
import { AgentContextEnricher } from './agent-context-enricher';
import { ToolUsageMonitor } from './tool-usage-monitor';
// Helper: create a catalog guaranteed to use fallback defaults by pointing
// at non‑existent paths so that readUserConfig() and scanUserSkills() return [].
function fallbackCatalog() {
    const tmp = mkdtempSync(join(tmpdir(), 'omni-fallback-test-'));
    return new McpSkillCatalog({
        opencodeConfigPath: join(tmp, 'opencode.json'),
        opencodeSkillsPath: join(tmp, 'skills'),
        claudeSkillsPath: join(tmp, 'claude-skills'),
    });
}
// ── McpSkillCatalog Tests ────────────────────────────────────────
describe('McpSkillCatalog', () => {
    it('should load all 34 default entries (14 mcp + 15 gstack + 5 builtin)', () => {
        const catalog = fallbackCatalog();
        const all = catalog.getAll();
        expect(all.length).toBe(34);
        const mcps = catalog.findByCategory('mcp');
        expect(mcps.length).toBe(14);
        const gskills = catalog.findByCategory('gstack-skill');
        expect(gskills.length).toBe(15);
        const builtins = catalog.findByCategory('builtin');
        expect(builtins.length).toBe(5);
    });
    it('should find entries by trigger text', () => {
        const catalog = fallbackCatalog();
        const results = catalog.findByTrigger('memory');
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some((r) => r.name === 'clawdi')).toBe(true);
    });
    it('should find entries by description text', () => {
        const catalog = fallbackCatalog();
        const results = catalog.findByTrigger('code quality');
        expect(results.some((r) => r.name === 'health')).toBe(true);
    });
    it('should find entries by name', () => {
        const catalog = fallbackCatalog();
        const results = catalog.findByTrigger('gitnexus');
        expect(results.some((r) => r.name === 'gitnexus')).toBe(true);
    });
    it('should return empty array for unknown trigger', () => {
        const catalog = fallbackCatalog();
        const results = catalog.findByTrigger('zzz_nonexistent_trigger_xyz');
        expect(results.length).toBe(0);
    });
    it('should generate markdown grouped by category', () => {
        const catalog = fallbackCatalog();
        const md = catalog.toMarkdown();
        expect(md).toContain('# Available Tools & Skills');
        expect(md).toContain('## mcp');
        expect(md).toContain('## gstack-skill');
        expect(md).toContain('## builtin');
        expect(md).toContain('34 entries');
    });
    it('should generate task suggestions when match found', () => {
        const catalog = fallbackCatalog();
        const suggestions = catalog.generateTaskSuggestions('security audit');
        expect(suggestions).toContain('cso');
        expect(suggestions).toContain('[GSKILL]');
    });
    it('should generate fallback suggestions when no match', () => {
        const catalog = fallbackCatalog();
        const suggestions = catalog.generateTaskSuggestions('zzz_nonexistent_xyz');
        expect(suggestions).toContain('No specific tools matched');
        expect(suggestions).toContain('/browse');
    });
});
// ── AgentContextEnricher Tests ────────────────────────────────────
describe('AgentContextEnricher', () => {
    it('should delegate to catalog.toMarkdown()', () => {
        const catalog = fallbackCatalog();
        const enricher = new AgentContextEnricher(catalog);
        const block = enricher.generateMcpContextBlock();
        expect(block).toContain('# Available Tools & Skills');
        expect(block).toContain('34 entries');
    });
    it('should delegate to catalog.generateTaskSuggestions()', () => {
        const catalog = fallbackCatalog();
        const enricher = new AgentContextEnricher(catalog);
        const suggestions = enricher.generateToolSuggestions('qa test');
        expect(suggestions).toContain('qa');
    });
});
// ── ToolUsageMonitor Tests ────────────────────────────────────────
describe('ToolUsageMonitor', () => {
    it('should track primitive tool usage without updating lastNonPrimitive', () => {
        const monitor = new ToolUsageMonitor();
        monitor.recordToolUse('s1', 'bash', 'primitive');
        monitor.recordToolUse('s1', 'read', 'primitive');
        expect(monitor.needsNudge('s1', 2)).toBe(true);
    });
    it('should reset nudge counter after non-primitive tool use', () => {
        const monitor = new ToolUsageMonitor();
        monitor.recordToolUse('s1', 'bash', 'primitive');
        monitor.recordToolUse('s1', 'read', 'primitive');
        monitor.recordToolUse('s1', 'code-review-graph_communities', 'mcp');
        // After using MCP, lastNonPrimitive is updated, so nudge should not fire yet
        expect(monitor.needsNudge('s1', 2)).toBe(false);
    });
    it('should generate nudge message when needsNudge is true', () => {
        const monitor = new ToolUsageMonitor();
        monitor.recordToolUse('s1', 'bash', 'primitive');
        monitor.recordToolUse('s1', 'read', 'primitive');
        monitor.recordToolUse('s1', 'grep', 'primitive');
        const nudge = monitor.generateNudge('s1', ['code-review-graph', 'exa', 'context7']);
        expect(nudge).not.toBeNull();
        expect(nudge).toContain('primitive tools');
        expect(nudge).toContain('code-review-graph');
    });
    it('should return null from generateNudge when nudge not needed', () => {
        const monitor = new ToolUsageMonitor();
        monitor.recordToolUse('s1', 'code-review-graph_communities', 'mcp');
        const nudge = monitor.generateNudge('s1', []);
        expect(nudge).toBeNull();
    });
    it('should clear session state', () => {
        const monitor = new ToolUsageMonitor();
        monitor.recordToolUse('s1', 'bash', 'primitive');
        expect(monitor.needsNudge('s1')).toBe(false); // nudgeAfterTurns defaults to 3
        monitor.clearSession('s1');
        // After clearing, session doesn't exist, needsNudge returns false
        expect(monitor.needsNudge('s1')).toBe(false);
    });
});
//# sourceMappingURL=tool-usage-monitor.test.js.map