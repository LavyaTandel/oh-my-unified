import { describe, it, expect, afterEach } from 'bun:test';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ── Persistence ──────────────────────────────────────────────────────
import { TaskRegistry, type TaskRecord } from '../persistence';

// ── MCP Bus ──────────────────────────────────────────────────────────
import { McpBus, DEFAULT_MCP_SERVERS } from '../mcp-bus';

// ── Tool-Use Enforcer ────────────────────────────────────────────────
import { ToolUsageMonitor } from '../features/tool-use-enforcer/tool-usage-monitor';
import { McpSkillCatalog } from '../features/tool-use-enforcer/mcp-skill-catalog';
import { AgentContextEnricher } from '../features/tool-use-enforcer/agent-context-enricher';

// ── Team Mode ────────────────────────────────────────────────────────
import { TeamTaskList } from '../features/team-mode/task-list';

// ── OpenClaw ─────────────────────────────────────────────────────────
import { OpenClawGateway } from '../openclaw/gateway';

// ── Divoom ───────────────────────────────────────────────────────────
import { DivoomManager } from '../divoom/manager';

// ── Background ───────────────────────────────────────────────────────
import { PersistentTaskEngine } from '../background/persistent-task-engine';
import { TaskReconstructor } from '../background/reconstructor';

// ── System Observer ───────────────────────────────────────────────────
import { SystemObserver } from '../features/system-observer';

// ── Helpers ───────────────────────────────────────────────────────────

function tempDbPath(): string {
  return join(tmpdir(), `integ_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.db`);
}

function cleanDb(p: string): void {
  for (const ext of ['', '-wal', '-shm']) {
    try { if (existsSync(p + ext)) unlinkSync(p + ext); } catch { /* ignore */ }
  }
}

/** A minimal SessionClient that returns canned data for the reconstructor tests. */
function makeMockSessionClient(overrides?: {
  readResult?: { messages?: Array<{ role: string; content: string; ts?: number }>; status?: string };
  infoResult?: { id: string; status?: string; messageCount?: number };
}): import('../background/types').SessionClient {
  const readResult = overrides?.readResult ?? {
    messages: [{ role: 'user', content: 'mock task description', ts: Date.now() }],
    status: 'completed',
  };
  const infoResult = overrides?.infoResult ?? {
    id: 'ses_mock',
    status: 'completed',
    messageCount: 1,
  };

  return {
    session: {
      read: async () => readResult,
      info: async () => infoResult,
    },
  };
}

// ══════════════════════════════════════════════════════════════════════
// 1. Task Persistence Across Restart
// ══════════════════════════════════════════════════════════════════════

describe('1. Task persistence across restart', () => {
  const dbPath = tempDbPath();

  afterEach(() => cleanDb(dbPath));

  it('should persist a task and read it back from a new registry instance at the same path', () => {
    // ── First session
    const reg1 = new TaskRegistry(dbPath);
    const created = reg1.createTask({
      id: 'bg_test_001',
      sessionId: 'ses_alpha',
      parentSessionId: 'ses_parent',
      agent: 'mimir',
      status: 'running',
      description: 'Integration test task',
      category: 'test',
      completedAt: undefined,
      outputCache: 'intermediate output',
      metadata: JSON.stringify({ source: 'integration-test', attempt: 1 }),
    });
    reg1.close();

    // ── Second session — same db file
    const reg2 = new TaskRegistry(dbPath);
    const read = reg2.getTask('bg_test_001');

    expect(read).not.toBeNull();
    expect(read!.id).toBe('bg_test_001');
    expect(read!.sessionId).toBe('ses_alpha');
    expect(read!.parentSessionId).toBe('ses_parent');
    expect(read!.agent).toBe('mimir');
    expect(read!.status).toBe('running');
    expect(read!.description).toBe('Integration test task');
    expect(read!.category).toBe('test');
    expect(read!.outputCache).toBe('intermediate output');
    expect(read!.metadata).toBe(JSON.stringify({ source: 'integration-test', attempt: 1 }));
    expect(read!.createdAt).toBeGreaterThan(0);
    expect(read!.updatedAt).toBeGreaterThan(0);

    reg2.close();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. MCP Bus Health
// ══════════════════════════════════════════════════════════════════════

describe('2. MCP Bus health', () => {
  it('should create McpBus with default servers, connectAll, and report health without throwing', async () => {
    const bus = new McpBus(DEFAULT_MCP_SERVERS);
    (bus as any).pingServer = async () => true;
    (bus as any).connectRemoteMcp = async () => {};

    // connectAll should not throw
    let statuses: import('../mcp-bus').McpHealthStatus[];
    try {
      statuses = await bus.connectAll();
    } catch (err) {
      expect.unreachable(`connectAll threw: ${err}`);
      return;
    }

    // Should have one status per server
    expect(statuses.length).toBe(DEFAULT_MCP_SERVERS.length);

    // Each status should have the expected shape
    for (const s of statuses) {
      expect(s.server).toBeTruthy();
      expect(typeof s.online).toBe('boolean');
      expect(s.lastCheck).toBeGreaterThan(0);
      // All enabled servers should report online = true (simulated)
      const cfg = DEFAULT_MCP_SERVERS.find(c => c.name === s.server);
      if (cfg?.enabled) {
        expect(s.online).toBe(true);
      }
    }

    // getOnlineServers should return all enabled ones
    const online = bus.getOnlineServers();
    expect(online.length).toBe(DEFAULT_MCP_SERVERS.filter(c => c.enabled).length);

    // Individual health lookup
    const clawdiHealth = bus.getHealth('clawdi');
    expect(clawdiHealth).toBeDefined();
    expect(clawdiHealth!.online).toBe(true);

    bus.shutdown();
  });

  it('should handle empty server list gracefully', async () => {
    const bus = new McpBus([]);
    const statuses = await bus.connectAll();
    expect(statuses.length).toBe(0);
    bus.shutdown();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. Tool Usage Monitoring
// ══════════════════════════════════════════════════════════════════════

describe('3. Tool usage monitoring', () => {
  it('should nudge after 3 consecutive primitive tool uses, then stop nudging after an MCP use', () => {
    const monitor = new ToolUsageMonitor();
    const sessionId = 'ses_tool_test';

    // 3 primitive tool uses → needsNudge should be true
    monitor.recordToolUse(sessionId, 'bash', 'primitive');
    monitor.recordToolUse(sessionId, 'read', 'primitive');
    monitor.recordToolUse(sessionId, 'write', 'primitive');

    expect(monitor.needsNudge(sessionId)).toBe(true);

    // generateNudge should return a string with available tools
    const nudge = monitor.generateNudge(sessionId, ['code-review-graph', 'exa', 'context7']);
    expect(nudge).not.toBeNull();
    expect(nudge!).toContain('primitive');
    expect(nudge!).toContain('code-review-graph');

    // Record an MCP tool use → needsNudge should reset to false
    monitor.recordToolUse(sessionId, 'code-review-graph_query_graph', 'mcp');

    // Now needsNudge should be false (lastNonPrimitiveTurn was just updated)
    expect(monitor.needsNudge(sessionId)).toBe(false);

    // generateNudge should return null when no nudge needed
    expect(monitor.generateNudge(sessionId, [])).toBeNull();

    monitor.clearSession(sessionId);
  });

  it('should return false for unknown sessions', () => {
    const monitor = new ToolUsageMonitor();
    expect(monitor.needsNudge('nonexistent')).toBe(false);
    expect(monitor.generateNudge('nonexistent', [])).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. Team Mode with Persistence
// ══════════════════════════════════════════════════════════════════════

describe('4. Team Mode with persistence', () => {
  const dbPath = tempDbPath();

  afterEach(() => cleanDb(dbPath));

  it('should persist team tasks across close/re-open', () => {
    // ── First session
    const list1 = new TeamTaskList(dbPath);
    list1.createTask({
      id: 'team_task_1',
      teamId: 'team_alpha',
      title: 'Build integration test',
      description: 'Write and run integration tests',
      assignedTo: undefined,
      status: 'pending',
      dependsOn: [],
      createdAt: Date.now(),
    });
    list1.createTask({
      id: 'team_task_2',
      teamId: 'team_alpha',
      title: 'Review PR',
      description: 'Review the open pull request',
      assignedTo: 'orchestrator',
      status: 'in_progress',
      dependsOn: ['team_task_1'],
      createdAt: Date.now(),
    });

    // Assign and update
    list1.assignTask('team_task_1', 'builder');
    list1.updateStatus('team_task_1', 'in_progress');

    list1.close();

    // ── Second session — same db file
    const list2 = new TeamTaskList(dbPath);
    const tasks = list2.getTasksByTeam('team_alpha');

    expect(tasks.length).toBe(2);

    const task1 = tasks.find(t => t.id === 'team_task_1')!;
    expect(task1).toBeDefined();
    expect(task1.title).toBe('Build integration test');
    expect(task1.assignedTo).toBe('builder');
    expect(task1.status).toBe('in_progress');
    expect(task1.dependsOn).toEqual([]);

    const task2 = tasks.find(t => t.id === 'team_task_2')!;
    expect(task2).toBeDefined();
    expect(task2.title).toBe('Review PR');
    expect(task2.assignedTo).toBe('orchestrator');
    expect(task2.status).toBe('in_progress');
    expect(task2.dependsOn).toEqual(['team_task_1']);

    list2.close();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. OpenClaw Gateway
// ══════════════════════════════════════════════════════════════════════

describe('5. OpenClaw Gateway', () => {
  it('should start, send a message, stop, and verify no errors', async () => {
    const gateway = new OpenClawGateway({
      enabled: true,
      discord: { token: 'mock_discord_token', channelId: '123456' },
    });

    // Should not throw on start
    await expect(gateway.start()).resolves.toBeUndefined();

    // Should not throw on send
    const sent = await gateway.send({
      channel: 'discord',
      content: 'Hello from integration test',
    });
    expect(sent).toBe(true);

    // Should be active
    expect(gateway.isActive()).toBe(true);

    // Should not throw on stop
    await expect(gateway.stop()).resolves.toBeUndefined();
  });

  it('should handle disabled config', () => {
    const gateway = new OpenClawGateway({ enabled: false });
    expect(gateway.isActive()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 6. Divoom Display
// ══════════════════════════════════════════════════════════════════════

describe('6. Divoom display', () => {
  it('should connect, update status, and disconnect through full lifecycle', async () => {
    const manager = new DivoomManager();

    // Initially disconnected
    expect(manager.connectionState).toBe('disconnected');

    // Connect
    const deviceInfo = await manager.connect();
    expect(deviceInfo.model).toBe('Pixoo-64');
    expect(deviceInfo.firmware).toBe('2.4.0');
    expect(deviceInfo.mac).toBe('AA:BB:CC:DD:EE:FF');
    expect(manager.isConnected()).toBe(true);
    expect(manager.connectionState).toBe('connected');
    expect(manager.deviceInfo).toEqual(deviceInfo);

    // Update status with agent name + task count
    await expect(
      manager.updateStatus({
        agentName: 'mimir',
        taskCount: 3,
        progress: 75,
        message: 'Running integration tests',
      }),
    ).resolves.toBeUndefined();

    // Disconnect
    await manager.disconnect();
    expect(manager.isConnected()).toBe(false);
    expect(manager.connectionState).toBe('disconnected');
    expect(manager.deviceInfo).toBeNull();
  });

  it('should warn when updating status while disconnected', async () => {
    const manager = new DivoomManager();
    // Should NOT throw — just warn
    await expect(
      manager.updateStatus({ agentName: 'test', taskCount: 1, progress: 50 }),
    ).resolves.toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 7. AgentContextEnricher
// ══════════════════════════════════════════════════════════════════════

describe('7. AgentContextEnricher', () => {
  it('should generate MCP context block containing clawdi and gbrain', () => {
    const catalog = new McpSkillCatalog();
    const enricher = new AgentContextEnricher(catalog);

    const block = enricher.generateMcpContextBlock();

    // The markdown output should mention clawdi and gbrain
    expect(block).toContain('clawdi');
    expect(block).toContain('gbrain');
    expect(block).toContain('# Available Tools & Skills');

    // Should also have tool suggestions
    const suggestions = enricher.generateToolSuggestions('security audit');
    expect(suggestions).toContain('cso');
    expect(suggestions).toContain('[GSKILL]');
  });
});

// ══════════════════════════════════════════════════════════════════════
// 8. Task Reconstruction
// ══════════════════════════════════════════════════════════════════════

describe('8. Task reconstruction', () => {
  const dbPath = tempDbPath();

  afterEach(() => cleanDb(dbPath));

  it('should reconstruct a task with mock session data when DB row is deleted', async () => {
    const registry = new TaskRegistry(dbPath);

    // Create a task
    registry.createTask({
      id: 'bg_recon_001',
      sessionId: 'ses_recon',
      parentSessionId: undefined,
      agent: 'eir',
      status: 'running',
      description: 'Task for reconstruction test',
      category: 'test',
      completedAt: undefined,
      outputCache: undefined,
      metadata: undefined,
    });

    // Verify it exists
    expect(registry.getTask('bg_recon_001')).not.toBeNull();

    // Delete directly from DB
    registry.deleteTask('bg_recon_001');

    // Verify it's gone
    expect(registry.getTask('bg_recon_001')).toBeNull();

    // Reconstruct from mock session data
    const reconstructor = new TaskReconstructor(registry);
    const mockClient = makeMockSessionClient({
      readResult: {
        messages: [
          { role: 'user', content: 'Reconstructed task description', ts: Date.now() },
          { role: 'assistant', content: 'Task completed successfully', ts: Date.now() + 100 },
        ],
        status: 'completed',
      },
    });

    const reconstructed = await reconstructor.reconstruct('bg_recon_001', 'ses_recon', mockClient);

    // Verify task was recreated
    expect(reconstructed).not.toBeNull();
    expect(reconstructed!.id).toBe('bg_recon_001');
    expect(reconstructed!.sessionId).toBe('ses_recon');
    expect(reconstructed!.status).toBe('completed');
    expect(reconstructed!.category).toBe('reconstructed');
    expect(reconstructed!.outputCache).toContain('Task completed successfully');

    // Verify it's now queryable from the registry
    const refetched = registry.getTask('bg_recon_001');
    expect(refetched).not.toBeNull();
    expect(refetched!.id).toBe('bg_recon_001');

    // Messages should have been restored
    const messages = registry.getMessages('bg_recon_001');
    expect(messages.length).toBeGreaterThanOrEqual(2);

    registry.close();
  });

  it('should return null when both session.read and session.info fail', async () => {
    const registry = new TaskRegistry(dbPath);
    const reconstructor = new TaskReconstructor(registry);

    // Client with read that throws
    const brokenClient: import('../background/types').SessionClient = {
      session: {
        read: async () => { throw new Error('Session not found'); },
        info: async () => { throw new Error('Session not found'); },
      },
    };

    const result = await reconstructor.reconstruct('bg_missing', 'ses_missing', brokenClient);
    expect(result).toBeNull();

    registry.close();
  });
});

// ══════════════════════════════════════════════════════════════════════
// 9. Full Orchestration Simulation
// ══════════════════════════════════════════════════════════════════════

describe('9. Full orchestration simulation', () => {
  const dbPath = tempDbPath();

  afterEach(() => cleanDb(dbPath));

  it('should launch a task, simulate completion, and retrieve output via getTaskOutput', async () => {
    const engine = new PersistentTaskEngine({ dbPath });

    // Create a mock client
    const mockClient = makeMockSessionClient();

    // Launch a background task
    const { taskId, sessionId } = await engine.launchTask(
      {
        agent: 'orchestrator',
        description: 'Full orchestration simulation task',
        category: 'integration-test',
      },
      mockClient,
    );

    expect(taskId).toBeTruthy();
    expect(taskId.startsWith('bg_')).toBe(true);
    expect(sessionId).toBeTruthy();
    expect(sessionId.startsWith('ses_')).toBe(true);

    // Verify the task exists in the registry
    const running = engine.listRunningTasks();
    expect(running.some(t => t.id === taskId)).toBe(true);

    // Simulate completion: add a message and update status
    const registry = new TaskRegistry(dbPath);
    registry.addMessage(taskId, 'user', 'Run the analysis');
    registry.addMessage(taskId, 'assistant', 'Analysis complete — here are the results');
    registry.updateStatus(taskId, 'completed', {
      outputCache: 'Analysis complete — here are the results',
    });
    registry.close();

    // Now retrieve the output via the engine
    const output = await engine.getTaskOutput(taskId, sessionId, mockClient);

    expect(output).not.toBeNull();
    expect(output!.task.id).toBe(taskId);
    expect(output!.task.status).toBe('completed');
    expect(output!.task.description).toBe('Full orchestration simulation task');
    expect(output!.messages.length).toBeGreaterThanOrEqual(2);
    expect(output!.finalContent).toBe('Analysis complete — here are the results');

    // Verify output matches expectations
    expect(output!.messages[0].role).toBe('user');
    expect(output!.messages[0].content).toBe('Run the analysis');
    expect(output!.messages[1].role).toBe('assistant');
    expect(output!.messages[1].content).toBe('Analysis complete — here are the results');

    engine.shutdown();
  });

  // ══════════════════════════════════════════════════════════════════════
  // 6. System Observer Integration
  // ══════════════════════════════════════════════════════════════════════

  it('SystemObserver runs health checks across all registered components', async () => {
    const observer = new SystemObserver();
    const report = await observer.runHealthCheck();

    expect(report.components).toHaveLength(7);
    expect(report.timestamp).toBeGreaterThan(0);
    expect(report.warnings).toBeDefined();
    expect(report.errors).toBeDefined();
    expect(report.agentActivity).toBeDefined();
    expect(typeof report.runningTasks).toBe('number');
    expect(typeof report.connectedMcps).toBe('number');

    observer.stop();
  });

  it('SystemObserver integrates with the report/error flow from other modules', () => {
    const observer = new SystemObserver();

    // Simulate errors flowing in from real modules
    observer.reportWarning('persistent-task-engine', 'reconstruction took > 5s');
    observer.reportError('mcp-bus', 'clawdi MCP not responding');
    observer.recordAgentActivity('sif');
    observer.recordAgentActivity('eir');
    observer.recordTaskLaunch();
    observer.recordTaskCompletion('sif');

    const report = observer.getStatus();
    expect(report.warnings.length).toBeGreaterThanOrEqual(1);
    expect(report.errors.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(report.agentActivity)).toContain('sif');
    expect(Object.keys(report.agentActivity)).toContain('eir');
    expect(report.runningTasks).toBe(0); // launched then completed

    observer.stop();
  });
});
