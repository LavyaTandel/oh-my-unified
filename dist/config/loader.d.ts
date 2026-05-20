import type { AgentOverrideConfig, PluginConfig } from './schema';
export type ConfigLoadWarningKind = 'invalid-json' | 'invalid-schema' | 'read-error' | 'missing-preset';
export interface ConfigLoadWarning {
    path: string;
    kind: ConfigLoadWarningKind;
    message: string;
    formatted?: unknown;
}
export interface LoadPluginConfigOptions {
    onWarning?: (warning: ConfigLoadWarning) => void;
    silent?: boolean;
}
export declare function findPluginConfigPaths(directory: string): {
    userConfigPath: string | null;
    projectConfigPath: string | null;
};
export declare function deepMerge<T extends Record<string, unknown>>(base?: T, override?: T): T | undefined;
export declare function getAgentOverride(config: PluginConfig | undefined, name: string): AgentOverrideConfig | undefined;
export declare function getCustomAgentNames(config: PluginConfig | undefined): string[];
export declare function loadPluginConfig(directory: string, options?: LoadPluginConfigOptions): PluginConfig;
//# sourceMappingURL=loader.d.ts.map