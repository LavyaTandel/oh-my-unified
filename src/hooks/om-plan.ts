import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';

const COMMAND_NAME = 'om-plan';

/**
 * Creates the om-plan slash command for 4-phase structured planning.
 * Phases: Assess → Assemble → Act → Improvise
 */
export function createOmPlanHook(ctx: PluginInput, config: PluginConfig) {
  function registerCommand(opencodeConfig: Record<string, unknown>): void {
    const configCommand = opencodeConfig.command as
      | Record<string, unknown>
      | undefined;
    if (!configCommand?.[COMMAND_NAME]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      (opencodeConfig.command as Record<string, unknown>)[COMMAND_NAME] = {
        template: `Call the tool with action: 'assess', 'assemble', 'act', 'improvise', or 'status'`,
        description:
          '4-phase structured planning: Assess→Assemble→Act→Improvise with model-specialized routing',
      };
    }
  }

  async function handleCommandExecuteBefore(
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Array<{ type: string; text?: string }> },
  ): Promise<void> {
    if (input.command !== COMMAND_NAME) return;

    output.parts.length = 0;
    const arg = input.arguments.trim();

    if (!arg) {
      output.parts.push({
        type: 'text',
        text: '**om-plan** — 4-Phase Structured Planning\n\n' +
          'Usage: `/om-plan <phase>`\n\n' +
          'Phases:\n' +
          '  1. **assess** — Analyze requirements and constraints\n' +
          '  2. **assemble** — Gather resources and structure approach\n' +
          '  3. **act** — Execute the plan\n' +
          '  4. **improvise** — Adapt and iterate\n\n' +
          'Current status: No active plan. Run `/om-plan assess` to start.',
      });
      return;
    }

    const phase = arg.toLowerCase();
    switch (phase) {
      case 'assess':
        output.parts.push({
          type: 'text',
          text: '🔍 **Phase 1: Assess**\n\nAnalyzing requirements and constraints. This phase uses Ring 2.6 1T for deep reasoning about the problem space.',
        });
        break;
      case 'assemble':
        output.parts.push({
          type: 'text',
          text: '📋 **Phase 2: Assemble**\n\nGathering resources and structuring the approach. This phase uses MiniMax M2.5 for creative synthesis.',
        });
        break;
      case 'act':
        output.parts.push({
          type: 'text',
          text: '⚡ **Phase 3: Act**\n\nExecuting the plan. This phase uses DeepSeek V4 Flash for fast implementation.',
        });
        break;
      case 'improvise':
        output.parts.push({
          type: 'text',
          text: '🔄 **Phase 4: Improvise**\n\nAdapting and iterating based on results. This phase uses Nemotron 3 Super for critical review.',
        });
        break;
      case 'status':
        output.parts.push({
          type: 'text',
          text: '📊 **Plan Status**\n\nNo active plan session. Start with `/om-plan assess`.',
        });
        break;
      default:
        output.parts.push({
          type: 'text',
          text: `Unknown phase: "${arg}". Available phases: assess, assemble, act, improvise, status`,
        });
    }
  }

  return { registerCommand, handleCommandExecuteBefore };
}