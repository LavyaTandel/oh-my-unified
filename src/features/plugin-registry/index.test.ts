import { describe, test, expect, beforeEach } from 'bun:test';
import { PluginRegistry, createPluginRegistry } from './index';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = createPluginRegistry();
  });

  test('registers and retrieves plugin', () => {
    registry.register({
      metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      hooks: [],
      enabled: true,
    });

    const plugin = registry.getPlugin('test-plugin');
    expect(plugin).toBeDefined();
    expect(plugin?.metadata.name).toBe('Test Plugin');
  });

  test('unregisters plugin', () => {
    registry.register({
      metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      hooks: [],
      enabled: true,
    });

    const result = registry.unregister('test-plugin');
    expect(result).toBe(true);
    expect(registry.getPlugin('test-plugin')).toBeUndefined();
  });

  test('enables and disables plugin', () => {
    registry.register({
      metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      hooks: [],
      enabled: true,
    });

    registry.disable('test-plugin');
    expect(registry.getPlugin('test-plugin')?.enabled).toBe(false);

    registry.enable('test-plugin');
    expect(registry.getPlugin('test-plugin')?.enabled).toBe(true);
  });

  test('registers and retrieves hooks', () => {
    registry.register({
      metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      hooks: [
        {
          name: 'chat.message',
          handler: async () => {},
          priority: 50,
        },
      ],
      enabled: true,
    });

    const hooks = registry.getHooks('chat.message');
    expect(hooks.length).toBe(1);
    expect(hooks[0].name).toBe('chat.message');
  });

  test('sorts hooks by priority', () => {
    registry.register({
      metadata: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
      hooks: [
        { name: 'chat.message', handler: async () => {}, priority: 100 },
      ],
      enabled: true,
    });

    registry.register({
      metadata: { id: 'plugin-b', name: 'Plugin B', version: '1.0.0' },
      hooks: [
        { name: 'chat.message', handler: async () => {}, priority: 10 },
      ],
      enabled: true,
    });

    const hooks = registry.getHooks('chat.message');
    expect(hooks.length).toBe(2);
    expect(hooks[0].priority).toBe(10);
    expect(hooks[1].priority).toBe(100);
  });

  test('executes hooks in order', async () => {
    const callOrder: number[] = [];

    registry.register({
      metadata: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
      hooks: [
        {
          name: 'chat.message',
          handler: async () => { callOrder.push(1); },
          priority: 100,
        },
      ],
      enabled: true,
    });

    registry.register({
      metadata: { id: 'plugin-b', name: 'Plugin B', version: '1.0.0' },
      hooks: [
        {
          name: 'chat.message',
          handler: async () => { callOrder.push(2); },
          priority: 50,
        },
      ],
      enabled: true,
    });

    await registry.executeHooks('chat.message', {}, {});
    expect(callOrder).toEqual([2, 1]);
  });

  test('generates stats', () => {
    registry.register({
      metadata: { id: 'plugin-a', name: 'Plugin A', version: '1.0.0' },
      hooks: [
        { name: 'chat.message', handler: async () => {} },
        { name: 'tool.execute.after', handler: async () => {} },
      ],
      enabled: true,
    });

    registry.register({
      metadata: { id: 'plugin-b', name: 'Plugin B', version: '1.0.0' },
      hooks: [
        { name: 'chat.message', handler: async () => {} },
      ],
      enabled: false,
    });

    const stats = registry.getStats();
    expect(stats.totalPlugins).toBe(2);
    expect(stats.enabledPlugins).toBe(1);
    expect(stats.totalHooks).toBe(3);
    expect(stats.byHookType['chat.message']).toBe(2);
    expect(stats.byHookType['tool.execute.after']).toBe(1);
  });

  test('clears all plugins', () => {
    registry.register({
      metadata: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      hooks: [],
      enabled: true,
    });

    registry.clear();
    expect(registry.getStats().totalPlugins).toBe(0);
  });
});
