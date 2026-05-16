import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { PipelineOrchestrator } from '../pipeline';
import { SystemObserver } from '../system-observer';
import { log } from '../../utils/logger';

export interface PipelineCommandHandler {
  handleCommand: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Array<{ type: string; text?: string }> },
  ) => Promise<void>;
}

const COMMAND_DESCRIPTIONS: Record<string, { description: string; template: string }> = {
  plan: {
    description: 'Run full pipeline — Assess→Assemble→Improvise→Act',
    template: `Run the complete pipeline:
1. /assess — Odin interviews and researches
2. /assemble — Vidar maps, Forseti deliberates
3. /improvise — Tyr reviews, Mimir validates
4. /act — Thor builds, Hermod implements`,
  },
  assess: {
    description: 'Start requirements assessment — Odin deploys recon swarm',
    template: `Odin deploys parallel recon:
- MCPs scan project structure
- @Frigg analyzes gaps
- @Mimir reviews architecture
- User questions fill remaining gaps`,
  },
  assemble: {
    description: 'Research deep — architecture, patterns, deliberation',
    template: `Research phase:
- @Vidar maps codebase
- @Sif searches patterns
- @Eir finds docs
- @Forseti deliberates approaches`,
  },
  improvise: {
    description: 'Critique and refine the plan before execution',
    template: `Review phase:
- @Tyr reviews for flaws
- @Heimdall checks completeness
- @Mimir validates decisions`,
  },
  act: {
    description: 'Execute with full force',
    template: `Execution phase:
- @Njord orchestrates
- @Thor builds
- @Hermod fixes
- @Freyr crafts UI`,
  },
  synthesize: {
    description: 'Deploy ALL agents, collect findings, synthesize into unified report',
    template: 'Fan out all agents, gather analysis, synthesize into one report with confidence tracking',
  },
  health: {
    description: 'Display system health dashboard with component status',
    template: 'Show the complete system health dashboard',
  },
  status: {
    description: 'Show current pipeline status and kanban progress',
    template: 'Show pipeline phase, completed tasks, and active sessions',
  },
};

const PIPELINE_COMMANDS = new Set(Object.keys(COMMAND_DESCRIPTIONS));

export function createPipelineCommandHandler(
  _ctx: PluginInput,
  _config: PluginConfig,
  systemObserver?: SystemObserver,
): PipelineCommandHandler {
  const pipeline = new PipelineOrchestrator();

  async function handleCommand(
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Array<{ type: string; text?: string }> },
  ): Promise<void> {
    const cmd = input.command.toLowerCase();
    if (!PIPELINE_COMMANDS.has(cmd)) return;

    const arg = input.arguments.trim();
    const desc = COMMAND_DESCRIPTIONS[cmd];

    switch (cmd) {
      case 'plan':
        if (!arg) {
          output.parts.length = 0;
          output.parts.push({
            type: 'text',
            text: `**/plan** — ${desc.description}\n\n${desc.template}\n\nUsage: \`/plan [topic]\` to start, \`/plan status\` to check progress.`,
          });
          return;
        }
        if (arg === 'status') {
          const results = pipeline.collectSubSessionResults();
          const synthesis = pipeline.synthesize();
          output.parts.length = 0;
          output.parts.push({
            type: 'text',
            text: `**Pipeline Status**\n\nConductor: @${pipeline.getConductor()}\nWaiting: ${pipeline.isWaiting() ? 'Yes' : 'No'}\n\n${results.join('\n')}\n\n${synthesis}`,
          });
          return;
        }
        pipeline.selectConductor('odin');
        await pipeline.runFullPipeline(arg);
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Pipeline Started**\n\nTopic: ${arg}\nConductor: @odin\n\nPhases:\n1. Assess → Odin interviews\n2. Assemble → Vidar maps, Forseti deliberates\n3. Improvise → Tyr reviews, Mimir validates\n4. Act → Thor builds, Hermod implements\n\nCheck status with \`/plan status\``,
        });
        log('[pipeline] plan started', { sessionId: input.sessionID, topic: arg });
        break;

      case 'assess':
        pipeline.selectConductor('odin');
        await pipeline.runPhase('assess');
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Phase: Assess**\n\n${desc.template}\n\nOdin is conducting requirements assessment. Check kanban for progress.`,
        });
        log('[pipeline] assess started', { sessionId: input.sessionID });
        break;

      case 'assemble':
        await pipeline.runPhase('assemble');
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Phase: Assemble**\n\n${desc.template}\n\nResearch phase active. Agents are mapping architecture and deliberating approaches.`,
        });
        log('[pipeline] assemble started', { sessionId: input.sessionID });
        break;

      case 'improvise':
        await pipeline.runPhase('improvise');
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Phase: Improvise**\n\n${desc.template}\n\nReview phase active. Tyr, Heimdall, and Mimir are critiquing the plan.`,
        });
        log('[pipeline] improvise started', { sessionId: input.sessionID });
        break;

      case 'act':
        await pipeline.runPhase('act');
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Phase: Act**\n\n${desc.template}\n\nExecution phase active. Njord is orchestrating Thor, Hermod, and Freyr.`,
        });
        log('[pipeline] act started', { sessionId: input.sessionID });
        break;

      case 'synthesize':
        const synthesis = pipeline.synthesize();
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: synthesis,
        });
        log('[pipeline] synthesize', { sessionId: input.sessionID });
        break;

      case 'health': {
        const report = systemObserver?.getStatus();
        if (!report) {
          output.parts.length = 0;
          output.parts.push({ type: 'text', text: '**System Health**\n\nObserver not initialized.' });
          return;
        }
        const componentLines = report.components
          .map((c) => `- ${c.name}: ${c.status.toUpperCase()}${c.lastError ? ` (${c.lastError})` : ''}`)
          .join('\n');
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**System Health Dashboard**\n\nOverall: ${report.overall.toUpperCase()}\nRunning Tasks: ${report.runningTasks}\nConnected MCPs: ${report.connectedMcps}\n\n## Components\n${componentLines}\n\n${report.warnings.length > 0 ? `## Warnings\n${report.warnings.join('\n')}\n\n` : ''}${report.errors.length > 0 ? `## Errors\n${report.errors.join('\n')}` : ''}`,
        });
        log('[pipeline] health check', { sessionId: input.sessionID, overall: report.overall });
        break;
      }

      case 'status': {
        const kanban = pipeline.getKanban();
        const kanbanReport = kanban.getReport();
        const workflow = pipeline.getWorkflow();
        const subSessions = pipeline.getVisibleSubSessions();

        const sessionLines = subSessions
          .map((s) => `- ${s.displayName}: ${s.status} — ${s.taskDescription.slice(0, 60)}`)
          .join('\n') || 'No active sub-sessions';

        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `**Pipeline Status**\n\nConductor: @${pipeline.getConductor()}\nPhase: ${workflow.getPhase()}\nConfidence: ${workflow.getConfidence()}/10\nWaiting: ${pipeline.isWaiting() ? 'Yes' : 'No'}\n\n## Kanban (${kanbanReport.totalCount} tasks)\nCompleted: ${kanbanReport.completedCount}`,
        });
        log('[pipeline] status', { sessionId: input.sessionID });
        break;
      }
    }
  }

  return { handleCommand };
}
