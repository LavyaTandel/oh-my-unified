import { log } from '../../utils/logger';

export interface OnboardingOption {
  number: number;
  icon: string;
  label: string;
  description: string;
  action: string;
}

export interface OnboardingContext {
  agentCount: number;
  mcpCount: number;
  userName?: string;
  isFirstRun?: boolean;
}

export class OnboardingGuide {
  private ctx: OnboardingContext;

  constructor(ctx: OnboardingContext) {
    this.ctx = ctx;
  }

  getOptions(): OnboardingOption[] {
    return [
      {
        number: 1,
        icon: '📋',
        label: 'Plan a project',
        description: 'Run the full 4-phase pipeline with 15 specialized agents',
        action: 'I\'ll start the Assess→Assemble→Improvise→Act pipeline. What would you like to build?',
      },
      {
        number: 2,
        icon: '🔍',
        label: 'Review my code',
        description: 'Launch a 5-agent review panel (Tyr, Heimdall, Mimir, Frigg, Forseti)',
        action: 'I\'ll launch the review panel. What code would you like reviewed?',
      },
      {
        number: 3,
        icon: '🛡️',
        label: 'Security audit',
        description: 'Deep security analysis: auth, crypto, network, data',
        action: 'I\'ll run a comprehensive security audit. What should I analyze?',
      },
      {
        number: 4,
        icon: '🤖',
        label: 'See available agents',
        description: `Show all ${this.ctx.agentCount} agents with model, skills, MCPs, health`,
        action: 'Here are all available agents. Each has specialized capabilities.',
      },
      {
        number: 5,
        icon: '📊',
        label: 'Check system health',
        description: 'Run a full diagnostic (12 checks)',
        action: 'I\'ll run a comprehensive system diagnostic now.',
      },
      {
        number: 6,
        icon: '⚡',
        label: 'Quick demo',
        description: 'See a 30-second example of the full pipeline',
        action: 'Let me show you how the pipeline works with a quick example.',
      },
    ];
  }

  getWelcomeMessage(): string {
    const name = this.ctx.userName ? `, ${this.ctx.userName}` : '';
    const isFirstRun = this.ctx.isFirstRun ?? true;

    const lines: string[] = [];

    if (isFirstRun) {
      lines.push(`👋 Welcome to oh-my-unified${name}!`);
      lines.push('');
      lines.push(`I'm your AI agent orchestrator with ${this.ctx.agentCount} specialized agents, ${this.ctx.mcpCount} MCP integrations,`);
      lines.push('and a full planning/review/execution pipeline.');
      lines.push('');
      lines.push('What would you like to do?');
      lines.push('');
    } else {
      lines.push(`👋 Welcome back${name}!`);
      lines.push('');
      lines.push(`You have ${this.ctx.agentCount} agents and ${this.ctx.mcpCount} MCPs available.`);
      lines.push('');
      lines.push('What would you like to do?');
      lines.push('');
    }

    const options = this.getOptions();
    for (const option of options) {
      lines.push(`${option.number}. ${option.icon} ${option.label}`);
      lines.push(`   ${option.description}`);
      lines.push('');
    }

    lines.push('Reply with a number or describe what you need.');
    lines.push('');
    lines.push('💡 Tip: Run /capabilities to see everything you can do');
    lines.push('💡 Tip: Run /diagnose to check system health');

    return lines.join('\n');
  }

  handleOption(optionNumber: number): string {
    const options = this.getOptions();
    const option = options.find(o => o.number === optionNumber);

    if (!option) {
      return `Invalid option. Please choose 1-${options.length} or describe what you need.`;
    }

    const lines: string[] = [];
    lines.push(`${option.icon} ${option.label}`);
    lines.push('');
    lines.push(option.action);
    lines.push('');

    // Add specific guidance based on option
    switch (optionNumber) {
      case 1:
        lines.push('Example: `/plan "build a REST API with user authentication"`');
        lines.push('');
        lines.push('This will:');
        lines.push('1. Assess requirements with Odin\'s interview swarm');
        lines.push('2. Assemble architecture with specialist agents');
        lines.push('3. Improvise — critique and refine the plan');
        lines.push('4. Act — Thor builds, Hermod fixes, Freyr crafts UI');
        break;

      case 2:
        lines.push('Example: "review my work" or "/om-audit security"');
        lines.push('');
        lines.push('The 5-agent panel will:');
        lines.push('• @Tyr — Quality gate and standards enforcement');
        lines.push('• @Heimdall — Visual analysis and completeness check');
        lines.push('• @Mimir — Architecture review and trade-off analysis');
        lines.push('• @Frigg — Gap analysis and risk identification');
        lines.push('• @Forseti — Multi-perspective deliberation');
        break;

      case 3:
        lines.push('Example: "security research this auth flow"');
        lines.push('');
        lines.push('The security analysis will:');
        lines.push('• Authentication — Check for credential handling, session management');
        lines.push('• Cryptography — Verify encryption, hashing, key management');
        lines.push('• Network — Analyze API security, CORS, headers');
        lines.push('• Data — Check for injection, exposure, validation');
        break;

      case 4:
        lines.push('Type `/` to see all agents with their:');
        lines.push('• Current model and fallback chain');
        lines.push('• Assigned skills and MCPs');
        lines.push('• Health status and session count');
        lines.push('• Role and capabilities');
        break;

      case 5:
        lines.push('The diagnostic checks:');
        lines.push('• MCP connectivity (13 servers)');
        lines.push('• Agent registration (15 agents)');
        lines.push('• Model availability (4 models)');
        lines.push('• SQLite persistence');
        lines.push('• TUI renderer');
        lines.push('• Interview engine');
        lines.push('• File system');
        lines.push('• Network');
        lines.push('• Circuit breakers');
        lines.push('• Plugin registry');
        lines.push('• Integration hub');
        lines.push('• Learning engine');
        break;

      case 6:
        lines.push('Watch me run a mini-pipeline:');
        lines.push('1. I\'ll assess a simple task');
        lines.push('2. Show you how agents are selected');
        lines.push('3. Demonstrate the review process');
        lines.push('4. Show the final synthesis');
        lines.push('');
        lines.push('This takes ~30 seconds. Ready?');
        break;
    }

    return lines.join('\n');
  }
}

export function createOnboardingGuide(ctx: OnboardingContext): OnboardingGuide {
  return new OnboardingGuide(ctx);
}
