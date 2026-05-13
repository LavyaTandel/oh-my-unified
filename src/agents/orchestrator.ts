import type { AgentConfig } from '@opencode-ai/sdk/v2';

export interface AgentDefinition {
  name: string;
  displayName?: string;
  description?: string;
  config: AgentConfig;
  /** Priority-ordered model entries for runtime fallback resolution. */
  _modelArray?: Array<{ id: string; variant?: string }>;
}

/**
 * Resolve agent prompt from base/custom/append inputs.
 * If customPrompt is provided, it replaces the base entirely.
 * Otherwise, customAppendPrompt is appended to the base.
 */
export function resolvePrompt(
  base: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): string {
  if (customPrompt) return customPrompt;
  if (customAppendPrompt) return `${base}\n\n${customAppendPrompt}`;
  return base;
}

// Agent descriptions for the orchestrator prompt
const AGENT_DESCRIPTIONS: Record<string, string> = {
  explorer: `@explorer
- Role: Parallel search specialist for discovering unknowns across the codebase
- Permissions: Read files
- Stats: 2x faster codebase search than orchestrator, 1/2 cost of orchestrator
- Capabilities: Glob, grep, AST queries to locate files, symbols, patterns
- **Delegate when:** Need to discover what exists before planning • Parallel searches speed discovery • Need summarized map vs full contents • Broad/uncertain scope
- **Don't delegate when:** Know the path and need actual content • Need full file anyway • Single specific lookup • About to edit the file`,

  librarian: `@librarian
- Role: Authoritative source for current library docs and API references
- Permissions: External docs/search MCPs; no file edits
- Stats: 10x better finding up-to-date library docs than orchestrator, 1/2 cost of orchestrator
- Capabilities: Fetches latest official docs, examples, API signatures, version-specific behavior via grep_app MCP
- **Delegate when:** Libraries with frequent API changes (React, Next.js, AI SDKs) • Complex APIs needing official examples (ORMs, auth) • Version-specific behavior matters • Unfamiliar library • Edge cases or advanced features • Nuanced best practices
- **Don't delegate when:** Standard usage you're confident • Simple stable APIs • General programming knowledge • Info already in conversation • Built-in language features
- **Rule of thumb:** "How does this library work?" → @librarian. "How does programming work?" → yourself.`,

  oracle: `@oracle
- Role: Strategic advisor for high-stakes decisions and persistent problems, code reviewer
- Permissions: Read files
- Stats: 5x better decision maker, problem solver, investigator than orchestrator, 0.8x speed of orchestrator, same cost.
- Capabilities: Deep architectural reasoning, system-level trade-offs, complex debugging, code review, simplification, maintainability review
- **Delegate when:** Major architectural decisions with long-term impact • Problems persisting after 2+ fix attempts • High-risk multi-system refactors • Costly trade-offs (performance vs maintainability) • Complex debugging with unclear root cause • Security/scalability/data integrity decisions • Genuinely uncertain and cost of wrong choice is high • When a workflow calls for a **reviewer** subagent • Code needs simplification or YAGNI scrutiny
- **Don't delegate when:** Routine decisions you're confident about • First bug fix attempt • Straightforward trade-offs • Tactical "how" vs strategic "should" • Time-sensitive good-enough decisions • Quick research/testing can answer
- **Rule of thumb:** Need senior architect review? → @oracle. Need code review or simplification? → @oracle. Just do it and PR? → yourself.`,

  designer: `@designer
- Role: UI/UX specialist for intentional, polished experiences
- Permissions: Read/write files
- Stats: 10x better UI/UX than orchestrator
- Capabilities: Visual relevant edits, interactions, responsive layouts, design systems with aesthetic intent, deep UI/UX knowledge.
- **Delegate when:** User-facing interfaces needing polish • Responsive layouts • UX-critical components (forms, nav, dashboards) • Visual consistency systems • Animations/micro-interactions • Landing/marketing pages • Refining functional→delightful • Reviewing existing UI/UX quality
- **Don't delegate when:** Backend/logic with no visual • Quick prototypes where design doesn't matter yet
- **Rule of thumb:** Users see it and polish matters? → @designer. Headless/functional? → yourself.`,

  fixer: `@fixer
- Role: Fast execution specialist for well-defined tasks, which empowers orchestrator with parallel, speedy executions
- Permissions: Read/write files
- Stats: 2x faster code edits, 1/2 cost of orchestrator, 0.8x quality of orchestrator
- Tools/Constraints: Execution-focused—no research, no architectural decisions
- **Delegate when:** For implementation work, think and triage first. If the change is non-trivial or multi-file, hand bounded execution to @fixer • Writing or updating tests • Tasks that touch test files, fixtures, mocks, or test helpers. Parallelization benefits: Task involves multiple folders and multiple files modification, scoping work per folder and spawning parallel @fixers for each folder.
- **Don't delegate when:** Needs discovery/research/decisions • Single small change (<20 lines, one file) • Unclear requirements needing iteration • Explaining to fixer > doing • Tight integration with your current work • Sequential dependencies
- **Rule of thumb:** Experts in their domains, faster and cheaper than @orchestrator for execution.`,

  observer: `@observer
- Role: Visual analysis specialist for images, screenshots, PDFs, and diagrams
- Permissions: Read files (image/PDF content extraction)
- Stats: Saves main context tokens — processes raw files, returns only structured observations
- Capabilities: Interprets images, screenshots, PDFs, and diagrams via native read tool; extracts UI elements, layouts, text, relationships
- **Delegate when:** Need to analyze a multimedia file • Extract information from visual content
- **Don't delegate when:** Plain text files that Read can handle directly • Files that need editing afterward
- **Rule of thumb:** Even if your model supports vision, delegate to @observer to isolate large image/PDF bytes from context window.`,

  council: `@council
- Role: Multi-LLM consensus engine that runs several councillors in parallel, compares their answers, resolves disagreements, and produces a structured council report.
- Stats: 3x slower than orchestrator, 3x or more cost of orchestrator
- Capabilities: Runs multiple models in parallel, compares answers, resolves disagreements, produces synthesized final answer with councillor details
- **Delegate when:** Critical decisions need multiple independent perspectives • High-stakes architectural/security/data-integrity choices • Ambiguous problems where disagreement is useful signal • You want confidence beyond a single model
- **Don't delegate when:** Straightforward tasks you're confident about • Speed matters more than confidence • Routine implementation/debugging • A single specialist is clearly the right tool`,
};

/**
 * Build the full orchestrator system prompt with agent descriptions.
 */
export function buildOrchestratorPrompt(
  config: Record<string, any> | undefined,
): string {
  const disabledAgents = config?.disabled_agents ?? [];
  const availableAgents = Object.entries(AGENT_DESCRIPTIONS)
    .filter(([name]) => !disabledAgents.includes(name))
    .map(([name, desc]) => `### ${name}\n${desc}`)
    .join('\n\n');

  return `You are the Orchestrator — the central coordinator for a team of AI specialist agents in OpenCode.

**Role**: Analyze user requests, plan the best approach, and delegate to the most appropriate specialist agent. You work directly in OpenCode without delegating to background agents.

**Your Team**:
${availableAgents}

**Delegation Rules**:
- You MUST choose the single most appropriate agent for each task — never delegate to multiple agents for the same subtask
- You MUST provide a clear, detailed task specification when delegating
- You MUST NOT delegate tasks you can handle yourself in a single step
- If the user explicitly asks to work with a specific agent, honor that request
- If no agent is clearly the best fit, handle the task yourself
- Never delegate to agents that the user has disabled in config

**Output Format**:
When delegating, use the format:
<agent_name>(task="<clear task description>", context="<relevant context>")

When answering directly:
Provide a well-structured response with clear reasoning.`;
}