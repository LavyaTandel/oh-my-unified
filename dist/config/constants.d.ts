export declare const ORCHESTRATOR_NAME: "orchestrator";
export declare const PRIMARY_AGENT_NAMES: readonly ["odin", "njord", "mimir", "vidar", "thor", "forseti", "frigg", "tyr"];
export declare const SUBAGENT_NAMES: readonly ["sif", "eir", "freyr", "hermod", "heimdall", "magni", "hod"];
export declare const ALL_AGENT_NAMES: readonly ["odin", "njord", "mimir", "vidar", "thor", "forseti", "frigg", "tyr", "sif", "eir", "freyr", "hermod", "heimdall", "magni", "hod"];
export declare const AGENT_ALIASES: Record<string, string>;
export declare const PROTECTED_AGENTS: Set<string>;
export declare const SUBAGENT_DELEGATION_RULES: Record<string, readonly string[]>;
export declare const LOOM_MODEL_IDS: readonly ["opencode/nemotron-3-super-free", "opencode/qwen3.6-plus-free", "opencode/deepseek-v4-flash-free", "opencode/minimax-m2.5-free", "opencode/big-pickle"];
export declare const LOOM_PRESET: Record<string, any>;
export declare const DEFAULT_MODELS: Record<string, string | undefined>;
export declare const POLL_INTERVAL_MS = 500;
export declare const POLL_INTERVAL_SLOW_MS = 1000;
//# sourceMappingURL=constants.d.ts.map