import { log } from '../../utils/logger';

export type HookName =
  | 'event'
  | 'tool.execute.before'
  | 'tool.execute.after'
  | 'chat.message'
  | 'chat.params'
  | 'chat.headers'
  | 'permission.ask'
  | 'command.execute.before'
  | 'shell.env'
  | 'tool.definition';

export interface PluginHook {
  name: HookName;
  handler: (input: unknown, output: unknown) => Promise<void> | void;
  priority?: number; // Lower = higher priority (default: 100)
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface PluginRegistration {
  metadata: PluginMetadata;
  hooks: PluginHook[];
  enabled: boolean;
  registeredAt: number;
}

export interface PluginRegistryStats {
  totalPlugins: number;
  enabledPlugins: number;
  totalHooks: number;
  byHookType: Record<string, number>;
}

export class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map();
  private hookIndex: Map<HookName, PluginHook[]> = new Map();

  register(registration: Omit<PluginRegistration, 'registeredAt'>): void {
    const existing = this.plugins.get(registration.metadata.id);
    if (existing) {
      log('[plugin-registry] updating plugin', { id: registration.metadata.id });
      this.unregister(registration.metadata.id);
    }

    const fullRegistration: PluginRegistration = {
      ...registration,
      registeredAt: Date.now(),
    };

    this.plugins.set(registration.metadata.id, fullRegistration);

    // Index hooks by name
    for (const hook of registration.hooks) {
      const hookList = this.hookIndex.get(hook.name) ?? [];
      hookList.push(hook);
      hookList.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
      this.hookIndex.set(hook.name, hookList);
    }

    log('[plugin-registry] registered', {
      id: registration.metadata.id,
      hooks: registration.hooks.length,
    });
  }

  unregister(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) return false;

    // Remove hooks from index
    for (const hook of registration.hooks) {
      const hookList = this.hookIndex.get(hook.name);
      if (hookList) {
        const filtered = hookList.filter(h => h !== hook);
        if (filtered.length === 0) {
          this.hookIndex.delete(hook.name);
        } else {
          this.hookIndex.set(hook.name, filtered);
        }
      }
    }

    this.plugins.delete(pluginId);
    log('[plugin-registry] unregistered', { id: pluginId });
    return true;
  }

  enable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) return false;
    registration.enabled = true;
    return true;
  }

  disable(pluginId: string): boolean {
    const registration = this.plugins.get(pluginId);
    if (!registration) return false;
    registration.enabled = false;
    return true;
  }

  getHooks(hookName: HookName): PluginHook[] {
    const hooks = this.hookIndex.get(hookName) ?? [];
    return hooks.filter(h => {
      const plugin = this.plugins.get(h.name.split('.')[0]); // Simplified lookup
      return plugin?.enabled !== false;
    });
  }

  getPlugin(pluginId: string): PluginRegistration | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  getStats(): PluginRegistryStats {
    const allPlugins = this.getAllPlugins();
    const enabledPlugins = allPlugins.filter(p => p.enabled);
    const totalHooks = allPlugins.reduce((sum, p) => sum + p.hooks.length, 0);

    const byHookType: Record<string, number> = {};
    for (const plugin of allPlugins) {
      for (const hook of plugin.hooks) {
        byHookType[hook.name] = (byHookType[hook.name] ?? 0) + 1;
      }
    }

    return {
      totalPlugins: allPlugins.length,
      enabledPlugins: enabledPlugins.length,
      totalHooks,
      byHookType,
    };
  }

  async executeHooks(hookName: HookName, input: unknown, output: unknown): Promise<void> {
    const hooks = this.getHooks(hookName);
    for (const hook of hooks) {
      try {
        await hook.handler(input, output);
      } catch (err) {
        log('[plugin-registry] hook error', {
          hook: hookName,
          error: String(err),
        });
      }
    }
  }

  clear(): void {
    this.plugins.clear();
    this.hookIndex.clear();
  }
}

export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}
