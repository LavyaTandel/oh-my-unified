// Agent name constants
export const ORCHESTRATOR_NAME = 'orchestrator' as const;
export const PRIMARY_AGENT_NAMES = [
  'odin',
  'njord',
  'mimir',
  'vidar',
  'thor',
  'forseti',
  'frigg',
  'tyr',
] as const;

export const SUBAGENT_NAMES = [
  'sif',
  'eir',
  'freyr',
  'hermod',
  'heimdall',
  'magni',
  'hod',
] as const;

export const ALL_AGENT_NAMES = [...PRIMARY_AGENT_NAMES, ...SUBAGENT_NAMES] as const;

// Agent aliases for backward compatibility
export const AGENT_ALIASES: Record<string, string> = {
  explore: 'sif',
  'frontend-ui-ux-engineer': 'freyr',
};

// Which agents each agent type can spawn via delegation
export const PROTECTED_AGENTS = new Set(['odin', 'njord', 'hod']);

export const SUBAGENT_DELEGATION_RULES: Record<string, readonly string[]> = {
  odin: ['mimir', 'eir', 'sif', 'frigg'],
  njord: ['mimir', 'eir', 'sif', 'freyr', 'hermod', 'heimdall', 'thor', 'vidar'],
  mimir: [],
  vidar: ['sif'],
  thor: [],
  forseti: ['hod'],
  frigg: ['mimir', 'eir'],
  tyr: [],
  sif: [],
  eir: [],
  freyr: ['sif'],
  hermod: [],
  heimdall: [],
  magni: [],
  hod: [],
};

// Loom 5-model routing: explicit model→role mapping
export const LOOM_MODEL_IDS = [
  'opencode/nemotron-3-super-free',
  'opencode/qwen3.6-plus-free',
  'opencode/deepseek-v4-flash-free',
  'opencode/minimax-m2.5-free',
  'opencode/big-pickle',
] as const;

export const LOOM_PRESET: Record<string, any> = {
  odin: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    fallback_models: ['opencode/qwen3.6-plus-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['*'],
    mcps: ['*', '!context7'],
  },
  njord: {
    model: 'opencode/qwen3.6-plus-free',
    variant: 'max',
    fallback_models: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['*'],
    mcps: ['*'],
  },
  mimir: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    fallback_models: ['opencode/qwen3.6-plus-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['simplify'],
    mcps: [],
  },
  vidar: {
    model: 'opencode/qwen3.6-plus-free',
    variant: 'max',
    fallback_models: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['codemap'],
    mcps: [],
  },
  thor: {
    model: 'opencode/deepseek-v4-flash-free',
    variant: 'max',
    fallback_models: ['opencode/big-pickle', 'opencode/nemotron-3-super-free'],
    skills: ['*'],
    mcps: ['*'],
  },
  forseti: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    fallback_models: ['opencode/qwen3.6-plus-free', 'opencode/deepseek-v4-flash-free'],
    skills: [],
    mcps: [],
  },
  frigg: {
    model: 'opencode/qwen3.6-plus-free',
    variant: 'max',
    fallback_models: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['gap-analysis', 'risk-assessment'],
    mcps: [],
  },
  tyr: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    fallback_models: ['opencode/qwen3.6-plus-free', 'opencode/deepseek-v4-flash-free'],
    skills: ['plan-review', 'quality-gate'],
    mcps: [],
  },
  eir: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    fallback_models: ['opencode/deepseek-v4-flash-free', 'opencode/big-pickle'],
    skills: [],
    mcps: ['websearch', 'context7', 'grep_app'],
  },
  sif: {
    model: 'opencode/big-pickle',
    fallback_models: ['opencode/deepseek-v4-flash-free', 'opencode/minimax-m2.5-free'],
    skills: [],
    mcps: [],
  },
  freyr: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    fallback_models: ['opencode/deepseek-v4-flash-free', 'opencode/big-pickle'],
    skills: ['agent-browser'],
    mcps: [],
  },
  hermod: {
    model: 'opencode/deepseek-v4-flash-free',
    variant: 'max',
    fallback_models: ['opencode/big-pickle', 'opencode/nemotron-3-super-free'],
    skills: [],
    mcps: [],
  },
  heimdall: {
    model: 'opencode/minimax-m2.5-free',
    fallback_models: ['opencode/deepseek-v4-flash-free', 'opencode/big-pickle'],
    skills: [],
    mcps: [],
  },
  magni: {
    model: 'opencode/deepseek-v4-flash-free',
    fallback_models: ['opencode/big-pickle', 'opencode/minimax-m2.5-free'],
    skills: [],
    mcps: [],
  },
  hod: {
    model: 'opencode/minimax-m2.5-free',
    fallback_models: ['opencode/deepseek-v4-flash-free', 'opencode/big-pickle'],
    skills: [],
    mcps: [],
  },
};

// Default models (non-loom fallback)
export const DEFAULT_MODELS: Record<string, string | undefined> = {
  odin: 'opencode/nemotron-3-super-free',
  njord: 'opencode/qwen3.6-plus-free',
  mimir: 'opencode/nemotron-3-super-free',
  vidar: 'opencode/qwen3.6-plus-free',
  thor: 'opencode/deepseek-v4-flash-free',
  forseti: 'opencode/nemotron-3-super-free',
  frigg: 'opencode/qwen3.6-plus-free',
  tyr: 'opencode/nemotron-3-super-free',
  sif: 'opencode/big-pickle',
  eir: 'opencode/minimax-m2.5-free',
  freyr: 'opencode/minimax-m2.5-free',
  hermod: 'opencode/deepseek-v4-flash-free',
  heimdall: 'opencode/minimax-m2.5-free',
  magni: 'opencode/deepseek-v4-flash-free',
  hod: 'opencode/minimax-m2.5-free',
};

// Polling configuration
export const POLL_INTERVAL_MS = 500;
export const POLL_INTERVAL_SLOW_MS = 1000;
