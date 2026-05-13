import { z } from 'zod';
import { AGENT_ALIASES, ALL_AGENT_NAMES } from './constants';

// Agent override configuration schema
export const AgentOverrideConfigSchema = z
  .object({
    model: z
      .union([
        z.string(),
        z
          .array(
            z.union([
              z.string(),
              z.object({
                id: z.string(),
                variant: z.string().optional(),
              }),
            ]),
          )
          .min(1),
      ])
      .optional(),
    temperature: z.number().min(0).max(2).optional(),
    variant: z.string().optional().catch(undefined),
    skills: z.array(z.string()).optional(),
    mcps: z.array(z.string()).optional(),
    prompt: z.string().min(1).optional(),
    orchestratorPrompt: z.string().min(1).optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    displayName: z.string().min(1).optional(),
  })
  .strict();

export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;

// Multiplexer type options
export const MultiplexerTypeSchema = z.enum(['auto', 'tmux', 'zellij', 'none']);
export type MultiplexerType = z.infer<typeof MultiplexerTypeSchema>;

export const MultiplexerLayoutSchema = z.enum([
  'main-horizontal',
  'main-vertical',
  'tiled',
  'even-horizontal',
  'even-vertical',
]);
export type MultiplexerLayout = z.infer<typeof MultiplexerLayoutSchema>;

export const MultiplexerConfigSchema = z.object({
  type: MultiplexerTypeSchema.default('none'),
  layout: MultiplexerLayoutSchema.default('main-vertical'),
  main_pane_size: z.number().min(20).max(80).default(60),
});
export type MultiplexerConfig = z.infer<typeof MultiplexerConfigSchema>;

// Preset schema
export const PresetSchema = z.record(z.string(), AgentOverrideConfigSchema);
export type Preset = z.infer<typeof PresetSchema>;

// Websearch config
export const WebsearchConfigSchema = z.object({
  provider: z.enum(['exa', 'tavily']).default('exa'),
});
export type WebsearchConfig = z.infer<typeof WebsearchConfigSchema>;

// MCP names
export const McpNameSchema = z.enum(['websearch', 'context7', 'grep_app']);
export type McpName = z.infer<typeof McpNameSchema>;

// Interview config
export const InterviewConfigSchema = z.object({
  maxQuestions: z.number().int().min(1).max(10).default(2),
  outputFolder: z.string().min(1).default('interview'),
  autoOpenBrowser: z.boolean().default(true),
  port: z.number().int().min(0).max(65535).default(0),
  dashboard: z.boolean().default(false),
});
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;

// Session manager config
export const SessionManagerConfigSchema = z.object({
  maxSessionsPerAgent: z.number().int().min(1).max(10).default(2),
  readContextMinLines: z.number().int().min(0).max(1000).default(10),
  readContextMaxFiles: z.number().int().min(0).max(50).default(8),
});
export type SessionManagerConfig = z.infer<typeof SessionManagerConfigSchema>;

// Todo continuation config
export const TodoContinuationConfigSchema = z.object({
  maxContinuations: z.number().int().min(1).max(50).default(5),
  cooldownMs: z.number().int().min(0).max(30000).default(3000),
  autoEnable: z.boolean().default(false),
  autoEnableThreshold: z.number().int().min(1).max(20).default(4),
});
export type TodoContinuationConfig = z.infer<typeof TodoContinuationConfigSchema>;

// Fallback config
export const FallbackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  chains: z.record(z.string(), z.array(z.string()).min(1).optional()).optional(),
});
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

// Council config
export const CouncilConfigSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: z.enum(['first', 'majority', 'supermajority']).default('majority'),
  minParticipants: z.number().int().min(2).max(8).default(3),
});
export type CouncilConfig = z.infer<typeof CouncilConfigSchema>;

// Divoom config
export const DivoomConfigSchema = z.object({
  enabled: z.boolean().default(false),
  python: z.string().min(1).default('/usr/bin/python3'),
  script: z.string().min(1).default(''),
  size: z.number().int().min(1).max(1024).default(128),
  fps: z.number().int().min(1).max(60).default(8),
  speed: z.number().int().min(1).max(10000).default(125),
  maxFrames: z.number().int().min(1).max(500).default(24),
  posterizeBits: z.number().int().min(1).max(8).default(3),
  gifs: z.record(z.string(), z.string().min(1)).optional(),
});
export type DivoomConfig = z.infer<typeof DivoomConfigSchema>;

// Main plugin config schema
export const PluginConfigSchema = z
  .object({
    $schema: z.string().optional(),
    preset: z.string().optional(),
    presets: z.record(z.string(), AgentOverrideConfigSchema).optional(),
    agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),
    disabled_agents: z.array(z.string()).optional(),
    disabled_mcps: z.array(McpNameSchema).optional(),
    disabled_skills: z.array(z.string()).optional(),
    disabled_hooks: z.array(z.string()).optional(),
    multiplexer: MultiplexerConfigSchema.optional(),
    tmux: z
      .object({
        enabled: z.boolean().default(false),
        layout: MultiplexerLayoutSchema.default('main-vertical'),
        main_pane_size: z.number().min(20).max(80).default(60),
      })
      .optional(),
    fallback: FallbackConfigSchema.optional(),
    council: CouncilConfigSchema.optional(),
    interview: InterviewConfigSchema.optional(),
    sessionManager: SessionManagerConfigSchema.optional(),
    todoContinuation: TodoContinuationConfigSchema.optional(),
    divoom: DivoomConfigSchema.optional(),
    websearch: WebsearchConfigSchema.optional(),
    autoUpdate: z.boolean().default(true),
    mcp_env_allowlist: z.array(z.string()).optional(),
    hashline_edit: z.boolean().optional(),
    new_task_system_enabled: z.boolean().optional(),
    default_run_agent: z.string().optional(),
    agent_order: z.array(z.string().max(128)).max(64).optional(),
    agent_definitions: z
      .object({
        local: z.array(z.string()).optional(),
        remote: z.array(z.string()).optional(),
      })
      .optional(),
    experimental: z
      .object({
        safe_hook_creation: z.boolean().default(true),
        autocontinue: z.boolean().optional(),
      })
      .optional(),

    // ---- Unified Plugin Sections ----

    persistence: z
      .object({
        dbPath: z.string().default(':memory:'),
        taskRetentionDays: z.number().int().min(1).max(365).default(30),
      })
      .optional(),

    mcpBus: z
      .object({
        enabled: z.boolean().default(true),
        healthCheckIntervalMs: z.number().int().min(1000).max(300000).default(30000),
      })
      .optional(),

    workflow: z
      .object({
        defaultPhase: z.enum(['assess', 'assemble', 'act', 'improvise']).default('assess'),
        autoImprovise: z.boolean().default(true),
      })
      .optional(),

    background: z
      .object({
        maxConcurrentTasks: z.number().int().min(1).max(50).default(5),
        defaultTimeoutMs: z.number().int().min(1000).max(3600000).default(120000),
      })
      .optional(),

    openclaw: z
      .object({
        enabled: z.boolean().default(false),
        discordToken: z.string().optional(),
        telegramToken: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type PluginConfig = z.infer<typeof PluginConfigSchema>;