import { log } from '../../utils/logger';
export class PluginRegistry {
    plugins = new Map();
    hookIndex = new Map();
    register(registration) {
        const existing = this.plugins.get(registration.metadata.id);
        if (existing) {
            log('[plugin-registry] updating plugin', { id: registration.metadata.id });
            this.unregister(registration.metadata.id);
        }
        const fullRegistration = {
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
    unregister(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration)
            return false;
        // Remove hooks from index
        for (const hook of registration.hooks) {
            const hookList = this.hookIndex.get(hook.name);
            if (hookList) {
                const filtered = hookList.filter(h => h !== hook);
                if (filtered.length === 0) {
                    this.hookIndex.delete(hook.name);
                }
                else {
                    this.hookIndex.set(hook.name, filtered);
                }
            }
        }
        this.plugins.delete(pluginId);
        log('[plugin-registry] unregistered', { id: pluginId });
        return true;
    }
    enable(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration)
            return false;
        registration.enabled = true;
        return true;
    }
    disable(pluginId) {
        const registration = this.plugins.get(pluginId);
        if (!registration)
            return false;
        registration.enabled = false;
        return true;
    }
    getHooks(hookName) {
        const hooks = this.hookIndex.get(hookName) ?? [];
        return hooks.filter(h => {
            const plugin = this.plugins.get(h.name.split('.')[0]); // Simplified lookup
            return plugin?.enabled !== false;
        });
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    getStats() {
        const allPlugins = this.getAllPlugins();
        const enabledPlugins = allPlugins.filter(p => p.enabled);
        const totalHooks = allPlugins.reduce((sum, p) => sum + p.hooks.length, 0);
        const byHookType = {};
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
    async executeHooks(hookName, input, output) {
        const hooks = this.getHooks(hookName);
        for (const hook of hooks) {
            try {
                await hook.handler(input, output);
            }
            catch (err) {
                log('[plugin-registry] hook error', {
                    hook: hookName,
                    error: String(err),
                });
            }
        }
    }
    clear() {
        this.plugins.clear();
        this.hookIndex.clear();
    }
}
export function createPluginRegistry() {
    return new PluginRegistry();
}
//# sourceMappingURL=index.js.map