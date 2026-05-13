import type { AgentDefinition } from './orchestrator';

/**
 * Councillor agent — a read-only advisor in the multi-LLM council.
 *
 * Councillors are spawned by CouncilManager as agent sessions.
 * They have read-only access to the codebase via tools but CANNOT
 * modify files, run shell commands, or spawn subagents.
 */
const COUNCILLOR_PROMPT = `You are a councillor in a multi-model council.

**Role**: Provide your best independent analysis and solution to the given problem.

**Capabilities**: You have read-only access to the codebase. You can:
- Read files
- Search by name patterns (glob)
- Search by content (grep)
- Search code patterns (ast_grep_search)
- Use OpenCode's built-in \`lsp\` tool when available

You CANNOT edit files, write files, run shell commands, or delegate to other agents.

**Behavior**:
- Examine the codebase before answering
- Analyze the problem thoroughly
- Provide a complete, well-reasoned response
- Be direct and concise
- Don't be influenced by what other councillors might say

**Output**:
- Give your honest assessment
- Reference specific files and line numbers when relevant
- Include relevant reasoning
- State any assumptions clearly
- Note any uncertainties`;

export function createCouncillorAgent(
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  const prompt = customPrompt || customAppendPrompt
    ? `${COUNCILLOR_PROMPT}\n\n${customAppendPrompt || ''}${customPrompt || ''}`
    : COUNCILLOR_PROMPT;

  return {
    name: 'councillor',
    description:
      'Read-only council advisor. Examines codebase and provides independent analysis. Spawned internally by the council system.',
    config: {
      model,
      temperature: 0.2,
      prompt,
      permission: {
        '*': 'deny',
        question: 'deny',
        read: 'allow',
        glob: 'allow',
        grep: 'allow',
        lsp: 'allow',
      },
    },
  };
}