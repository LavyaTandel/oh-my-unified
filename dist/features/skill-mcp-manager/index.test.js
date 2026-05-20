import { describe, it, expect } from 'bun:test';
import { SkillMcpManager } from './index';
describe('SkillMcpManager', () => {
    it('registers MCP entries', () => {
        const manager = new SkillMcpManager();
        manager.register('browser', 'playwright', { command: 'npx', args: ['@playwright/mcp'] });
        const registry = manager.getRegistry();
        expect(registry).toHaveLength(1);
        expect(registry[0].skillName).toBe('browser');
        expect(registry[0].serverName).toBe('playwright');
    });
    it('unregisters entries', () => {
        const manager = new SkillMcpManager();
        manager.register('browser', 'playwright', { command: 'npx' });
        manager.unregister('browser', 'playwright');
        expect(manager.getRegistry()).toHaveLength(0);
    });
    it('connects to stdio MCP', async () => {
        const manager = new SkillMcpManager();
        manager.register('test', 'echo-server', { command: 'echo', args: ['[]'] });
        const conn = await manager.connect('test', 'echo-server');
        expect(conn.status).toBe('connected');
        manager.disconnectAll('test');
    });
    it('handles connection errors gracefully', async () => {
        const manager = new SkillMcpManager();
        manager.register('test', 'bad-server', { command: '/nonexistent/path/to/binary' });
        const conn = await manager.connect('test', 'bad-server');
        expect(conn.status).toBe('connected');
        expect(conn.tools).toHaveLength(0);
        manager.disconnectAll('test');
    });
    it('returns error for unregistered server', async () => {
        const manager = new SkillMcpManager();
        const conn = await manager.connect('test', 'unknown');
        expect(conn.status).toBe('error');
        expect(conn.error).toBe('Not registered');
    });
    it('parses YAML frontmatter', () => {
        const manager = new SkillMcpManager();
        const yaml = `mcp:
- name: playwright
  command: npx
  args: ["@playwright/mcp"]
- name: context7
  url: https://example.com/mcp`;
        const configs = manager.parseSkillMcpYaml(yaml, 'test-skill');
        expect(configs).toHaveLength(2);
        expect(configs[0].name).toBe('playwright');
        expect(configs[0].command).toBe('npx');
        expect(configs[1].name).toBe('context7');
        expect(configs[1].url).toBe('https://example.com/mcp');
    });
    it('tracks connections', async () => {
        const manager = new SkillMcpManager();
        manager.register('test', 'srv1', { command: 'echo', args: ['[]'] });
        await manager.connect('test', 'srv1');
        const connections = manager.getAllConnections();
        expect(connections).toHaveLength(1);
        expect(connections[0].skillName).toBe('test');
        expect(connections[0].serverName).toBe('srv1');
        const single = manager.getConnection('test', 'srv1');
        expect(single).toBeDefined();
        expect(single?.status).toBe('connected');
        manager.disconnectAll('test');
    });
    it('disconnects individual server', async () => {
        const manager = new SkillMcpManager();
        manager.register('test', 'srv1', { command: 'echo', args: ['[]'] });
        await manager.connect('test', 'srv1');
        manager.disconnect('test', 'srv1');
        expect(manager.getConnection('test', 'srv1')).toBeUndefined();
    });
    it('disposes cleanly', async () => {
        const manager = new SkillMcpManager();
        manager.register('test', 'srv1', { command: 'echo', args: ['[]'] });
        await manager.connect('test', 'srv1');
        manager.dispose();
        expect(manager.getRegistry()).toHaveLength(0);
        expect(manager.getAllConnections()).toHaveLength(0);
    });
});
//# sourceMappingURL=index.test.js.map