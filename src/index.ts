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
import { writeAgentFiles } from './utils/write-agents';
import { createOmPlanHook } from './features/om-plan';
import { createOmAuditHook } from './features/om-audit';
import { createPipelineCommandHandler } from './features/agent-commands/handler';
import {
  createUnifiedHooks,
  type SynthesizedHooksConfig,
} from './hooks/delegation';
import { createAutoSlashCommandHook } from './hooks/auto-slash-command';
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
import { McpSkillCatalog } from './features/tool-use-enforcer/mcp-skill-catalog';
import { AgentContextEnricher } from './features/tool-use-enforcer/agent-context-enricher';
import { discoverUserMcps, mergeMcpConfigs } from './features/mcp-discovery';
import { DEFAULT_MCP_SERVERS } from './mcp-bus';
import { SystemObserver } from './features/system-observer';
import { createAgentSelector } from './features/agent-selector';
import { InterviewEngine } from './interview/server';
import { startTui, updateHealth, setSessionId } from './tui';
import { SkillMcpManager } from './features/skill-mcp-manager';
import { ModelRouter } from './features/model-router/router';
import { createMetricsCollector } from './features/metrics';
import { createLearningEngine } from './features/learning-engine';
import { createModelPredictor } from './features/model-predictor';
import { createBenchmarkTracker } from './features/benchmark-tracker';
import { createPluginRegistry } from './features/plugin-registry';
import { createSkillCodifier } from './features/skill-codifier';
import { createSessionRouter } from './features/session-router';
import { createIntegrationHub } from './features/integration-hub';
import { createDiagnosticsChecker } from './features/diagnostics';
import { createCapabilitiesExplorer } from './features/capabilities';
import { createOnboardingGuide } from './features/onboarding';
import { createTransparencyLog } from './features/transparency-log';

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
  let pipelineCommandHandler: ReturnType<typeof createPipelineCommandHandler>;
  let autoSlashCommandHook: ReturnType<typeof createAutoSlashCommandHook>;
  let unifiedHooks: ReturnType<typeof createUnifiedHooks>;
  let toolCount = 0;

  // Phase A wiring: feature module instances
  let systemObserver: SystemObserver;
  let agentSelector: ReturnType<typeof createAgentSelector>;
  let interviewEngine: InterviewEngine;
  let skillMCPManager: SkillMcpManager;
  let modelRouter: ModelRouter;
  let metricsCollector: ReturnType<typeof createMetricsCollector>;
  let learningEngine: ReturnType<typeof createLearningEngine>;
  let modelPredictor: ReturnType<typeof createModelPredictor>;
  let benchmarkTracker: ReturnType<typeof createBenchmarkTracker>;
  let pluginRegistry: ReturnType<typeof createPluginRegistry>;
  let skillCodifier: ReturnType<typeof createSkillCodifier>;
  let sessionRouter: ReturnType<typeof createSessionRouter>;
  let integrationHub: ReturnType<typeof createIntegrationHub>;
  let diagnosticsChecker: ReturnType<typeof createDiagnosticsChecker>;
  let capabilitiesExplorer: ReturnType<typeof createCapabilitiesExplorer>;
  let onboardingGuide: ReturnType<typeof createOnboardingGuide>;
  let transparencyLog: ReturnType<typeof createTransparencyLog>;

  try {
    config = loadPluginConfig(ctx.directory);

    disabledAgents = getDisabledAgents(config);
    rewriteDisplayNameMentions = createDisplayNameMentionRewriter(config);

    // Build dynamic MCP/skill catalog from user's actual install
    const catalog = new McpSkillCatalog()
    const enricher = new AgentContextEnricher(catalog)

    // Discover and merge user's MCPs with defaults
    const discoveredMcps = discoverUserMcps()
    const mergedMcpServers = mergeMcpConfigs(discoveredMcps, DEFAULT_MCP_SERVERS)

    // Built-in MCPs — wired with discovered/merged configs
    mcps = createBuiltinMcps(config.disabled_mcps, config.websearch, mergedMcpServers)

    // Enrich agent definitions with discovered skills
    agentDefs = createAgents(config, catalog)

    // Write agent definitions to .opencode/agent/ so OpenCode's config system picks them up
    try {
      const written = writeAgentFiles(agentDefs, ctx.directory);
      log('[plugin] wrote agent files', { count: written.length, agents: written });
    } catch (err) {
      log('[plugin] failed to write agent files', { error: String(err) });
    }

    agents = getAgentConfigs(config, catalog);

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

    // Webfetch tool
    webfetch = createWebfetchTool(ctx);

// Subtask state
    subtaskState = createSubtaskState();
    subtaskCommandManager = createSubtaskCommandManager(ctx, subtaskState);

    // Transparency Log — centralized decision/audit trail (created early for hooks)
    transparencyLog = createTransparencyLog();

    // Slash command hooks
    omPlanHook = createOmPlanHook(ctx, config, { transparencyLog });
    omAuditHook = createOmAuditHook(ctx, config, { transparencyLog });

    // Auto-slash-command hook — detects /command in chat.message, replaces with template
    autoSlashCommandHook = createAutoSlashCommandHook(ctx, config);

    // Pipeline command handler for /plan, /assess, /assemble, /improvise, /act, /synthesize, /health, /status
    pipelineCommandHandler = createPipelineCommandHandler(ctx, config, systemObserver!);

    // ── Phase A: Wire feature modules ──────────────────────────────────

    // System Observer — start health monitoring
    systemObserver = new SystemObserver();
    systemObserver.start();
    systemObserver.setConnectedMcps(Object.keys(mcps).length);

    // Agent Selector — enriched metadata for all agents
    agentSelector = createAgentSelector();
    for (const agentDef of agentDefs) {
      agentSelector.registerAgent({
        name: agentDef.name,
        displayName: agentDef.displayName ?? `@${agentDef.name}`,
        description: '',
        role: '',
        model: agentDef._modelArray?.[0]?.id ?? agentDef.config.model ?? 'openai/gpt-5.4-mini',
        fallbackModels: agentDef._modelArray?.map(m => m.id) ?? [],
        template: '',
        isPrimary: true,
        canDelegate: false,
        skills: [],
      });
    }

    // Interview Dashboard — start HTTP server with SSE
    interviewEngine = new InterviewEngine(3456);
    interviewEngine.start();

    // Skill MCP Manager — Tier 3 skill-embedded MCP loader
    skillMCPManager = new SkillMcpManager();

    // Model Router — intelligent model selection
    modelRouter = new ModelRouter();

    // Metrics Collector — track fallback triggers, model routing, review outcomes, security findings
    metricsCollector = createMetricsCollector(':memory:', { dailyBudget: 10.0 });

    // Learning Engine — cross-session learning for patterns, successes, failures
    learningEngine = createLearningEngine(':memory:');

    // Model Predictor — predictive model selection using historical performance
    modelPredictor = createModelPredictor();

    // Benchmark Tracker — performance regression tracking across model changes
    benchmarkTracker = createBenchmarkTracker(':memory:');

    // Tier 3: Plugin System — third-party feature registration
    pluginRegistry = createPluginRegistry();

    // Tier 3: Auto-Skill Generation — pattern codification
    skillCodifier = createSkillCodifier({ threshold: 5 });

    // Tier 3: Multi-User Collaboration — session routing
    sessionRouter = createSessionRouter();

    // Tier 3: External Integrations — GitHub/Jira/Slack
    integrationHub = createIntegrationHub();

    // Trust & Discovery Features
    diagnosticsChecker = createDiagnosticsChecker({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      tuiRunning: true,
      interviewRunning: true,
      pluginCount: pluginRegistry.getStats().totalPlugins,
      integrationCount: integrationHub.getStats().totalIntegrations,
      circuitBreakerHealth: [
        { name: 'review-work', state: 'closed' },
        { name: 'hyperplan', state: 'closed' },
        { name: 'security-research', state: 'closed' },
        { name: 'model-fallback', state: 'closed' },
        { name: 'proactive-fallback', state: 'closed' },
      ],
    });

    capabilitiesExplorer = createCapabilitiesExplorer({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      pluginCount: pluginRegistry.getStats().totalPlugins,
      integrationCount: integrationHub.getStats().totalIntegrations,
      hasLearningEngine: true,
      hasModelPredictor: true,
      hasBenchmarkTracker: true,
      hasCircuitBreakers: true,
    });

    onboardingGuide = createOnboardingGuide({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      isFirstRun: true,
    });

    // Unified hooks — delegation layer that maps standard OpenCode hook names
    // to our internal sub-hooks. Without this layer, OpenCode ignores our hooks
    // because it only recognizes standard names (event, tool.execute.before,
    // tool.execute.after, chat.message, etc.).
    unifiedHooks = createUnifiedHooks(ctx, config, {
      contextWindowMonitor: { enabled: true },
      fileWriteGuard: { enabled: true },
      overwriteProtection: { enabled: true },
      taskReminder: { enabled: true, threshold: 8 },
      modelSelection: { enabled: true },
      errorRecovery: { enabled: true },
      webFetchGuard: { enabled: true },
      diffEnhancer: { enabled: true },
      emptyResponseDetector: { enabled: true },
      commentChecker: { enabled: false },
      fsyncWarning: { enabled: true },
    }, runtimeChains, {
      agentSelector,
      systemObserver,
      interviewEngine,
      skillMcpManager: skillMCPManager,
      modelRouter,
      metricsCollector,
      learningEngine,
      modelPredictor,
      benchmarkTracker,
      pluginRegistry,
      skillCodifier,
      sessionRouter,
      integrationHub,
      transparencyLog,
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
    updateAgentModel(agent.name, agent.model, agent.displayName, agent.role);
    // Register in lazy loader
    lazyLoader.register(agent.name, 'agent', agent.displayName, agent.description);
    // Register in agent selector
    agentSelector.registerAgent(agent);
  }
  setActiveAgent('odin');
  setSessionId(sessionId);

  // Also register sub-agents in lazy loader (they're not in TUI but available for delegation)
  for (const agent of AGENTS.filter(a => !a.isPrimary)) {
    lazyLoader.register(agent.name, 'agent', agent.displayName, agent.description);
    agentSelector.registerAgent(agent);
  }

  // Update TUI health from SystemObserver
  const healthReport = systemObserver.getStatus();
  updateHealth({
    agentCount: Object.keys(agents).length,
    toolCount,
    mcpCount: Object.keys(mcps).length,
    status: healthReport.overall === 'healthy' ? 'healthy' : healthReport.overall === 'degraded' ? 'warning' : 'critical',
  });

  // TUI disabled — OpenCode provides its own terminal UI.
  // The plugin's Ink TUI conflicts with OpenCode's input handling.
  // startTui();

  // Probe jsdom
  probeJSDOM().then((err) => {
    if (err) {
      const msg = `jsdom probe failed; webfetch tool will not work: ${err}`;
      log(`[plugin] WARN: ${msg}`);
      appLog(ctx, 'warn', msg).catch(() => {});
    }
  }).catch(() => {});

return {
    name: 'oh-my-unified',

    // Spread unified hooks — delegation layer maps standard OpenCode hook names
    // to our internal sub-hooks (event, tool.execute.before, tool.execute.after,
    // chat.message, etc.)
    ...unifiedHooks,

    // Auto-slash-command hook — wire into chat.message and command.execute.before
    // This detects /command in user text and replaces with template
    'chat.message': async (
      input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string }; messageID?: string },
      output: { message: unknown; parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      // Run auto-slash-command first — detects /command and replaces with template
      await autoSlashCommandHook['chat.message'](input, output);

      // Then run unified hooks (agent selector, learning, etc.)
      await (unifiedHooks as any)['chat.message']?.(input, output);
    },

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
      // Auto-slash-command fallback — handle our commands when OpenCode processes them natively
      await autoSlashCommandHook['command.execute.before'](input, output);

      // om-plan and om-audit — only handle their specific commands
      await omPlanHook.handleCommandExecuteBefore(input, output);
      await omAuditHook.handleCommandExecuteBefore(input, output);

      // Pipeline commands — only handle OUR commands
      await pipelineCommandHandler.handleCommand(input, output);

      // Trust & Discovery commands — ONLY handle ours, don't hijack others
      const cmd = input.command.toLowerCase();

      if (cmd === 'diagnose') {
        const report = await diagnosticsChecker.runAll();
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: diagnosticsChecker.formatReport(report),
        });
        return;
      }

      if (cmd === 'capabilities') {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: capabilitiesExplorer.formatCapabilities(),
        });
        return;
      }

      if (cmd === 'onboarding') {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: onboardingGuide.getWelcomeMessage(),
        });
        return;
      }

      if (cmd === 'log') {
        const args = input.arguments.trim().toLowerCase();
        let entries;
        if (args.startsWith('stats')) {
          const stats = transparencyLog.getStats();
          const lines = [
            '📊 Transparency Log Statistics',
            '═'.repeat(40),
            `Total entries: ${stats.totalEntries}`,
            `Sessions: ${Object.keys(stats.bySession).length}`,
            '',
            'By type:',
            ...Object.entries(stats.byType).map(([t, c]) => `  ${t}: ${c}`),
            '',
            'By session:',
            ...Object.entries(stats.bySession).map(([s, c]) => `  ${s.slice(0, 20)}...: ${c}`),
          ];
          output.parts.length = 0;
          output.parts.push({ type: 'text', text: lines.join('\n') });
          return;
        }

        if (args.startsWith('recent')) {
          const limit = parseInt(args.split(' ')[1], 10) || 10;
          entries = transparencyLog.getRecent(limit);
        } else if (args) {
          const type = args as any;
          entries = transparencyLog.getByType(type);
        } else {
          entries = transparencyLog.getRecent(20);
        }

        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: transparencyLog.formatLog(entries),
        });
        return;
      }

      // Don't hijack other plugins' commands — return without modifying output
    },
  };
};

export default OhMyUnified;