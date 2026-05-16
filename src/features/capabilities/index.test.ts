import { describe, test, expect, beforeEach } from 'bun:test';
import { createCapabilitiesExplorer } from './index';

describe('CapabilitiesExplorer', () => {
  let ctx: Parameters<typeof createCapabilitiesExplorer>[0];

  beforeEach(() => {
    ctx = {
      agentCount: 15,
      mcpCount: 13,
      pluginCount: 2,
      integrationCount: 1,
      hasLearningEngine: true,
      hasModelPredictor: true,
      hasBenchmarkTracker: true,
      hasCircuitBreakers: true,
    };
  });

  test('returns base capabilities', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const caps = explorer.getCapabilities();

    expect(caps.length).toBeGreaterThan(0);
    expect(caps.some(c => c.command === '/plan <topic>')).toBe(true);
    expect(caps.some(c => c.command === '/health')).toBe(true);
    expect(caps.some(c => c.command === '/diagnose')).toBe(true);
  });

  test('returns Tier 2 capabilities when enabled', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const tier2 = explorer.getTier2Capabilities();

    expect(tier2.length).toBe(3);
    expect(tier2.some(c => c.name === 'Cross-Session Learning')).toBe(true);
    expect(tier2.some(c => c.name === 'Predictive Routing')).toBe(true);
    expect(tier2.some(c => c.name === 'Performance Tracking')).toBe(true);
  });

  test('returns empty Tier 2 when disabled', () => {
    const disabledCtx = {
      ...ctx,
      hasLearningEngine: false,
      hasModelPredictor: false,
      hasBenchmarkTracker: false,
    };
    const explorer = createCapabilitiesExplorer(disabledCtx);
    const tier2 = explorer.getTier2Capabilities();

    expect(tier2.length).toBe(0);
  });

  test('returns Tier 3 capabilities when enabled', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const tier3 = explorer.getTier3Capabilities();

    expect(tier3.length).toBeGreaterThan(0);
    expect(tier3.some(c => c.name === 'Plugin System')).toBe(true);
    expect(tier3.some(c => c.name === 'Auto-Skill Generation')).toBe(true);
    expect(tier3.some(c => c.name === 'Multi-User Support')).toBe(true);
  });

  test('formats capabilities output', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const output = explorer.formatCapabilities();

    expect(output).toContain('oh-my-unified Capabilities');
    expect(output).toContain('PLANNING & EXECUTION');
    expect(output).toContain('REVIEW & QUALITY');
    expect(output).toContain('SECURITY');
    expect(output).toContain('MONITORING');
    expect(output).toContain('AGENT INTERACTION');
    expect(output).toContain('capabilities across');
  });

  test('includes agent and MCP counts in output', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const output = explorer.formatCapabilities();

    expect(output).toContain('15 agents');
    expect(output).toContain('13 MCPs');
  });

  test('includes tip for /plan and /diagnose', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const output = explorer.formatCapabilities();

    expect(output).toContain('/plan');
    expect(output).toContain('/diagnose');
  });

  test('each capability has required fields', () => {
    const explorer = createCapabilitiesExplorer(ctx);
    const caps = explorer.getCapabilities();

    for (const cap of caps) {
      expect(cap.category).toBeDefined();
      expect(cap.icon).toBeDefined();
      expect(cap.name).toBeDefined();
      expect(cap.command).toBeDefined();
      expect(cap.description).toBeDefined();
      expect(cap.example).toBeDefined();
    }
  });
});
