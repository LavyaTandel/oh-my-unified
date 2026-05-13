import type { Plugin } from '@opencode-ai/plugin';
import { createAgents, getAgentConfigs, getDisabledAgents } from './agents';
import { buildOrchestratorPrompt } from './agents/orchestrator';
import { loadPluginConfig } from './config';
import { AGENT_ALIASES } from './config/constants';
import { createBuiltinMcps } from './mcp';
import { createWebfetchTool } from './tools/smartfetch/tool';
import { ast_grep_replace, ast_grep_search } from './tools/ast-grep';
import { createCouncilTool } from './tools/council';
import { createPresetManager } from './tools/preset-manager';
import { createOmPlanHook } from './hooks/om-plan';
import { createOmAuditHook } from './hooks/om-audit';
import {
  createSynthesizedHooks,
  type SynthesizedHooksConfig,
} from './hooks/synthesized-hooks';
import {
  createSubtaskCommandManager,
  createSubtaskState,
  createSubtaskTool,
  createReadSessionTool,
} from './tools/subtask';
import { recordTuiAgentModel, recordTuiAgentModels } from './tui-state';
import { createDisplayNameMentionRewriter } from './utils/index';
import { initLogger, log } from './utils/logger';
import { collapseSystemInPlace } from './utils/system-collapse';

async function appLog(
  ctx: Parameters<Plugin>[0],
  level: 'error' | 'warn' | 'info',
  message: string,
): Promise<void> {
  try {
    await ctx.client.app.log({
      body: { service: 'oh-my-unified', level, message },
    });
  } catch {
    const prefix = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : 'INFO';
    console.error(`[oh-my-unified] ${prefix}: ${message}`);
  }
}

const HEALTH_CHECK = {
  minAgents: 5,
  minTools: 5,
  minMcps: 1,
} as const;

async function probeJSDOM(): Promise<string | null> {
  try {
    const { JSDOM } = await import('jsdom');
    new JSDOM('<!DOCTYPE html><html><body>test</body></html>');
    return null;
  } catch (err) {
    return String(err);
  }
}

const OhMyUnified: Plugin = async (ctx) => {
  const sessionId = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  initLogger(sessionId);

  let config: ReturnType<typeof loadPluginConfig>;
  let disabledAgents: Set<string>;
  let agentDefs: ReturnType<typeof createAgents>;
  let agents: ReturnType<typeof getAgentConfigs>;
  let mcps: ReturnType<typeof createBuiltinMcps>;
  let modelArrayMap: Record<string, Array<{ id: string; variant?: string }>>;
  let runtimeChains: Record<string, string[]>;
  let multiplexerConfig: any;
  let multiplexerEnabled: boolean;
  let councilTools: Record<string, unknown>;
  let webfetch: ReturnType<typeof createWebfetchTool>;
  let rewriteDisplayNameMentions: ReturnType<typeof createDisplayNameMentionRewriter>;
  let subtaskCommandManager: ReturnType<typeof createSubtaskCommandManager>;
  let subtaskState: ReturnType<typeof createSubtaskState>;
  let omPlanHook: ReturnType<typeof createOmPlanHook>;
  let omAuditHook: ReturnType<typeof createOmAuditHook>;
  let synthesizedHooks: ReturnType<typeof createSynthesizedHooks>;
  let toolCount = 0;

  try {
    config = loadPluginConfig(ctx.directory);

    disabledAgents = getDisabledAgents(config);
    rewriteDisplayNameMentions = createDisplayNameMentionRewriter(config);
    agentDefs = createAgents(config);
    agents = getAgentConfigs(config);

    // Build model array map for runtime fallback
    modelArrayMap = {};
    for (const agentDef of agentDefs) {
      if (agentDef._modelArray && agentDef._modelArray.length > 0) {
        modelArrayMap[agentDef.name] = agentDef._modelArray;
      }
    }

    // Build runtime fallback chains
    runtimeChains = {};
    for (const agentDef of agentDefs) {
      if (agentDef._modelArray?.length) {
        runtimeChains[agentDef.name] = agentDef._modelArray.map((m) => m.id);
      }
    }

    if (config.fallback?.enabled !== false) {
      const chains = (config.fallback?.chains as Record<string, string[] | undefined>) ?? {};
      for (const [agentName, chainModels] of Object.entries(chains)) {
        if (!chainModels?.length) continue;
        const existing = runtimeChains[agentName] ?? [];
        const seen = new Set(existing);
        for (const m of chainModels) {
          if (!seen.has(m)) {
            seen.add(m);
            existing.push(m);
          }
        }
        runtimeChains[agentName] = existing;
      }
    }

    // Multiplexer config
    multiplexerConfig = {
      type: config.multiplexer?.type ?? 'none',
      layout: config.multiplexer?.layout ?? 'main-vertical',
      main_pane_size: config.multiplexer?.main_pane_size ?? 60,
    };
    multiplexerEnabled = multiplexerConfig.type !== 'none';

    log('[plugin] initialized', {
      multiplexerConfig,
      enabled: multiplexerEnabled,
      directory: ctx.directory,
    });

    // Council tools
    councilTools = config.council?.enabled
      ? createCouncilTool(ctx, config, [])
      : {};

    // Built-in MCPs
    mcps = createBuiltinMcps(config.disabled_mcps, config.websearch);

    // Webfetch tool
    webfetch = createWebfetchTool(ctx);

// Subtask state
    subtaskState = createSubtaskState();
    subtaskCommandManager = createSubtaskCommandManager(ctx, subtaskState);

    // Slash command hooks
    omPlanHook = createOmPlanHook(ctx, config);
    omAuditHook = createOmAuditHook(ctx, config);

    // Synthesized hooks — combine best patterns from openagent + slim
    // These are NOT copied from either plugin. They provide: context window
    // monitoring, file write guards, overwrite protection, task reminders,
    // model routing, error recovery, webfetch redirect protection, diff
    // enhancement, empty response detection, comment checking, and fsync
    // warnings. Each hook is independently configurable.
    synthesizedHooks = createSynthesizedHooks(ctx, config, {
      // Enable by default; individual configs can override
      contextWindowMonitor: { enabled: true },
      fileWriteGuard: { enabled: true },
      overwriteProtection: { enabled: true },
      taskReminder: { enabled: true, threshold: 8 },
      modelSelection: { enabled: true },
      errorRecovery: { enabled: true },
      webFetchGuard: { enabled: true },
      diffEnhancer: { enabled: true },
      emptyResponseDetector: { enabled: true },
      commentChecker: { enabled: false },  // disabled by default (needs external CLI)
      fsyncWarning: { enabled: true },
    });

    // Tool count for health check
    toolCount =
      Object.keys(councilTools).length +
      1 + // webfetch
      2 + // ast_grep_search, ast_grep_replace
      2; // subtask, read_session
  } catch (err) {
    log('[plugin] FATAL: init failed', { error: String(err) });
    await appLog(ctx, 'error', `INIT FAILED: ${String(err)}`);
    throw err;
  }

  // Health check
  const agentCount = Object.keys(agents).length;
  const mcpCount = Object.keys(mcps).length;
  const mcpThreshold =
    config.disabled_mcps && config.disabled_mcps.length > 0
      ? 0
      : HEALTH_CHECK.minMcps;

  if (agentCount < HEALTH_CHECK.minAgents || toolCount < HEALTH_CHECK.minTools || mcpCount < mcpThreshold) {
    const msg = [
      'Health check: registrations suspiciously low.',
      `  agents: ${agentCount} (expected >=${HEALTH_CHECK.minAgents})`,
      `  tools:  ${toolCount} (expected >=${HEALTH_CHECK.minTools})`,
      `  mcps:   ${mcpCount} (expected >=${mcpThreshold})`,
    ].join('\n');
    log(`[plugin] WARN: ${msg}`);
    await appLog(ctx, 'warn', msg);
  } else {
    log('[plugin] health check passed', { agents: agentCount, tools: toolCount, mcps: mcpCount });
  }

  // Probe jsdom
  probeJSDOM().then((err) => {
    if (err) {
      const msg = `jsdom probe failed; webfetch tool will not work: ${err}`;
      log(`[plugin] WARN: ${msg}`);
      appLog(ctx, 'warn', msg).catch(() => {});
    }
  });

return {
    name: 'oh-my-unified',

    // Spread synthesized hooks so their lifecycle handlers are registered
    ...synthesizedHooks,

    agent: agents,

    tool: {
      ...councilTools,
      webfetch: webfetch as any,
      ast_grep_search: ast_grep_search as any,
      ast_grep_replace: ast_grep_replace as any,
      subtask: (createSubtaskTool(ctx, subtaskState, {} as any) as any).func as any,
      read_session: (createReadSessionTool(ctx.client, subtaskState) as any).func as any,
    },

    mcp: mcps,

    config: async (_opencodeConfig: Record<string, unknown>): Promise<void> => {
      // Default agent is set via plugin registration
    },

    'command.execute.before': async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      await omPlanHook.handleCommandExecuteBefore(input, output);
      await omAuditHook.handleCommandExecuteBefore(input, output);
    },
  };
};

export default OhMyUnified;