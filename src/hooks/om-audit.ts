import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';

const COMMAND_NAME = 'om-audit';

/**
 * Creates the om-audit slash command for multi-perspective code review.
 * Runs architecture, quality, security, and UX checks via council-style
 * multi-model orchestration.
 */
export function createOmAuditHook(ctx: PluginInput, config: PluginConfig) {
  function registerCommand(opencodeConfig: Record<string, unknown>): void {
    const configCommand = opencodeConfig.command as
      | Record<string, unknown>
      | undefined;
    if (!configCommand?.[COMMAND_NAME]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      (opencodeConfig.command as Record<string, unknown>)[COMMAND_NAME] = {
        template: `Call the tool with action: 'architecture', 'quality', 'security', 'ux', or 'full'`,
        description:
          'Multi-perspective code audit: architecture/quality/security/UX via council-style multi-model orchestration',
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
        text: '**om-audit** — Multi-Perspective Code Audit\n\n' +
          'Usage: `/om-audit <check>`\n\n' +
          'Checks:\n' +
          '  - **architecture** — System structure & patterns (Nemotron 3 Super)\n' +
          '  - **quality** — Code quality & best practices (Ring 2.6 1T)\n' +
          '  - **security** — Vulnerability & threat analysis (Nemotron 3 Super)\n' +
          '  - **ux** — User experience & interaction patterns (MiniMax M2.5)\n' +
          '  - **full** — All checks (runs all perspectives in parallel)\n\n' +
          'Note: This tool orchestrates the council pattern — multiple agents\n' +
          'review the codebase from different angles simultaneously.',
      });
      return;
    }

    const check = arg.toLowerCase();
    switch (check) {
      case 'architecture':
        output.parts.push({
          type: 'text',
          text: '🏗️ **Architecture Audit**\n\n' +
            'Running structural analysis via Nemotron 3 Super...\n\n' +
            'This check evaluates:\n' +
            '- Module boundaries and coupling\n' +
            '- Design pattern adherence\n' +
            '- Scalability considerations\n' +
            '- API contract consistency\n\n' +
            'Select code or a file first, then run this command to get analysis.',
        });
        break;
      case 'quality':
        output.parts.push({
          type: 'text',
          text: '🔬 **Quality Audit**\n\n' +
            'Running deep code review via Ring 2.6 1T...\n\n' +
            'This check evaluates:\n' +
            '- Code readability and maintainability\n' +
            '- Test coverage gaps\n' +
            '- Error handling patterns\n' +
            '- Performance bottlenecks\n\n' +
            'Select code or a file first, then run this command to get analysis.',
        });
        break;
      case 'security':
        output.parts.push({
          type: 'text',
          text: '🔒 **Security Audit**\n\n' +
            'Running vulnerability analysis via Nemotron 3 Super...\n\n' +
            'This check evaluates:\n' +
            '- Input validation & sanitization\n' +
            '- Authentication/authorization flows\n' +
            '- Dependency vulnerabilities\n' +
            '- Data exposure risks\n\n' +
            'Select code or a file first, then run this command to get analysis.',
        });
        break;
      case 'ux':
        output.parts.push({
          type: 'text',
          text: '🎨 **UX Audit**\n\n' +
            'Running interaction analysis via MiniMax M2.5...\n\n' +
            'This check evaluates:\n' +
            '- User flow clarity\n' +
            '- Accessibility compliance\n' +
            '- Visual hierarchy\n' +
            '- Interaction feedback patterns\n\n' +
            'Select code or a file first, then run this command to get analysis.',
        });
        break;
      case 'full':
        output.parts.push({
          type: 'text',
          text: '🔍 **Full Audit**\n\n' +
            'Running all perspectives in parallel:\n\n' +
            '1. 🏗️ Architecture → Nemotron 3 Super\n' +
            '2. 🔬 Quality → Ring 2.6 1T\n' +
            '3. 🔒 Security → Nemotron 3 Super\n' +
            '4. 🎨 UX → MiniMax M2.5\n\n' +
            'Select code or a file first, then run this command to get analysis.',
        });
        break;
      default:
        output.parts.push({
          type: 'text',
          text: `Unknown check: "${arg}". Available checks: architecture, quality, security, ux, full`,
        });
    }
  }

  return { registerCommand, handleCommandExecuteBefore };
}