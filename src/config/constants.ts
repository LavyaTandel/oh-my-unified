// Agent name constants
export const ORCHESTRATOR_NAME = 'orchestrator' as const;
export const SUBAGENT_NAMES = [
  'explorer',
  'librarian',
  'oracle',
  'designer',
  'fixer',
  'observer',
  'council',
  'councillor',
] as const;

export const ALL_AGENT_NAMES = [ORCHESTRATOR_NAME, ...SUBAGENT_NAMES] as const;

// Agent aliases for backward compatibility
export const AGENT_ALIASES: Record<string, string> = {
  explore: 'explorer',
  'frontend-ui-ux-engineer': 'designer',
};

// Which agents each agent type can spawn via delegation
export const ORCHESTRATABLE_AGENTS = [
  'explorer',
  'librarian',
  'oracle',
  'designer',
  'fixer',
  'observer',
  'council',
] as const;

export const PROTECTED_AGENTS = new Set(['orchestrator', 'councillor']);

export const SUBAGENT_DELEGATION_RULES: Record<string, readonly string[]> = {
  orchestrator: ORCHESTRATABLE_AGENTS,
  fixer: [],
  designer: [],
  explorer: [],
  librarian: [],
  oracle: [],
  observer: [],
  council: [],
  councillor: [],
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
  oracle: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    skills: ['simplify'],
    mcps: [],
  },
  council: {
    model: 'opencode/nemotron-3-super-free',
    variant: 'max',
    skills: [],
    mcps: [],
  },
  librarian: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    skills: [],
    mcps: ['websearch', 'context7', 'grep_app'],
  },
  explorer: {
    model: 'opencode/big-pickle',
    skills: [],
    mcps: [],
  },
  designer: {
    model: 'opencode/minimax-m2.5-free',
    variant: 'medium',
    skills: ['agent-browser'],
    mcps: [],
  },
  fixer: {
    model: 'opencode/deepseek-v4-flash-free',
    variant: 'max',
    skills: [],
    mcps: [],
  },
  observer: {
    model: 'opencode/minimax-m2.5-free',
    skills: [],
    mcps: [],
  },
};

// Default models (non-loom fallback)
export const DEFAULT_MODELS: Record<string, string | undefined> = {
  orchestrator: undefined,
  oracle: 'openai/gpt-5.5',
  librarian: 'openai/gpt-5.4-mini',
  explorer: 'openai/gpt-5.4-mini',
  designer: 'openai/gpt-5.4-mini',
  fixer: 'openai/gpt-5.4-mini',
  observer: 'openai/gpt-5.4-mini',
  council: 'openai/gpt-5.4-mini',
  councillor: 'openai/gpt-5.4-mini',
};

// Polling configuration
export const POLL_INTERVAL_MS = 500;
export const POLL_INTERVAL_SLOW_MS = 1000;