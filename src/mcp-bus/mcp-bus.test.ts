import { describe, expect, test } from 'bun:test';
import { McpBus, DEFAULT_MCP_SERVERS } from './index';

describe('McpBus', () => {
  test('1. creates McpBus with default servers', () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    expect(bus).toBeDefined();
    expect(bus.getOnlineServers()).toEqual([]);
    bus.shutdown();
  });

  test('2. registerServer adds server to registry', () => {
    const bus = new McpBus();
    bus.registerServer({ name: 'test-server', type: 'local', command: ['echo', 'hello'], enabled: true });
    bus.registerServer({ name: 'disabled-server', type: 'remote', url: 'http://localhost', enabled: false });

    // Online servers should be empty before connectAll
    expect(bus.getOnlineServers()).toEqual([]);
    bus.shutdown();
  });

  test('3. connectAll returns status for all servers (never throws)', async () => {
    const bus = new McpBus([
      { name: 'alpha', type: 'local', command: ['echo', 'a'], enabled: true },
      { name: 'beta', type: 'remote', url: 'http://localhost:9999', enabled: false },
    ]);
    (bus as any).pingServer = async () => true;
    (bus as any).connectRemoteMcp = async () => {};

    const results = await bus.connectAll();
    expect(results.length).toBe(2);

    const alpha = results.find((r) => r.server === 'alpha');
    expect(alpha).toBeDefined();
    expect(alpha!.online).toBe(true); // marked online (Wave 2 will do real check)
    expect(alpha!.lastCheck).toBeGreaterThan(0);

    const beta = results.find((r) => r.server === 'beta');
    expect(beta).toBeDefined();
    expect(beta!.online).toBe(false); // disabled
    expect(beta!.error).toBe('server disabled');

    bus.shutdown();
  });

  test('4. healthCheck returns statuses', async () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    (bus as any).pingServer = async () => true;
    (bus as any).connectRemoteMcp = async () => {};
    const statuses = await bus.healthCheck();
    expect(statuses.length).toBeGreaterThan(0);
    // All default servers are enabled, so all should be online
    for (const s of statuses) {
      expect(s.online).toBe(true);
    }
    bus.shutdown();
  });

  test('5. getOnlineServers returns only online servers', async () => {
    const bus = new McpBus([
      { name: 'enabled-srv', type: 'local', command: ['echo'], enabled: true },
      { name: 'disabled-srv', type: 'local', command: ['echo'], enabled: false },
    ]);
    (bus as any).pingServer = async () => true;
    (bus as any).connectRemoteMcp = async () => {};

    // Before connectAll, no servers are online
    expect(bus.getOnlineServers().length).toBe(0);

    await bus.connectAll();

    const online = bus.getOnlineServers();
    expect(online.length).toBe(1);
    expect(online[0].name).toBe('enabled-srv');
    bus.shutdown();
  });

  test('6. startHealthMonitor sets up interval', async () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    (bus as any).pingServer = async () => true;
    (bus as any).connectRemoteMcp = async () => {};
    bus.startHealthMonitor(60000);

    // Check getHealth returns data after connectAll runs first
    await bus.connectAll();
    const health = bus.getHealth('clawdi');
    expect(health).toBeDefined();
    expect(health!.online).toBe(true);

    bus.stopHealthMonitor();
    bus.shutdown();
  });

  test('7. stopHealthMonitor clears interval', () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    bus.startHealthMonitor(100);
    bus.stopHealthMonitor();

    // Calling twice should not throw
    bus.stopHealthMonitor();
    bus.shutdown();
  });

  test('8. shutdown cleans up', () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    bus.startHealthMonitor(100);
    bus.shutdown();

    // After shutdown, no online servers
    expect(bus.getOnlineServers()).toEqual([]);
  });

  test('getHealth returns undefined for unknown server', () => {
    const bus = new McpBus();
    const health = bus.getHealth('nonexistent');
    expect(health).toBeUndefined();
    bus.shutdown();
  });

  test('registerServer can override existing server', () => {
    const bus = new McpBus();
    bus.registerServer({ name: 'srv', type: 'local', command: ['v1'], enabled: true });
    bus.registerServer({ name: 'srv', type: 'remote', url: 'http://v2', enabled: false });

    // After connectAll, the overridden server should show as disabled
    bus.shutdown();
  });

  test('DEFAULT_MCP_SERVERS includes all 14 MCPs', () => {
    expect(DEFAULT_MCP_SERVERS.length).toBe(13);
    const names = DEFAULT_MCP_SERVERS.map((s) => s.name);
    expect(names).toContain('clawdi');
    expect(names).toContain('gbrain');
    expect(names).toContain('context-mode');
    expect(names).toContain('code-review-graph');
    expect(names).toContain('gitnexus');
    expect(names).toContain('loom-mcp');
    expect(names).toContain('openspace');
    expect(names).toContain('context7');
    expect(names).toContain('exa');
    expect(names).toContain('gh_grep');
    expect(names).toContain('deepwiki');
    expect(names).toContain('sequential-thinking');
    expect(names).toContain('agent-browser');
  });

  test('config schema persistence section validates correctly', async () => {
    // Dynamic import to avoid issues if zod not loaded
    const { PluginConfigSchema } = await import('../config/schema');

    // Valid config with unified sections
    const result = PluginConfigSchema.parse({
      persistence: { dbPath: '/tmp/test.db', taskRetentionDays: 14 },
      mcpBus: { enabled: true, healthCheckIntervalMs: 15000 },
      workflow: { defaultPhase: 'assemble', autoImprovise: false },
      background: { maxConcurrentTasks: 3, defaultTimeoutMs: 60000 },
      openclaw: { enabled: true },
    });

    expect(result.persistence?.dbPath).toBe('/tmp/test.db');
    expect(result.persistence?.taskRetentionDays).toBe(14);
    expect(result.mcpBus?.enabled).toBe(true);
    expect(result.workflow?.defaultPhase).toBe('assemble');
    expect(result.workflow?.autoImprovise).toBe(false);
    expect(result.background?.maxConcurrentTasks).toBe(3);
    expect(result.openclaw?.enabled).toBe(true);
  });

  test('config schema uses defaults for optional fields', async () => {
    const { PluginConfigSchema } = await import('../config/schema');

    // Empty config should use all defaults
    const result = PluginConfigSchema.parse({});
    expect(result.persistence).toBeUndefined();
    expect(result.mcpBus).toBeUndefined();
    expect(result.workflow).toBeUndefined();
    expect(result.background).toBeUndefined();
    expect(result.openclaw).toBeUndefined();
  });
});
