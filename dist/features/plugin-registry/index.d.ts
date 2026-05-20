export type HookName = 'event' | 'tool.execute.before' | 'tool.execute.after' | 'chat.message' | 'chat.params' | 'chat.headers' | 'permission.ask' | 'command.execute.before' | 'shell.env' | 'tool.definition';
export interface PluginHook {
    name: HookName;
    handler: (input: unknown, output: unknown) => Promise<void> | void;
    priority?: number;
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
export declare class PluginRegistry {
    private plugins;
    private hookIndex;
    register(registration: Omit<PluginRegistration, 'registeredAt'>): void;
    unregister(pluginId: string): boolean;
    enable(pluginId: string): boolean;
    disable(pluginId: string): boolean;
    getHooks(hookName: HookName): PluginHook[];
    getPlugin(pluginId: string): PluginRegistration | undefined;
    getAllPlugins(): PluginRegistration[];
    getStats(): PluginRegistryStats;
    executeHooks(hookName: HookName, input: unknown, output: unknown): Promise<void>;
    clear(): void;
}
export declare function createPluginRegistry(): PluginRegistry;
//# sourceMappingURL=index.d.ts.map