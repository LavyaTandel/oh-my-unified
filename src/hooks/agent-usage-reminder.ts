import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

export interface AgentUsageReminderConfig {
  /** Enable usage reminders (default: true) */
  enabled?: boolean;
  /** Number of primitive-only turns before reminder fires (default: 6) */
  threshold?: number;
  /** Custom reminder message */
  customMessage?: string;
}

const DEFAULT_MESSAGE =
  'Tip: You can use specialist agents for complex tasks — ' +
  '@Oracle for deep analysis, @Explorer for codebase discovery, ' +
  '@Librarian for documentation search, @Designer for UI work, ' +
  'and @Fixer for targeted fixes. Use `@<agent>` to delegate.';

const PRIMITIVE_TOOL_PATTERNS = [
  'read',
  'write',
  'edit',
  'grep',
  'glob',
  'bash',
  'search',
  'list',
];

/**
 * Creates a hook that monitors tool usage patterns. After N consecutive
 * turns where only primitive tools (read, write, grep, etc.) were used
 * without any delegation or MCP invocations, it injects a reminder that
 * specialist agents are available.
 *
 * This prevents agents from grinding on complex tasks with basic tools
 * when they could delegate to @Oracle, @Explorer, @Librarian, etc.
 */
export function createAgentUsageReminderHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: AgentUsageReminderConfig,
) {
  const cfg: Required<AgentUsageReminderConfig> = {
    enabled: true,
    threshold: 6,
    customMessage: DEFAULT_MESSAGE,
    ...hookConfig,
  };

  let primitiveTurnCount = 0;
  let lastReminderTurn = 0;
  let totalTurns = 0;

  /**
   * Checks whether a tool name is considered "primitive" (no delegation
   * or MCP involved).
   */
  function isPrimitiveTool(tool: string): boolean {
    const lower = tool.toLowerCase();
    return PRIMITIVE_TOOL_PATTERNS.some(
      (pattern) => lower.includes(pattern) || lower === pattern,
    );
  }

  /**
   * Checks whether a tool name indicates delegation or MCP usage.
   */
  function isDelegationTool(tool: string): boolean {
    const lower = tool.toLowerCase();
    return (
      lower.startsWith('@') ||
      lower.includes('delegate') ||
      lower.includes('subagent') ||
      lower.includes('mcp') ||
      lower === 'call_omo_agent' ||
      lower === 'background_output'
    );
  }

  /**
   * Resets the primitive turn counter (called when delegation is detected).
   */
  function resetCounter(): void {
    primitiveTurnCount = 0;
  }

  /**
   * Hook that fires after any tool call. Tracks whether the tool was
   * primitive and injects a reminder when the threshold is exceeded.
   */
  async function handleToolAfter(
    input: { tool: string; error?: string },
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    totalTurns++;

    if (isDelegationTool(input.tool)) {
      // Delegation detected — reset the counter
      resetCounter();
      return;
    }

    if (isPrimitiveTool(input.tool)) {
      primitiveTurnCount++;
    } else {
      // Non-primitive tool used (e.g. a custom tool) — still counts
      // as "not grinding with primitives" so reset
      resetCounter();
      return;
    }

    if (primitiveTurnCount >= cfg.threshold && totalTurns !== lastReminderTurn) {
      log(
        `[agent-usage-reminder] ${primitiveTurnCount} consecutive primitive-only turns — ` +
        `injecting agent reminder`,
      );
      (output as Record<string, unknown>).agentUsageReminder = cfg.customMessage;
      lastReminderTurn = totalTurns;
      primitiveTurnCount = 0; // Reset to avoid spamming
    }
  }

  return {
    'oh-my-unified.tool.after': handleToolAfter,
    getStats: () => ({
      primitiveTurnCount,
      totalTurns,
      threshold: cfg.threshold,
    }),
    resetCounter,
  };
}
