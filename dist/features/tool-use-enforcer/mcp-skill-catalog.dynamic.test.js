import { describe, it, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { McpSkillCatalog } from './mcp-skill-catalog';
function createTempEnv() {
    const root = mkdtempSync(join(tmpdir(), 'omni-dynamic-test-'));
    const configPath = join(root, 'opencode.json');
    const opencodeSkillsPath = join(root, 'opencode-skills');
    const claudeSkillsPath = join(root, 'claude-skills');
    mkdirSync(opencodeSkillsPath, { recursive: true });
    mkdirSync(claudeSkillsPath, { recursive: true });
    return { root, configPath, opencodeSkillsPath, claudeSkillsPath };
}
function writeConfig(env, mcp) {
    writeFileSync(env.configPath, JSON.stringify({ mcp }, null, 2), 'utf-8');
}
function writeSkill(dir, name, description) {
    const skillDir = join(dir, name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), `---
name: ${name}
description: ${description}
---

# ${name}
`, 'utf-8');
}
function createCatalog(env) {
    return new McpSkillCatalog({
        opencodeConfigPath: env.configPath,
        opencodeSkillsPath: env.opencodeSkillsPath,
        claudeSkillsPath: env.claudeSkillsPath,
    });
}
// ── Tests ───────────────────────────────────────────────────────
describe('McpSkillCatalog — dynamic discovery', () => {
    it('should read MCP servers from user config', () => {
        const env = createTempEnv();
        writeConfig(env, {
            'my-test-mcp': {
                type: 'local',
                command: ['my-test-mcp', 'serve'],
                enabled: true,
            },
            'remote-api': {
                type: 'remote',
                url: 'https://api.example.com/mcp',
                enabled: true,
            },
        });
        const catalog = createCatalog(env);
        const mcps = catalog.findByCategory('mcp');
        expect(mcps.length).toBeGreaterThanOrEqual(2);
        const localMcp = mcps.find((e) => e.name === 'my-test-mcp');
        expect(localMcp).toBeDefined();
        expect(localMcp.source).toBe('discovered');
        expect(localMcp.description).toContain('my-test-mcp serve');
        const remoteMcp = mcps.find((e) => e.name === 'remote-api');
        expect(remoteMcp).toBeDefined();
        expect(remoteMcp.source).toBe('discovered');
        expect(remoteMcp.description).toContain('api.example.com');
    });
    it('should respect enabled:false — skip disabled MCPs', () => {
        const env = createTempEnv();
        writeConfig(env, {
            'active-mcp': { type: 'local', command: ['active'], enabled: true },
            'disabled-mcp': { type: 'local', command: ['disabled'], enabled: false },
        });
        const catalog = createCatalog(env);
        const mcps = catalog.findByCategory('mcp');
        expect(mcps.some((e) => e.name === 'active-mcp')).toBe(true);
        expect(mcps.some((e) => e.name === 'disabled-mcp')).toBe(false);
    });
    it('should scan opencode skill directories', () => {
        const env = createTempEnv();
        writeSkill(env.opencodeSkillsPath, 'my-qa-tool', 'Custom QA testing skill for our app');
        const catalog = createCatalog(env);
        const skills = catalog.findByCategory('gstack-skill');
        const skill = skills.find((e) => e.name === 'my-qa-tool');
        expect(skill).toBeDefined();
        expect(skill.source).toBe('discovered');
        expect(skill.description).toContain('Custom QA testing skill');
    });
    it('should scan claude skill directories', () => {
        const env = createTempEnv();
        writeSkill(env.claudeSkillsPath, 'my-analysis', 'Custom data analysis skill');
        const catalog = createCatalog(env);
        const builtins = catalog.findByCategory('builtin');
        const skill = builtins.find((e) => e.name === 'my-analysis');
        expect(skill).toBeDefined();
        expect(skill.source).toBe('discovered');
    });
    it('should handle skill directories without SKILL.md (fallback to dirname)', () => {
        const env = createTempEnv();
        const skillDir = join(env.opencodeSkillsPath, 'bare-skill');
        mkdirSync(skillDir, { recursive: true });
        const catalog = createCatalog(env);
        const skills = catalog.findByCategory('gstack-skill');
        const skill = skills.find((e) => e.name === 'bare-skill');
        expect(skill).toBeDefined();
        expect(skill.description).toBeTruthy();
    });
    it('should skip hidden directories in skill paths', () => {
        const env = createTempEnv();
        writeSkill(env.opencodeSkillsPath, 'visible-skill', 'I should be found');
        const hiddenDir = join(env.opencodeSkillsPath, '.hidden');
        mkdirSync(hiddenDir, { recursive: true });
        const catalog = createCatalog(env);
        const skills = catalog.findByCategory('gstack-skill');
        expect(skills.some((e) => e.name === 'visible-skill')).toBe(true);
        expect(skills.some((e) => e.name === '.hidden')).toBe(false);
    });
    it('should include builtin conceptual entries alongside discovered ones', () => {
        const env = createTempEnv();
        writeConfig(env, { 'test-mcp': { type: 'local', command: ['test'], enabled: true } });
        const catalog = createCatalog(env);
        const builtins = catalog.findByCategory('builtin');
        // delegate_task, council, subtask, smartfetch, ast-grep
        expect(builtins.length).toBe(5);
        expect(builtins.every((e) => e.source === 'default')).toBe(true);
    });
    it('should mark toMarkdown() output with prefix icons for discovered entries', () => {
        const env = createTempEnv();
        writeConfig(env, {
            'discovered-mcp': { type: 'local', command: ['disc'], enabled: true },
        });
        writeSkill(env.opencodeSkillsPath, 'discovered-skill', 'A discovered skill');
        const catalog = createCatalog(env);
        const md = catalog.toMarkdown();
        // Discovered MCP should have 📡 prefix
        expect(md).toContain('📡');
        expect(md).toContain('discovered-mcp');
        // Discovered gstack skill should have 🔧 prefix
        expect(md).toContain('🔧');
        expect(md).toContain('discovered-skill');
        // Builtin defaults should NOT have prefix icons
        expect(md).toContain('**delegate_task**');
        expect(md).not.toContain('📡 **delegate_task**');
    });
    it('should find discovered entries via findByTrigger()', () => {
        const env = createTempEnv();
        writeConfig(env, {
            'zork-finder': { type: 'local', command: ['zork'], enabled: true },
        });
        const catalog = createCatalog(env);
        const byName = catalog.findByTrigger('zork-finder');
        expect(byName.length).toBeGreaterThanOrEqual(1);
        expect(byName.some((e) => e.name === 'zork-finder')).toBe(true);
        const byPartial = catalog.findByTrigger('zork');
        expect(byPartial.length).toBeGreaterThanOrEqual(1);
    });
    it('should fallback to defaults when user config has no MCP section', () => {
        const env = createTempEnv();
        // Write a valid JSON file but without mcp key
        writeFileSync(env.configPath, JSON.stringify({ lsp: true }, null, 2), 'utf-8');
        const catalog = createCatalog(env);
        const mcps = catalog.findByCategory('mcp');
        // Should have default MCP entries (14)
        expect(mcps.length).toBe(14);
        expect(mcps.every((e) => e.source === 'default')).toBe(true);
    });
    it('should fallback to default skills when no skill directories exist', () => {
        const env = createTempEnv();
        // Write config so MCPs are loaded from user config (avoiding MCP fallback)
        writeConfig(env, { 'test-mcp': { type: 'local', command: ['test'], enabled: true } });
        // Leave skill dirs empty
        const catalog = createCatalog(env);
        const gskills = catalog.findByCategory('gstack-skill');
        // Should have default gstack-skill entries (15)
        expect(gskills.length).toBe(15);
        expect(gskills.every((e) => e.source === 'default')).toBe(true);
    });
    it('should use entirely discovered entries when both config and skills present', () => {
        const env = createTempEnv();
        writeConfig(env, {
            'discovered-1': { type: 'remote', url: 'https://one.example.com/mcp', enabled: true },
            'discovered-2': { type: 'local', command: ['two'], enabled: true },
        });
        writeSkill(env.opencodeSkillsPath, 'user-skill-a', 'User skill A');
        writeSkill(env.claudeSkillsPath, 'user-skill-b', 'User skill B');
        const catalog = createCatalog(env);
        // All MCPs are discovered
        const mcps = catalog.findByCategory('mcp');
        expect(mcps.length).toBe(2);
        expect(mcps.every((e) => e.source === 'discovered')).toBe(true);
        expect(mcps.map((e) => e.name).sort()).toEqual(['discovered-1', 'discovered-2']);
        // Skills are discovered
        const gskills = catalog.findByCategory('gstack-skill');
        expect(gskills.length).toBe(1);
        expect(gskills[0].source).toBe('discovered');
        expect(gskills[0].name).toBe('user-skill-a');
        const builtins = catalog.findByCategory('builtin');
        // The claude skill + the 5 conceptual builtins
        const discoveredClaude = builtins.filter((e) => e.source === 'discovered');
        const conceptualBuiltins = builtins.filter((e) => e.source === 'default');
        expect(discoveredClaude.length).toBe(1);
        expect(discoveredClaude[0].name).toBe('user-skill-b');
        expect(conceptualBuiltins.length).toBe(5);
    });
});
describe('McpSkillCatalog — backward compatibility with defaults', () => {
    it('should return 34 default entries when no config exists at all', () => {
        const env = createTempEnv();
        // Don't write any config or skills
        const catalog = createCatalog(env);
        const all = catalog.getAll();
        expect(all.length).toBe(34);
        const mcps = catalog.findByCategory('mcp');
        expect(mcps.length).toBe(14);
        const gskills = catalog.findByCategory('gstack-skill');
        expect(gskills.length).toBe(15);
        const builtins = catalog.findByCategory('builtin');
        expect(builtins.length).toBe(5);
    });
    it('all default entries should have source="default"', () => {
        const env = createTempEnv();
        const catalog = createCatalog(env);
        for (const entry of catalog.getAll()) {
            expect(entry.source).toBe('default');
        }
    });
});
//# sourceMappingURL=mcp-skill-catalog.dynamic.test.js.map