import { describe, it, expect, beforeEach } from 'bun:test';
import { McpTierManager, BUILT_IN_MCPS } from './index';
describe('McpTierManager', () => {
    let manager;
    beforeEach(() => {
        manager = new McpTierManager();
    });
    // ── 1. Built-in MCPs are registered by default ──────────────────────────
    it('registers built-in MCPs by default', () => {
        const builtIn = manager.getTier('built-in');
        expect(builtIn).toBeDefined();
        expect(builtIn.servers).toEqual(BUILT_IN_MCPS.map((m) => m.name));
        expect(builtIn.priority).toBe(1);
    });
    // ── 2. Project and skill-embedded tiers start empty ─────────────────────
    it('project and skill-embedded tiers start empty', () => {
        const project = manager.getTier('project');
        const skill = manager.getTier('skill-embedded');
        expect(project.servers).toEqual([]);
        expect(skill.servers).toEqual([]);
    });
    // ── 3. Register project MCPs ───────────────────────────────────────────
    it('registers project-level MCPs', () => {
        manager.registerProjectMCPs(['my-custom-mcp', 'db-mcp']);
        const project = manager.getTier('project');
        expect(project.servers).toEqual(['my-custom-mcp', 'db-mcp']);
    });
    // ── 4. Register skill-embedded MCPs ────────────────────────────────────
    it('registers skill-embedded MCPs', () => {
        manager.registerSkillMCPs(['browser-automation', 'pdf-tools']);
        const skill = manager.getTier('skill-embedded');
        expect(skill.servers).toEqual(['browser-automation', 'pdf-tools']);
    });
    // ── 5. getAllServers returns servers in priority order ──────────────────
    it('returns all servers in priority order: built-in > project > skill', () => {
        manager.registerProjectMCPs(['project-mcp']);
        manager.registerSkillMCPs(['skill-mcp']);
        const all = manager.getAllServers();
        // Built-in servers come first
        expect(all.slice(0, BUILT_IN_MCPS.length)).toEqual(BUILT_IN_MCPS.map((m) => m.name));
        // Then project
        expect(all[BUILT_IN_MCPS.length]).toBe('project-mcp');
        // Then skill
        expect(all[BUILT_IN_MCPS.length + 1]).toBe('skill-mcp');
    });
    // ── 6. getTier returns correct tier by name ─────────────────────────────
    it('returns the correct tier by name', () => {
        const builtIn = manager.getTier('built-in');
        expect(builtIn.name).toBe('built-in');
        expect(builtIn.priority).toBe(1);
        const project = manager.getTier('project');
        expect(project.name).toBe('project');
        expect(project.priority).toBe(2);
        const skill = manager.getTier('skill-embedded');
        expect(skill.name).toBe('skill-embedded');
        expect(skill.priority).toBe(3);
    });
    // ── 7. getTier returns undefined for unknown name ───────────────────────
    it('returns undefined for an unknown tier name', () => {
        const result = manager.getTier('unknown');
        expect(result).toBeUndefined();
    });
    // ── 8. Registering project MCPs replaces previous entries ───────────────
    it('replaces project MCPs on re-registration', () => {
        manager.registerProjectMCPs(['old-mcp']);
        expect(manager.getTier('project').servers).toEqual(['old-mcp']);
        manager.registerProjectMCPs(['new-mcp', 'another-mcp']);
        expect(manager.getTier('project').servers).toEqual([
            'new-mcp',
            'another-mcp',
        ]);
    });
});
//# sourceMappingURL=index.test.js.map