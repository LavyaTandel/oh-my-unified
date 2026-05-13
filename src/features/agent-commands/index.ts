export interface AgentConfig {
  name: string          // functional name (for delegation)
  displayName: string   // @mention name (for TUI + prompts)
  primaryName?: string  // mythological name (for primary agents)
  description: string
  role: string
  model: string         // default model
  fallbackModels: string[]  // fallback chain
  template: string
  isPrimary: boolean    // visible in TUI selector
  canDelegate: boolean
  delegatableAgents?: string[]  // which agents this can spawn
  skills: string[]      // assigned skills
}

// All agents use Norse mythology names for consistent identity.
// Primary agents are TUI-visible with delegation capabilities.
// Sub-agents are focused specialists without delegation.

export const AGENTS: AgentConfig[] = [
  // === PRIMARY AGENTS (Norse mythology — unique identity) ===
  {
    name: 'odin',
    displayName: '@Odin',
    description: 'Chief strategist — interviews, researches, plans. Wields Huginn and Muninn (thought and memory).',
    role: 'Strategist',
    model: 'opencode/ring-2.6-1t-free',
    fallbackModels: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    template: 'Interview the user, research with MCPs/skills, create structured plan',
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ['mimir', 'eir', 'sif', 'frigg'],
    skills: ['interview', 'plan-writing'],
  },
  {
    name: 'njord',
    displayName: '@Njord',
    description: 'Orchestrator — delegates tasks to specialist agents, manages execution flow',
    role: 'Orchestrator',
    model: 'opencode/ring-2.6-1t-free',
    fallbackModels: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    template: 'Orchestrate execution across specialist agents',
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ['mimir', 'eir', 'sif', 'freyr', 'hermod', 'heimdall', 'thor', 'vidar'],
    skills: ['delegation', 'task-management'],
  },
  {
    name: 'mimir',
    displayName: '@Mimir',
    description: 'Strategic advisor — architecture review, complex debugging, hard problems',
    role: 'Advisor',
    model: 'opencode/nemotron-3-super-free',
    fallbackModels: ['opencode/ring-2.6-1t-free', 'opencode/deepseek-v4-flash-free'],
    template: 'Provide deep strategic analysis for this architecture or problem',
    isPrimary: true,
    canDelegate: false,
    skills: ['reasoning', 'code-review', 'simplify'],
  },
  {
    name: 'vidar',
    displayName: '@Vidar',
    description: 'Codebase mapper — explores structure, generates codemaps',
    role: 'Mapper',
    model: 'opencode/ring-2.6-1t-free',
    fallbackModels: ['opencode/nemotron-3-super-free', 'opencode/deepseek-v4-flash-free'],
    template: 'Map the architecture of this codebase and identify patterns',
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ['sif'],
    skills: ['codemap', 'architecture-analysis'],
  },
  {
    name: 'thor',
    displayName: '@Thor',
    description: 'Builder — implements plans with precision and force',
    role: 'Builder',
    model: 'opencode/deepseek-v4-flash-free',
    fallbackModels: ['opencode/big-pickle', 'opencode/nemotron-3-super-free'],
    template: 'Implement the specified changes from the plan',
    isPrimary: true,
    canDelegate: false,
    skills: ['implementation', 'code-generation'],
  },
  {
    name: 'forseti',
    displayName: '@Forseti',
    description: 'Council — multi-LLM deliberation, 5 perspectives synthesized',
    role: 'Deliberator',
    model: 'opencode/nemotron-3-super-free',
    fallbackModels: ['opencode/minimax-m2.5-free'],
    template: 'Deliberate from multiple angles using councillors',
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ['hod'],
    skills: ['consensus', 'multi-perspective'],
  },
  {
    name: 'frigg',
    displayName: '@Frigg',
    description: 'Gap analyst — identifies hidden requirements and risks',
    role: 'Analyst',
    model: 'opencode/nemotron-3-super-free',
    fallbackModels: ['opencode/ring-2.6-1t-free'],
    template: 'Analyze this request/plan for gaps, risks, and missing requirements',
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ['mimir', 'eir'],
    skills: ['gap-analysis', 'risk-assessment'],
  },
  {
    name: 'tyr',
    displayName: '@Tyr',
    description: 'Quality critic — rigorous review against standards',
    role: 'Critic',
    model: 'opencode/nemotron-3-super-free',
    fallbackModels: ['opencode/ring-2.6-1t-free'],
    template: 'Review this plan for completeness and executability',
    isPrimary: true,
    canDelegate: false,
    skills: ['plan-review', 'quality-gate'],
  },
  // === SUB-AGENTS ===
  {
    name: 'sif',
    displayName: '@Sif',
    description: 'Codebase scout — glob, grep, AST queries',
    role: 'Scout',
    model: 'opencode/big-pickle',
    fallbackModels: ['opencode/deepseek-v4-flash-free'],
    template: 'Search the codebase for patterns, files, and symbols',
    isPrimary: false,
    canDelegate: false,
    skills: ['code-search', 'pattern-matching'],
  },
  {
    name: 'eir',
    displayName: '@Eir',
    description: 'Scholar — official docs, API references, best practices',
    role: 'Scholar',
    model: 'opencode/minimax-m2.5-free',
    fallbackModels: ['opencode/deepseek-v4-flash-free'],
    template: 'Find and summarize relevant documentation',
    isPrimary: false,
    canDelegate: false,
    skills: ['documentation', 'research'],
  },
  {
    name: 'freyr',
    displayName: '@Freyr',
    description: 'Artisan — UI/UX design, browser automation',
    role: 'Artisan',
    model: 'opencode/minimax-m2.5-free',
    fallbackModels: ['opencode/deepseek-v4-flash-free'],
    template: 'Design or implement the UI component',
    isPrimary: false,
    canDelegate: true,
    delegatableAgents: ['sif'],
    skills: ['ui-design', 'browser-automation'],
  },
  {
    name: 'hermod',
    displayName: '@Hermod',
    description: 'Runner — focused implementation, no delegation',
    role: 'Runner',
    model: 'opencode/deepseek-v4-flash-free',
    fallbackModels: ['opencode/big-pickle'],
    template: 'Implement this focused fix or change',
    isPrimary: false,
    canDelegate: false,
    skills: ['implementation', 'bug-fixing'],
  },
  {
    name: 'heimdall',
    displayName: '@Heimdall',
    description: 'Watcher — visual analysis, images, screenshots, diagrams',
    role: 'Watcher',
    model: 'opencode/minimax-m2.5-free',
    fallbackModels: ['opencode/deepseek-v4-flash-free'],
    template: 'Analyze this visual content',
    isPrimary: false,
    canDelegate: false,
    skills: ['vision', 'visual-analysis'],
  },
  {
    name: 'magni',
    displayName: '@Magni',
    description: 'Follower — executes focused tasks without delegation',
    role: 'Follower',
    model: 'opencode/deepseek-v4-flash-free',
    fallbackModels: ['opencode/big-pickle'],
    template: 'Execute this focused task',
    isPrimary: false,
    canDelegate: false,
    skills: ['task-execution'],
  },
  {
    name: 'hod',
    displayName: '@Hod',
    description: 'Voter — one perspective in council deliberation',
    role: 'Voter',
    model: 'opencode/minimax-m2.5-free',
    fallbackModels: ['opencode/deepseek-v4-flash-free'],
    template: 'Provide your perspective on this question',
    isPrimary: false,
    canDelegate: false,
    skills: ['reasoning'],
  },
]

export const PRIMARY_AGENTS = AGENTS.filter(a => a.isPrimary)
export const SUB_AGENTS = AGENTS.filter(a => !a.isPrimary)

export function getAgent(nameOrMention: string): AgentConfig | undefined {
  const key = nameOrMention.replace('@', '').toLowerCase()
  return AGENTS.find(a => a.name === key || a.displayName.replace('@', '').toLowerCase() === key)
}
