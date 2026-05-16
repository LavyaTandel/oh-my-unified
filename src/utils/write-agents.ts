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
    const model = agent._modelArray?.[0]?.id ?? agent.config.model ?? 'opencode/nemotron-3-super-free';
    const fallbackModels = agent._modelArray
      ?.slice(1)
      .map((m) => m.id)
      .filter(Boolean);
    const displayName = agent.displayName ?? `@${agent.name}`;
    const description = agent.description ?? '';
    const mode = agent.config.mode ?? 'primary';
    const color = (agent.config as any).color ?? undefined;
    const skills = (agent.config as any).skills ?? [];
    const mcps = (agent.config as any).mcps ?? [];

    // Build frontmatter matching OpenCode's expected format
    const frontmatterLines = [
      '---',
      `model: ${model}`,
      `display_name: "${displayName.replace(/"/g, '\\"')}"`,
    ];

    // fallback_models as YAML list
    if (fallbackModels && fallbackModels.length > 0) {
      frontmatterLines.push('fallback_models:');
      for (const fm of fallbackModels) {
        frontmatterLines.push(`  - ${fm}`);
      }
    }

    frontmatterLines.push(`description: "${description.replace(/"/g, '\\"')}"`);
    frontmatterLines.push(`mode: ${mode}`);

    if (color) {
      frontmatterLines.push(`color: ${color}`);
    }

    // Skills list
    if (skills.length > 0) {
      frontmatterLines.push('skills:');
      for (const s of skills) {
        frontmatterLines.push(`  - ${s}`);
      }
    }

    // MCP list
    if (mcps.length > 0) {
      frontmatterLines.push('mcps:');
      for (const m of mcps) {
        frontmatterLines.push(`  - ${m}`);
      }
    }

    frontmatterLines.push('---');
    frontmatterLines.push('');

    const frontmatter = frontmatterLines.join('\n');
    const content = frontmatter + `# ${displayName}\n\n${agent.config.prompt ?? ''}`;
    const filePath = path.join(agentDir, `${agent.name}.md`);

    fs.writeFileSync(filePath, content, 'utf-8');
    written.push(agent.name);
  }

  return written;
}
