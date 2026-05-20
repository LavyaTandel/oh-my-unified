import { z } from 'zod';
export declare const AgentOverrideConfigSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        id: z.ZodString;
        variant: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        variant?: string | undefined;
    }, {
        id: string;
        variant?: string | undefined;
    }>]>, "many">]>>;
    fallback_models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    temperature: z.ZodOptional<z.ZodNumber>;
    variant: z.ZodCatch<z.ZodOptional<z.ZodString>>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mcps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    prompt: z.ZodOptional<z.ZodString>;
    orchestratorPrompt: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    displayName: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    options?: Record<string, unknown> | undefined;
    variant?: string | undefined;
    model?: string | (string | {
        id: string;
        variant?: string | undefined;
    })[] | undefined;
    fallback_models?: string[] | undefined;
    temperature?: number | undefined;
    skills?: string[] | undefined;
    mcps?: string[] | undefined;
    prompt?: string | undefined;
    orchestratorPrompt?: string | undefined;
    displayName?: string | undefined;
}, {
    options?: Record<string, unknown> | undefined;
    variant?: unknown;
    model?: string | (string | {
        id: string;
        variant?: string | undefined;
    })[] | undefined;
    fallback_models?: string[] | undefined;
    temperature?: number | undefined;
    skills?: string[] | undefined;
    mcps?: string[] | undefined;
    prompt?: string | undefined;
    orchestratorPrompt?: string | undefined;
    displayName?: string | undefined;
}>;
export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;
export declare const MultiplexerTypeSchema: z.ZodEnum<["auto", "tmux", "zellij", "none"]>;
export type MultiplexerType = z.infer<typeof MultiplexerTypeSchema>;
export declare const MultiplexerLayoutSchema: z.ZodEnum<["main-horizontal", "main-vertical", "tiled", "even-horizontal", "even-vertical"]>;
export type MultiplexerLayout = z.infer<typeof MultiplexerLayoutSchema>;
export declare const MultiplexerConfigSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["auto", "tmux", "zellij", "none"]>>;
    layout: z.ZodDefault<z.ZodEnum<["main-horizontal", "main-vertical", "tiled", "even-horizontal", "even-vertical"]>>;
    main_pane_size: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "auto" | "tmux" | "zellij" | "none";
    layout: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical";
    main_pane_size: number;
}, {
    type?: "auto" | "tmux" | "zellij" | "none" | undefined;
    layout?: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical" | undefined;
    main_pane_size?: number | undefined;
}>;
export type MultiplexerConfig = z.infer<typeof MultiplexerConfigSchema>;
export declare const PresetSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    model: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        id: z.ZodString;
        variant: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        variant?: string | undefined;
    }, {
        id: string;
        variant?: string | undefined;
    }>]>, "many">]>>;
    fallback_models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    temperature: z.ZodOptional<z.ZodNumber>;
    variant: z.ZodCatch<z.ZodOptional<z.ZodString>>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mcps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    prompt: z.ZodOptional<z.ZodString>;
    orchestratorPrompt: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    displayName: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    options?: Record<string, unknown> | undefined;
    variant?: string | undefined;
    model?: string | (string | {
        id: string;
        variant?: string | undefined;
    })[] | undefined;
    fallback_models?: string[] | undefined;
    temperature?: number | undefined;
    skills?: string[] | undefined;
    mcps?: string[] | undefined;
    prompt?: string | undefined;
    orchestratorPrompt?: string | undefined;
    displayName?: string | undefined;
}, {
    options?: Record<string, unknown> | undefined;
    variant?: unknown;
    model?: string | (string | {
        id: string;
        variant?: string | undefined;
    })[] | undefined;
    fallback_models?: string[] | undefined;
    temperature?: number | undefined;
    skills?: string[] | undefined;
    mcps?: string[] | undefined;
    prompt?: string | undefined;
    orchestratorPrompt?: string | undefined;
    displayName?: string | undefined;
}>>;
export type Preset = z.infer<typeof PresetSchema>;
export declare const WebsearchConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodEnum<["exa", "tavily"]>>;
}, "strip", z.ZodTypeAny, {
    provider: "exa" | "tavily";
}, {
    provider?: "exa" | "tavily" | undefined;
}>;
export type WebsearchConfig = z.infer<typeof WebsearchConfigSchema>;
export declare const McpNameSchema: z.ZodEnum<["websearch", "context7", "grep_app", "clawdi", "gbrain", "context-mode", "code-review-graph", "gitnexus", "loom-mcp", "openspace", "exa", "gh_grep", "deepwiki", "sequential-thinking", "agent-browser"]>;
export type McpName = z.infer<typeof McpNameSchema>;
export declare const InterviewConfigSchema: z.ZodObject<{
    maxQuestions: z.ZodDefault<z.ZodNumber>;
    outputFolder: z.ZodDefault<z.ZodString>;
    autoOpenBrowser: z.ZodDefault<z.ZodBoolean>;
    port: z.ZodDefault<z.ZodNumber>;
    dashboard: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    maxQuestions: number;
    outputFolder: string;
    autoOpenBrowser: boolean;
    port: number;
    dashboard: boolean;
}, {
    maxQuestions?: number | undefined;
    outputFolder?: string | undefined;
    autoOpenBrowser?: boolean | undefined;
    port?: number | undefined;
    dashboard?: boolean | undefined;
}>;
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;
export declare const SessionManagerConfigSchema: z.ZodObject<{
    maxSessionsPerAgent: z.ZodDefault<z.ZodNumber>;
    readContextMinLines: z.ZodDefault<z.ZodNumber>;
    readContextMaxFiles: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxSessionsPerAgent: number;
    readContextMinLines: number;
    readContextMaxFiles: number;
}, {
    maxSessionsPerAgent?: number | undefined;
    readContextMinLines?: number | undefined;
    readContextMaxFiles?: number | undefined;
}>;
export type SessionManagerConfig = z.infer<typeof SessionManagerConfigSchema>;
export declare const TodoContinuationConfigSchema: z.ZodObject<{
    maxContinuations: z.ZodDefault<z.ZodNumber>;
    cooldownMs: z.ZodDefault<z.ZodNumber>;
    autoEnable: z.ZodDefault<z.ZodBoolean>;
    autoEnableThreshold: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxContinuations: number;
    cooldownMs: number;
    autoEnable: boolean;
    autoEnableThreshold: number;
}, {
    maxContinuations?: number | undefined;
    cooldownMs?: number | undefined;
    autoEnable?: boolean | undefined;
    autoEnableThreshold?: number | undefined;
}>;
export type TodoContinuationConfig = z.infer<typeof TodoContinuationConfigSchema>;
export declare const FallbackConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    chains: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    chains?: Record<string, string[] | undefined> | undefined;
}, {
    enabled?: boolean | undefined;
    chains?: Record<string, string[] | undefined> | undefined;
}>;
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;
export declare const CouncilConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    strategy: z.ZodDefault<z.ZodEnum<["first", "majority", "supermajority"]>>;
    minParticipants: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    strategy: "first" | "majority" | "supermajority";
    minParticipants: number;
}, {
    enabled?: boolean | undefined;
    strategy?: "first" | "majority" | "supermajority" | undefined;
    minParticipants?: number | undefined;
}>;
export type CouncilConfig = z.infer<typeof CouncilConfigSchema>;
export declare const DivoomConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    python: z.ZodDefault<z.ZodString>;
    script: z.ZodDefault<z.ZodString>;
    size: z.ZodDefault<z.ZodNumber>;
    fps: z.ZodDefault<z.ZodNumber>;
    speed: z.ZodDefault<z.ZodNumber>;
    maxFrames: z.ZodDefault<z.ZodNumber>;
    posterizeBits: z.ZodDefault<z.ZodNumber>;
    gifs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    python: string;
    script: string;
    size: number;
    fps: number;
    speed: number;
    maxFrames: number;
    posterizeBits: number;
    gifs?: Record<string, string> | undefined;
}, {
    enabled?: boolean | undefined;
    python?: string | undefined;
    script?: string | undefined;
    size?: number | undefined;
    fps?: number | undefined;
    speed?: number | undefined;
    maxFrames?: number | undefined;
    posterizeBits?: number | undefined;
    gifs?: Record<string, string> | undefined;
}>;
export type DivoomConfig = z.infer<typeof DivoomConfigSchema>;
export declare const PluginConfigSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    preset: z.ZodOptional<z.ZodString>;
    presets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        model: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
            variant: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            variant?: string | undefined;
        }, {
            id: string;
            variant?: string | undefined;
        }>]>, "many">]>>;
        fallback_models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        temperature: z.ZodOptional<z.ZodNumber>;
        variant: z.ZodCatch<z.ZodOptional<z.ZodString>>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        mcps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        prompt: z.ZodOptional<z.ZodString>;
        orchestratorPrompt: z.ZodOptional<z.ZodString>;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        displayName: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        options?: Record<string, unknown> | undefined;
        variant?: string | undefined;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }, {
        options?: Record<string, unknown> | undefined;
        variant?: unknown;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }>>>;
    agents: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        model: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
            variant: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            variant?: string | undefined;
        }, {
            id: string;
            variant?: string | undefined;
        }>]>, "many">]>>;
        fallback_models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        temperature: z.ZodOptional<z.ZodNumber>;
        variant: z.ZodCatch<z.ZodOptional<z.ZodString>>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        mcps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        prompt: z.ZodOptional<z.ZodString>;
        orchestratorPrompt: z.ZodOptional<z.ZodString>;
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        displayName: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        options?: Record<string, unknown> | undefined;
        variant?: string | undefined;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }, {
        options?: Record<string, unknown> | undefined;
        variant?: unknown;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }>>>;
    disabled_agents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    disabled_mcps: z.ZodOptional<z.ZodArray<z.ZodEnum<["websearch", "context7", "grep_app", "clawdi", "gbrain", "context-mode", "code-review-graph", "gitnexus", "loom-mcp", "openspace", "exa", "gh_grep", "deepwiki", "sequential-thinking", "agent-browser"]>, "many">>;
    disabled_skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    disabled_hooks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    multiplexer: z.ZodOptional<z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<["auto", "tmux", "zellij", "none"]>>;
        layout: z.ZodDefault<z.ZodEnum<["main-horizontal", "main-vertical", "tiled", "even-horizontal", "even-vertical"]>>;
        main_pane_size: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "auto" | "tmux" | "zellij" | "none";
        layout: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical";
        main_pane_size: number;
    }, {
        type?: "auto" | "tmux" | "zellij" | "none" | undefined;
        layout?: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical" | undefined;
        main_pane_size?: number | undefined;
    }>>;
    tmux: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        layout: z.ZodDefault<z.ZodEnum<["main-horizontal", "main-vertical", "tiled", "even-horizontal", "even-vertical"]>>;
        main_pane_size: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        layout: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical";
        main_pane_size: number;
        enabled: boolean;
    }, {
        layout?: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical" | undefined;
        main_pane_size?: number | undefined;
        enabled?: boolean | undefined;
    }>>;
    fallback: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        chains: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        chains?: Record<string, string[] | undefined> | undefined;
    }, {
        enabled?: boolean | undefined;
        chains?: Record<string, string[] | undefined> | undefined;
    }>>;
    council: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        strategy: z.ZodDefault<z.ZodEnum<["first", "majority", "supermajority"]>>;
        minParticipants: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        strategy: "first" | "majority" | "supermajority";
        minParticipants: number;
    }, {
        enabled?: boolean | undefined;
        strategy?: "first" | "majority" | "supermajority" | undefined;
        minParticipants?: number | undefined;
    }>>;
    interview: z.ZodOptional<z.ZodObject<{
        maxQuestions: z.ZodDefault<z.ZodNumber>;
        outputFolder: z.ZodDefault<z.ZodString>;
        autoOpenBrowser: z.ZodDefault<z.ZodBoolean>;
        port: z.ZodDefault<z.ZodNumber>;
        dashboard: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxQuestions: number;
        outputFolder: string;
        autoOpenBrowser: boolean;
        port: number;
        dashboard: boolean;
    }, {
        maxQuestions?: number | undefined;
        outputFolder?: string | undefined;
        autoOpenBrowser?: boolean | undefined;
        port?: number | undefined;
        dashboard?: boolean | undefined;
    }>>;
    sessionManager: z.ZodOptional<z.ZodObject<{
        maxSessionsPerAgent: z.ZodDefault<z.ZodNumber>;
        readContextMinLines: z.ZodDefault<z.ZodNumber>;
        readContextMaxFiles: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxSessionsPerAgent: number;
        readContextMinLines: number;
        readContextMaxFiles: number;
    }, {
        maxSessionsPerAgent?: number | undefined;
        readContextMinLines?: number | undefined;
        readContextMaxFiles?: number | undefined;
    }>>;
    todoContinuation: z.ZodOptional<z.ZodObject<{
        maxContinuations: z.ZodDefault<z.ZodNumber>;
        cooldownMs: z.ZodDefault<z.ZodNumber>;
        autoEnable: z.ZodDefault<z.ZodBoolean>;
        autoEnableThreshold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxContinuations: number;
        cooldownMs: number;
        autoEnable: boolean;
        autoEnableThreshold: number;
    }, {
        maxContinuations?: number | undefined;
        cooldownMs?: number | undefined;
        autoEnable?: boolean | undefined;
        autoEnableThreshold?: number | undefined;
    }>>;
    divoom: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        python: z.ZodDefault<z.ZodString>;
        script: z.ZodDefault<z.ZodString>;
        size: z.ZodDefault<z.ZodNumber>;
        fps: z.ZodDefault<z.ZodNumber>;
        speed: z.ZodDefault<z.ZodNumber>;
        maxFrames: z.ZodDefault<z.ZodNumber>;
        posterizeBits: z.ZodDefault<z.ZodNumber>;
        gifs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        python: string;
        script: string;
        size: number;
        fps: number;
        speed: number;
        maxFrames: number;
        posterizeBits: number;
        gifs?: Record<string, string> | undefined;
    }, {
        enabled?: boolean | undefined;
        python?: string | undefined;
        script?: string | undefined;
        size?: number | undefined;
        fps?: number | undefined;
        speed?: number | undefined;
        maxFrames?: number | undefined;
        posterizeBits?: number | undefined;
        gifs?: Record<string, string> | undefined;
    }>>;
    websearch: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["exa", "tavily"]>>;
    }, "strip", z.ZodTypeAny, {
        provider: "exa" | "tavily";
    }, {
        provider?: "exa" | "tavily" | undefined;
    }>>;
    autoUpdate: z.ZodDefault<z.ZodBoolean>;
    mcp_env_allowlist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    hashline_edit: z.ZodOptional<z.ZodBoolean>;
    new_task_system_enabled: z.ZodOptional<z.ZodBoolean>;
    default_run_agent: z.ZodOptional<z.ZodString>;
    agent_order: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    agent_definitions: z.ZodOptional<z.ZodObject<{
        local: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        remote: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        local?: string[] | undefined;
        remote?: string[] | undefined;
    }, {
        local?: string[] | undefined;
        remote?: string[] | undefined;
    }>>;
    experimental: z.ZodOptional<z.ZodObject<{
        safe_hook_creation: z.ZodDefault<z.ZodBoolean>;
        autocontinue: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        safe_hook_creation: boolean;
        autocontinue?: boolean | undefined;
    }, {
        safe_hook_creation?: boolean | undefined;
        autocontinue?: boolean | undefined;
    }>>;
    persistence: z.ZodOptional<z.ZodObject<{
        dbPath: z.ZodDefault<z.ZodString>;
        taskRetentionDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dbPath: string;
        taskRetentionDays: number;
    }, {
        dbPath?: string | undefined;
        taskRetentionDays?: number | undefined;
    }>>;
    mcpBus: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        healthCheckIntervalMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        healthCheckIntervalMs: number;
    }, {
        enabled?: boolean | undefined;
        healthCheckIntervalMs?: number | undefined;
    }>>;
    workflow: z.ZodOptional<z.ZodObject<{
        defaultPhase: z.ZodDefault<z.ZodEnum<["assess", "assemble", "act", "improvise"]>>;
        autoImprovise: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        defaultPhase: "assess" | "assemble" | "act" | "improvise";
        autoImprovise: boolean;
    }, {
        defaultPhase?: "assess" | "assemble" | "act" | "improvise" | undefined;
        autoImprovise?: boolean | undefined;
    }>>;
    background: z.ZodOptional<z.ZodObject<{
        maxConcurrentTasks: z.ZodDefault<z.ZodNumber>;
        defaultTimeoutMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxConcurrentTasks: number;
        defaultTimeoutMs: number;
    }, {
        maxConcurrentTasks?: number | undefined;
        defaultTimeoutMs?: number | undefined;
    }>>;
    openclaw: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        discordToken: z.ZodOptional<z.ZodString>;
        telegramToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        discordToken?: string | undefined;
        telegramToken?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        discordToken?: string | undefined;
        telegramToken?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    autoUpdate: boolean;
    websearch?: {
        provider: "exa" | "tavily";
    } | undefined;
    tmux?: {
        layout: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical";
        main_pane_size: number;
        enabled: boolean;
    } | undefined;
    interview?: {
        maxQuestions: number;
        outputFolder: string;
        autoOpenBrowser: boolean;
        port: number;
        dashboard: boolean;
    } | undefined;
    $schema?: string | undefined;
    preset?: string | undefined;
    presets?: Record<string, {
        options?: Record<string, unknown> | undefined;
        variant?: string | undefined;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }> | undefined;
    agents?: Record<string, {
        options?: Record<string, unknown> | undefined;
        variant?: string | undefined;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }> | undefined;
    disabled_agents?: string[] | undefined;
    disabled_mcps?: ("websearch" | "context7" | "grep_app" | "agent-browser" | "exa" | "clawdi" | "gbrain" | "context-mode" | "code-review-graph" | "gitnexus" | "loom-mcp" | "openspace" | "gh_grep" | "deepwiki" | "sequential-thinking")[] | undefined;
    disabled_skills?: string[] | undefined;
    disabled_hooks?: string[] | undefined;
    multiplexer?: {
        type: "auto" | "tmux" | "zellij" | "none";
        layout: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical";
        main_pane_size: number;
    } | undefined;
    fallback?: {
        enabled: boolean;
        chains?: Record<string, string[] | undefined> | undefined;
    } | undefined;
    council?: {
        enabled: boolean;
        strategy: "first" | "majority" | "supermajority";
        minParticipants: number;
    } | undefined;
    sessionManager?: {
        maxSessionsPerAgent: number;
        readContextMinLines: number;
        readContextMaxFiles: number;
    } | undefined;
    todoContinuation?: {
        maxContinuations: number;
        cooldownMs: number;
        autoEnable: boolean;
        autoEnableThreshold: number;
    } | undefined;
    divoom?: {
        enabled: boolean;
        python: string;
        script: string;
        size: number;
        fps: number;
        speed: number;
        maxFrames: number;
        posterizeBits: number;
        gifs?: Record<string, string> | undefined;
    } | undefined;
    mcp_env_allowlist?: string[] | undefined;
    hashline_edit?: boolean | undefined;
    new_task_system_enabled?: boolean | undefined;
    default_run_agent?: string | undefined;
    agent_order?: string[] | undefined;
    agent_definitions?: {
        local?: string[] | undefined;
        remote?: string[] | undefined;
    } | undefined;
    experimental?: {
        safe_hook_creation: boolean;
        autocontinue?: boolean | undefined;
    } | undefined;
    persistence?: {
        dbPath: string;
        taskRetentionDays: number;
    } | undefined;
    mcpBus?: {
        enabled: boolean;
        healthCheckIntervalMs: number;
    } | undefined;
    workflow?: {
        defaultPhase: "assess" | "assemble" | "act" | "improvise";
        autoImprovise: boolean;
    } | undefined;
    background?: {
        maxConcurrentTasks: number;
        defaultTimeoutMs: number;
    } | undefined;
    openclaw?: {
        enabled: boolean;
        discordToken?: string | undefined;
        telegramToken?: string | undefined;
    } | undefined;
}, {
    websearch?: {
        provider?: "exa" | "tavily" | undefined;
    } | undefined;
    tmux?: {
        layout?: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical" | undefined;
        main_pane_size?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    interview?: {
        maxQuestions?: number | undefined;
        outputFolder?: string | undefined;
        autoOpenBrowser?: boolean | undefined;
        port?: number | undefined;
        dashboard?: boolean | undefined;
    } | undefined;
    $schema?: string | undefined;
    preset?: string | undefined;
    presets?: Record<string, {
        options?: Record<string, unknown> | undefined;
        variant?: unknown;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }> | undefined;
    agents?: Record<string, {
        options?: Record<string, unknown> | undefined;
        variant?: unknown;
        model?: string | (string | {
            id: string;
            variant?: string | undefined;
        })[] | undefined;
        fallback_models?: string[] | undefined;
        temperature?: number | undefined;
        skills?: string[] | undefined;
        mcps?: string[] | undefined;
        prompt?: string | undefined;
        orchestratorPrompt?: string | undefined;
        displayName?: string | undefined;
    }> | undefined;
    disabled_agents?: string[] | undefined;
    disabled_mcps?: ("websearch" | "context7" | "grep_app" | "agent-browser" | "exa" | "clawdi" | "gbrain" | "context-mode" | "code-review-graph" | "gitnexus" | "loom-mcp" | "openspace" | "gh_grep" | "deepwiki" | "sequential-thinking")[] | undefined;
    disabled_skills?: string[] | undefined;
    disabled_hooks?: string[] | undefined;
    multiplexer?: {
        type?: "auto" | "tmux" | "zellij" | "none" | undefined;
        layout?: "main-horizontal" | "main-vertical" | "tiled" | "even-horizontal" | "even-vertical" | undefined;
        main_pane_size?: number | undefined;
    } | undefined;
    fallback?: {
        enabled?: boolean | undefined;
        chains?: Record<string, string[] | undefined> | undefined;
    } | undefined;
    council?: {
        enabled?: boolean | undefined;
        strategy?: "first" | "majority" | "supermajority" | undefined;
        minParticipants?: number | undefined;
    } | undefined;
    sessionManager?: {
        maxSessionsPerAgent?: number | undefined;
        readContextMinLines?: number | undefined;
        readContextMaxFiles?: number | undefined;
    } | undefined;
    todoContinuation?: {
        maxContinuations?: number | undefined;
        cooldownMs?: number | undefined;
        autoEnable?: boolean | undefined;
        autoEnableThreshold?: number | undefined;
    } | undefined;
    divoom?: {
        enabled?: boolean | undefined;
        python?: string | undefined;
        script?: string | undefined;
        size?: number | undefined;
        fps?: number | undefined;
        speed?: number | undefined;
        maxFrames?: number | undefined;
        posterizeBits?: number | undefined;
        gifs?: Record<string, string> | undefined;
    } | undefined;
    autoUpdate?: boolean | undefined;
    mcp_env_allowlist?: string[] | undefined;
    hashline_edit?: boolean | undefined;
    new_task_system_enabled?: boolean | undefined;
    default_run_agent?: string | undefined;
    agent_order?: string[] | undefined;
    agent_definitions?: {
        local?: string[] | undefined;
        remote?: string[] | undefined;
    } | undefined;
    experimental?: {
        safe_hook_creation?: boolean | undefined;
        autocontinue?: boolean | undefined;
    } | undefined;
    persistence?: {
        dbPath?: string | undefined;
        taskRetentionDays?: number | undefined;
    } | undefined;
    mcpBus?: {
        enabled?: boolean | undefined;
        healthCheckIntervalMs?: number | undefined;
    } | undefined;
    workflow?: {
        defaultPhase?: "assess" | "assemble" | "act" | "improvise" | undefined;
        autoImprovise?: boolean | undefined;
    } | undefined;
    background?: {
        maxConcurrentTasks?: number | undefined;
        defaultTimeoutMs?: number | undefined;
    } | undefined;
    openclaw?: {
        enabled?: boolean | undefined;
        discordToken?: string | undefined;
        telegramToken?: string | undefined;
    } | undefined;
}>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
//# sourceMappingURL=schema.d.ts.map