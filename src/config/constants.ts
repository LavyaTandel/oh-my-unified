// Agent name constants
export const ORCHESTRATOR_NAME = 'orchestrator' as const;
export const SUBAGENT_NAMES = [
  'sif',
  'eir',
  'mimir',
  'freyr',
  'hermod',
  'heimdall',
  'forseti',
  'hod',
] as const;

export const ALL_AGENT_NAMES = [ORCHESTRATOR_NAME, ...SUBAGENT_NAMES] as const;

// Agent aliases for backward compatibility
export const AGENT_ALIASES: Record<string, string> = {
  explore: 'sif',
  'frontend-ui-ux-engineer': 'freyr',
};

// Which agents each agent type can spawn via delegation
export const ORCHESTRATABLE_AGENTS = [
  'sif',
  'eir',
  'mimir',
  'freyr',
  'hermod',
  'heimdall',
  'forseti',
] as const;

export const PROTECTED_AGENTS = new Set(['orchestrator', 'hod']);

export const SUBAGENT_DELEGATION_RULES: Record<string, readonly string[]> = {
  orchestrator: ORCHESTRATABLE_AGENTS,
  hermod: [],
  freyr: [],
  sif: [],
  eir: [],
  mimir: [],
  heimdall: [],
  forseti: [],
  hod: [],
};

// Loom 5-model routing: explicit model→role mapping
export const LOOM_MODEL_IDS = [
  'opencode/ring-2.6-1t-free',
  'opencode/nemotron-3-super-free',
  'opencode/deepseek-v4-flash-free',
  'opencode/minimax-m2.5-free',
  'opencode/big-pickle',
] as const;

export const LOOM_PRESET: Record<string, any> = {
  orchestrator: {
    model: 'opencode/ring-2.6-1t-free',
    variant: 'max',
    skills: ['*'],
    mcps: ['*', '!context7'],
  },
  mimir: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    skills: ['simplify'],
    mcps: [],
  },
  forseti: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    skills: [],
    mcps: [],
  },
  eir: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    skills: [],
    mcps: ['websearch', 'context7', 'grep_app'],
  },
  sif: {
    model: 'opencode/big-pickle',
    skills: [],
    mcps: [],
  },
  freyr: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    skills: ['agent-browser'],
    mcps: [],
  },
  hermod: {
    model: 'opencode/deepseek-v4-flash-free',
    variant: 'max',
    skills: [],
    mcps: [],
  },
  heimdall: {
    model: 'opencode/minimax-m2.5-free',
    skills: [],
    mcps: [],
  },
};

// Default models (non-loom fallback)
export const DEFAULT_MODELS: Record<string, string | undefined> = {
  orchestrator: undefined,
  mimir: 'openai/gpt-5.5',
  eir: 'openai/gpt-5.4-mini',
  sif: 'openai/gpt-5.4-mini',
  freyr: 'openai/gpt-5.4-mini',
  hermod: 'openai/gpt-5.4-mini',
  heimdall: 'openai/gpt-5.4-mini',
  forseti: 'openai/gpt-5.4-mini',
  hod: 'openai/gpt-5.4-mini',
};

// Polling configuration
export const POLL_INTERVAL_MS = 500;
export const POLL_INTERVAL_SLOW_MS = 1000;
