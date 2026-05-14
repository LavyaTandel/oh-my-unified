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
import { updateAgentModel, setActiveAgent } from './tui';
import { AGENTS, PRIMARY_AGENTS } from './features/agent-commands';
import { lazyLoader } from './features/lazy-loader';
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

  // Register all agents with the TUI on startup
  // This makes them visible and selectable in the desktop sidebar
  // Using the same pattern as oh-my-openagent's agent-sort-shim
  for (const agent of PRIMARY_AGENTS) {
    updateAgentModel(agent.name, agent.model, agent.displayName)
    // Register in lazy loader
    lazyLoader.register(agent.name, 'agent', agent.displayName, agent.description)
  }
  setActiveAgent('odin')

  // Also register sub-agents in lazy loader (they're not in TUI but available for delegation)
  for (const agent of AGENTS.filter(a => !a.isPrimary)) {
    lazyLoader.register(agent.name, 'agent', agent.displayName, agent.description)
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

    tools: {
      webfetch: {
        name: 'webfetch',
        description: 'Fetch web content from a URL',
        input: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
        func: webfetch,
      },
      ast_grep_search: {
        name: 'ast_grep_search',
        description: 'Search code with AST patterns',
        input: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] },
        func: ast_grep_search,
      },
      ast_grep_replace: {
        name: 'ast_grep_replace',
        description: 'Replace code with AST patterns',
        input: { type: 'object', properties: { pattern: { type: 'string' }, rewrite: { type: 'string' } }, required: ['pattern', 'rewrite'] },
        func: ast_grep_replace,
      },
      subtask: {
        name: 'subtask',
        description: 'Create a subtask for parallel execution',
        input: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] },
        func: (createSubtaskTool(ctx, subtaskState, {} as any) as any).func,
      },
      read_session: {
        name: 'read_session',
        description: 'Read session data for a given session',
        input: { type: 'object', properties: { sessionID: { type: 'string' } }, required: ['sessionID'] },
        func: (createReadSessionTool(ctx.client, subtaskState) as any).func,
      },
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