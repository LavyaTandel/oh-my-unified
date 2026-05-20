import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
export interface AgentUsageReminderConfig {
    /** Enable usage reminders (default: true) */
    enabled?: boolean;
    /** Number of primitive-only turns before reminder fires (default: 6) */
    threshold?: number;
    /** Custom reminder message */
    customMessage?: string;
}
/**
 * Creates a hook that monitors tool usage patterns. After N consecutive
 * turns where only primitive tools (read, write, grep, etc.) were used
 * without any delegation or MCP invocations, it injects a reminder that
 * specialist agents are available.
 *
 * This prevents agents from grinding on complex tasks with basic tools
 * when they could delegate to @Oracle, @Explorer, @Librarian, etc.
 */
export declare function createAgentUsageReminderHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: AgentUsageReminderConfig): {
    'tool.after': (input: {
        tool: string;
        error?: string;
    }, output: Record<string, unknown>) => Promise<void>;
    getStats: () => {
        primitiveTurnCount: number;
        totalTurns: number;
        threshold: number;
    };
    resetCounter: () => void;
};
//# sourceMappingURL=agent-usage-reminder.d.ts.map