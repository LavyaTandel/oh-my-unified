import fs from 'node:fs';
import path from 'node:path';
import type { AgentDefinition } from '../agents/orchestrator';
import { PRIMARY_AGENT_NAMES, SUBAGENT_NAMES } from '../config';

const PRIMARY_SET = new Set(PRIMARY_AGENT_NAMES);
const SUBAGENT_SET = new Set(SUBAGENT_NAMES);

function resolveAgentMode(name: string): string {
  if (name === 'odin' || name === 'njord') return 'primary';
  if (PRIMARY_SET.has(name as any)) return 'all';
  if (SUBAGENT_SET.has(name as any)) return 'subagent';
  return 'subagent';
}

export function writeAgentFiles(
  agents: AgentDefinition[],
  directory: string,
): string[] {
  const agentDir = path.join(directory, '.opencode', 'agents');
  const legacyDir = path.join(directory, '.opencode', 'agent');

  // Clean up legacy directory if it exists to resolve duplication
  if (fs.existsSync(legacyDir)) {
    try {
      fs.rmSync(legacyDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }

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
    const displayName = agent.displayName ?? agent.name;
    const description = agent.description ?? '';
    const mode = resolveAgentMode(agent.name);
    const color = (agent.config as any).color ?? undefined;
    const skills = (agent.config as any).skills ?? [];
    const mcps = (agent.config as any).mcps ?? [];

    const frontmatterLines = [
      '---',
      `model: ${model}`,
      `display_name: "${displayName.replace(/"/g, '\\"')}"`,
    ];

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

    if (skills.length > 0) {
      frontmatterLines.push('skills:');
      for (const s of skills) {
        frontmatterLines.push(`  - ${s}`);
      }
    }

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
