import { describe, test, expect, beforeEach } from 'bun:test';
import { createDiagnosticsChecker } from './index';

describe('DiagnosticsChecker', () => {
  test('runs all checks and returns report', async () => {
    const checker = createDiagnosticsChecker({
      agentCount: 15,
      mcpCount: 13,
      tuiRunning: true,
      interviewRunning: true,
      pluginCount: 2,
      integrationCount: 1,
      circuitBreakerHealth: [
        { name: 'review-work', state: 'closed' },
        { name: 'hyperplan', state: 'closed' },
      ],
    });

    const report = await checker.runAll();
    expect(report.total).toBe(12);
    expect(report.passed).toBeGreaterThan(0);
    // With all systems healthy, should be healthy or degraded (depends on optional features)
    expect(['healthy', 'degraded']).toContain(report.overall);
  });

  test('detects degraded state with warnings', async () => {
    const checker = createDiagnosticsChecker({
      agentCount: 10,
      mcpCount: 5,
      tuiRunning: false,
      interviewRunning: false,
      pluginCount: 0,
      integrationCount: 0,
      circuitBreakerHealth: [],
    });

    const report = await checker.runAll();
    expect(report.warnings).toBeGreaterThan(0);
    expect(report.overall).toBe('degraded');
  });

  test('formats report with categories', async () => {
    const checker = createDiagnosticsChecker({
      agentCount: 15,
      mcpCount: 13,
      tuiRunning: true,
      interviewRunning: true,
      pluginCount: 2,
      integrationCount: 1,
      circuitBreakerHealth: [
        { name: 'review-work', state: 'closed' },
      ],
    });

    const report = await checker.runAll();
    const formatted = checker.formatReport(report);

    expect(formatted).toContain('oh-my-unified Diagnostic Report');
    expect(formatted).toContain('System Health');
    expect(formatted).toContain('checks passed');
  });

  test('MCP check passes with expected count', async () => {
    const checker = createDiagnosticsChecker({ mcpCount: 13 });
    const report = await checker.runAll();
    const mcpCheck = report.checks.find(c => c.name === 'MCP Connectivity');
    expect(mcpCheck?.status).toBe('pass');
  });

  test('MCP check warns with partial count', async () => {
    const checker = createDiagnosticsChecker({ mcpCount: 5 });
    const report = await checker.runAll();
    const mcpCheck = report.checks.find(c => c.name === 'MCP Connectivity');
    expect(mcpCheck?.status).toBe('warn');
  });

  test('MCP check fails with zero count', async () => {
    const checker = createDiagnosticsChecker({ mcpCount: 0 });
    const report = await checker.runAll();
    const mcpCheck = report.checks.find(c => c.name === 'MCP Connectivity');
    expect(mcpCheck?.status).toBe('fail');
  });

  test('Agent check passes with expected count', async () => {
    const checker = createDiagnosticsChecker({ agentCount: 15 });
    const report = await checker.runAll();
    const agentCheck = report.checks.find(c => c.name === 'Agent Registration');
    expect(agentCheck?.status).toBe('pass');
  });

  test('Circuit breaker check passes when all closed', async () => {
    const checker = createDiagnosticsChecker({
      circuitBreakerHealth: [
        { name: 'review-work', state: 'closed' },
        { name: 'hyperplan', state: 'closed' },
      ],
    });
    const report = await checker.runAll();
    const cbCheck = report.checks.find(c => c.name === 'Circuit Breakers');
    expect(cbCheck?.status).toBe('pass');
  });

  test('Circuit breaker warns when some open', async () => {
    const checker = createDiagnosticsChecker({
      circuitBreakerHealth: [
        { name: 'review-work', state: 'closed' },
        { name: 'hyperplan', state: 'open' },
      ],
    });
    const report = await checker.runAll();
    const cbCheck = report.checks.find(c => c.name === 'Circuit Breakers');
    expect(cbCheck?.status).toBe('warn');
  });

  test('SQLite check passes', async () => {
    const checker = createDiagnosticsChecker();
    const report = await checker.runAll();
    const sqliteCheck = report.checks.find(c => c.name === 'SQLite Persistence');
    expect(sqliteCheck?.status).toBe('pass');
  });

  test('File system check passes', async () => {
    const checker = createDiagnosticsChecker();
    const report = await checker.runAll();
    const fsCheck = report.checks.find(c => c.name === 'File System');
    expect(fsCheck?.status).toBe('pass');
  });

  test('Network check passes', async () => {
    const checker = createDiagnosticsChecker();
    const report = await checker.runAll();
    const netCheck = report.checks.find(c => c.name === 'Network');
    expect(netCheck?.status).toBe('pass');
  });

  test('Learning engine check passes when SQLite available', async () => {
    const checker = createDiagnosticsChecker();
    const report = await checker.runAll();
    const learnCheck = report.checks.find(c => c.name === 'Learning Engine');
    expect(learnCheck?.status).toBe('pass');
  });

  test('Plugin registry warns when no plugins', async () => {
    const checker = createDiagnosticsChecker({ pluginCount: 0 });
    const report = await checker.runAll();
    const pluginCheck = report.checks.find(c => c.name === 'Plugin Registry');
    expect(pluginCheck?.status).toBe('warn');
  });

  test('Integration hub warns when no integrations', async () => {
    const checker = createDiagnosticsChecker({ integrationCount: 0 });
    const report = await checker.runAll();
    const integrationCheck = report.checks.find(c => c.name === 'Integration Hub');
    expect(integrationCheck?.status).toBe('warn');
  });
});
