import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin/tool';
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
import { PersistentTaskEngine } from './background/persistent-task-engine';
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
  let catalog: McpSkillCatalog;

  // Phase A wiring: feature module instances
  let systemObserver: SystemObserver;
  let taskEngine: PersistentTaskEngine;
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
    catalog = new McpSkillCatalog();
    const enricher = new AgentContextEnricher(catalog);

    // Discover and merge user's MCPs with defaults
    const discovered = discoverUserMcps();
    const mergedMcpServers = mergeMcpConfigs(discovered, DEFAULT_MCP_SERVERS);

    // Built-in MCPs — now uses correct SDK local MCP format internally
    mcps = createBuiltinMcps(config.disabled_mcps, mergedMcpServers);

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

    // ── Phase A: Wire feature modules ──────────────────────────────────

    // System Observer — start health monitoring with reactive TUI updates
    systemObserver = new SystemObserver({
      events: {
        onReport: (report) => {
          // Update TUI health reactively whenever a new report is generated
          updateHealth({
            agentCount: Object.keys(agents).length,
            toolCount,
            mcpCount: Object.keys(mcps).length,
            status: report.overall === 'healthy' ? 'healthy' : report.overall === 'degraded' ? 'warning' : 'critical',
          })
        },
      },
    });
    systemObserver.setConnectedMcps(Object.keys(mcps).length);
    systemObserver.start();

    // Background Task Engine — Persistent sub-agent sessions
    taskEngine = new PersistentTaskEngine({
      dbPath: config.persistence?.dbPath ?? ':memory:',
    });

    // Pipeline command handler for /plan, /assess, /assemble, /improvise, /act, /synthesize, /health, /status
    pipelineCommandHandler = createPipelineCommandHandler(ctx, config, systemObserver);

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
      taskEngine,
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
    // Spread unified hooks — delegation layer maps standard OpenCode hook names
    // to our internal sub-hooks (event, tool.execute.before, tool.execute.after,
    // chat.params, etc.)
    ...unifiedHooks,

    // Override chat.message — add auto-slash-command detection on top of unified hooks
    'chat.message': async (
      input: { sessionID: string; agent?: string; model?: { providerID: string; modelID: string }; messageID?: string },
      output: { message: unknown; parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      // Run auto-slash-command first — detects /command and replaces with template
      await autoSlashCommandHook['chat.message'](input, output);

      // Then run unified hooks (agent selector, learning, etc.)
      await (unifiedHooks as any)['chat.message']?.(input, output);
    },

    // Override command.execute.before — add early return guard for foreign commands
    'command.execute.before': async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      const cmd = input.command.toLowerCase();

      // EARLY RETURN: Only handle OUR commands — never touch foreign commands
      const OUR_COMMAND_SET = new Set([
        'plan', 'assess', 'assemble', 'improvise', 'act',
        'synthesize', 'health', 'status', 'diagnose',
        'capabilities', 'onboarding', 'log', 'agents',
        'om-plan', 'om-audit',
      ]);
      if (!OUR_COMMAND_SET.has(cmd)) return;

      // Auto-slash-command fallback — handle our commands when OpenCode processes them natively
      await autoSlashCommandHook['command.execute.before'](input, output);

      // om-plan and om-audit — only handle their specific commands
      await omPlanHook.handleCommandExecuteBefore(input, output);
      await omAuditHook.handleCommandExecuteBefore(input, output);

      // Pipeline commands — only handle OUR commands
      await pipelineCommandHandler.handleCommand(input, output);

      // Trust & Discovery commands
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
    },

    tool: {
      webfetch: tool({
        description: 'Fetch web content from a URL',
        args: {
          url: tool.schema.string(),
        },
        execute: async (args) => {
          const res = await webfetch(args.url);
          return JSON.stringify(res);
        },
      }),
      ast_grep_search: tool({
        description: 'Search code patterns using AST-aware grep (structural search)',
        args: {
          path: tool.schema.string(),
          pattern: tool.schema.string(),
          filePattern: tool.schema.string().optional(),
          lang: tool.schema.string().optional(),
          useRegexp: tool.schema.boolean().optional(),
        },
        execute: async (args) => {
          const res = await ast_grep_search({
            path: args.path,
            pattern: args.pattern,
            filePattern: args.filePattern,
            lang: args.lang,
            useRegexp: args.useRegexp,
          });
          return JSON.stringify(res);
        },
      }),
      ast_grep_replace: tool({
        description: 'Replace code patterns using AST-aware rewrite (structural replace)',
        args: {
          path: tool.schema.string(),
          pattern: tool.schema.string(),
          rewrite: tool.schema.string(),
          filePattern: tool.schema.string().optional(),
          lang: tool.schema.string().optional(),
          useRegexp: tool.schema.boolean().optional(),
          dryRun: tool.schema.boolean().optional(),
        },
        execute: async (args) => {
          const res = await ast_grep_replace({
            path: args.path,
            pattern: args.pattern,
            rewrite: args.rewrite,
            filePattern: args.filePattern,
            lang: args.lang,
            useRegexp: args.useRegexp,
            dryRun: args.dryRun,
          });
          return JSON.stringify(res);
        },
      }),
      subtask: tool({
        description: 'Create and manage subtasks for complex multi-step operations',
        args: {
          task: tool.schema.string(),
          context: tool.schema.string().optional(),
        },
        execute: async (args) => {
          const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          subtaskState.tasks.set(taskId, { status: 'in_progress' });
          subtaskState.currentTask = taskId;
          return JSON.stringify({ taskId, status: 'started' });
        },
      }),
      read_session: tool({
        description: 'Read current session state including active subtasks',
        args: {
          sessionID: tool.schema.string().optional(),
        },
        execute: async () => {
          const tasks: Array<{ id: string; status: string }> = [];
          for (const [id, info] of subtaskState.tasks) {
            tasks.push({ id, status: info.status });
          }
          return JSON.stringify({ tasks });
        },
      }),
    },

    config: async (opencodeConfig: Record<string, unknown>): Promise<void> => {
      // ── 1. Inject agents ─────────────────────────────────────────────────
      const agentConfigs = getAgentConfigs(config, catalog);
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agentConfigs };
      } else {
        const existing = opencodeConfig.agent as Record<string, unknown>;
        for (const [name, pluginAgent] of Object.entries(agentConfigs)) {
          const existingAgent = existing[name];
          if (existingAgent) {
            existing[name] = { ...(pluginAgent as object), ...existingAgent };
          } else {
            existing[name] = pluginAgent;
          }
        }
      }
      if (!(opencodeConfig as any).default_agent) {
        (opencodeConfig as any).default_agent = 'odin';
      }

      // ── 2. Inject MCP servers ────────────────────────────────────────────
      if (!opencodeConfig.mcp) {
        opencodeConfig.mcp = { ...mcps };
      } else {
        const existingMcps = opencodeConfig.mcp as Record<string, unknown>;
        for (const [name, mcpConfig] of Object.entries(mcps)) {
          // Only add if not already configured by the user
          if (!existingMcps[name]) {
            existingMcps[name] = mcpConfig;
          }
        }
      }

      // ── 3. Inject slash commands ─────────────────────────────────────────
      const pluginCommands: Record<string, { template: string; description?: string }> = {
        plan:         { template: 'Run the full pipeline: assess → assemble → improvise → act. Topic: $input', description: 'Run full agentic pipeline' },
        assess:       { template: 'Phase 1: Conduct requirements assessment. Identify gaps, contradictions, and missing context.', description: 'Phase 1: Requirements assessment' },
        assemble:     { template: 'Phase 2: Deep research and architecture. Map dependencies, study documentation, deliberate on tradeoffs.', description: 'Phase 2: Research & architecture' },
        improvise:    { template: 'Phase 3: Critique and refine. Perform adversarial review, check quality, refine approach.', description: 'Phase 3: Adversarial review' },
        act:          { template: 'Phase 4: Execute the plan. Build, fix, and design with confidence ≥9.', description: 'Phase 4: Execute' },
        synthesize:   { template: 'Synthesize all agent results into a single report.', description: 'Synthesize agent results' },
        health:       { template: 'Run system health check. Report overall status, component health, warnings, and errors.', description: 'System health check' },
        status:       { template: 'Show pipeline status: conductor, phase, confidence, kanban tasks, and sub-sessions.', description: 'Pipeline status' },
        diagnose:     { template: 'Run 12 parallel system health checks.', description: 'Full diagnostics' },
        capabilities: { template: 'List all plugin capabilities grouped by category.', description: 'List capabilities' },
        onboarding:   { template: 'Show interactive welcome menu with contextual guidance.', description: 'Onboarding guide' },
        log:          { template: 'Query the transparency log. $input', description: 'Transparency log' },
        agents:       { template: 'List all active agents with their models, roles, and status.', description: 'List agents' },
        'om-plan':    { template: 'Run the oh-my-unified plan mode. $input', description: 'OM Plan mode' },
        'om-audit':   { template: 'Run the oh-my-unified audit mode. $input', description: 'OM Audit mode' },
      };

      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      const existingCmds = opencodeConfig.command as Record<string, unknown>;
      for (const [name, cmdDef] of Object.entries(pluginCommands)) {
        if (!existingCmds[name]) {
          existingCmds[name] = cmdDef;
        }
      }
    },
  };
};

export default OhMyUnified;