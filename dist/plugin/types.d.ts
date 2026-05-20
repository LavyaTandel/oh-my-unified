import type { Plugin, ToolDefinition } from '@opencode-ai/plugin';
export type PluginContext = Parameters<Plugin>[0];
export type PluginInstance = Awaited<ReturnType<Plugin>>;
export interface ToolsRecord {
    [key: string]: ToolDefinition;
}
export interface TmuxConfig {
    enabled: boolean;
    layout: 'main-horizontal' | 'main-vertical' | 'tiled' | 'even-horizontal' | 'even-vertical';
    main_pane_size: number;
    main_pane_min_width: number;
    agent_pane_min_width: number;
    isolation: 'inline' | 'window' | 'session';
}
//# sourceMappingURL=types.d.ts.map