import fs from 'node:fs';
import path from 'node:path';
import type { AgentDefinition } from '../agents/orchestrator';

export function writeAgentFiles(
  agents: AgentDefinition[],
  directory: string,
): string[] {
  const agentDir = path.join(directory, '.opencode', 'agent');

  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }

  const written: string[] = [];

  for (const agent of agents) {
    const model = agent._modelArray?.[0]?.id ?? 'opencode/nemotron-3-super-free';
    const fallbackModels = agent._modelArray
      ?.slice(1)
      .map((m) => m.id)
      .filter(Boolean);
    const displayName = agent.displayName ?? `@${agent.name}`;
    const description = agent.description ?? '';
    const mode = agent.config.mode ?? 'primary';
    const color = (agent.config as any).color ?? undefined;

    const frontmatter = [
      '---',
      `model: ${model}`,
      ...(fallbackModels && fallbackModels.length > 0
        ? [`fallback_models:\n${fallbackModels.map((m) => `  - ${m}`).join('\n')}`]
        : []),
      `description: "${description.replace(/"/g, '\\"')}"`,
      `mode: ${mode}`,
      ...(color ? [`color: ${color}`] : []),
      '---',
      '',
    ].join('\n');

    const content = frontmatter + `# ${displayName}\n\n${agent.config.prompt ?? ''}`;
    const filePath = path.join(agentDir, `${agent.name}.md`);

    fs.writeFileSync(filePath, content, 'utf-8');
    written.push(agent.name);
  }

  return written;
}
