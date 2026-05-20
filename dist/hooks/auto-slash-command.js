import { log } from '../utils/logger';
const AUTO_SLASH_COMMAND_TAG_OPEN = '<!-- oh-my-unified:slash-command -->';
const AUTO_SLASH_COMMAND_TAG_CLOSE = '<!-- /oh-my-unified:slash-command -->';
const SLASH_COMMAND_PATTERN = /^\/([a-zA-Z0-9_-]+)\s*([\s\S]*)$/;
const OUR_COMMANDS = new Set([
    'plan', 'assess', 'assemble', 'improvise', 'act',
    'synthesize', 'health', 'status', 'diagnose',
    'capabilities', 'onboarding', 'log', 'agents',
]);
const COMMAND_TEMPLATES = {
    plan: {
        command: 'plan',
        template: 'Run the full pipeline: assess → assemble → improvise → act. Topic: {{args}}',
        description: 'Full end-to-end workflow with confidence gates',
    },
    assess: {
        command: 'assess',
        template: 'Phase 1: Conduct requirements assessment. Identify gaps, contradictions, and missing context.',
        description: 'Requirements assessment (confidence ≥6)',
    },
    assemble: {
        command: 'assemble',
        template: 'Phase 2: Deep research and architecture. Map dependencies, study documentation, deliberate on tradeoffs.',
        description: 'Deep research & architecture (confidence ≥8)',
    },
    improvise: {
        command: 'improvise',
        template: 'Phase 3: Critique and refine. Perform adversarial review, check quality, refine approach. Continue until user is satisfied.',
        description: 'Critique & refine (loop until satisfied)',
    },
    act: {
        command: 'act',
        template: 'Phase 4: Execute the plan. Build, fix, and design with confidence ≥9.',
        description: 'Execute the plan (confidence ≥9)',
    },
    synthesize: {
        command: 'synthesize',
        template: 'Synthesize all agent results into a single report.',
        description: 'Deploy all agents, one report',
    },
    health: {
        command: 'health',
        template: 'Run system health check. Report overall status, component health, warnings, and errors.',
        description: 'System Observer health report',
    },
    status: {
        command: 'status',
        template: 'Show pipeline status: conductor, phase, confidence, kanban tasks, and sub-sessions.',
        description: 'Pipeline status and progress',
    },
    diagnose: {
        command: 'diagnose',
        template: 'Run 12 parallel system health checks: plugin bootstrap, agent registration, MCP connectivity, TUI status, interview engine, circuit breakers, plugin registry, integrations.',
        description: '12 parallel system health checks',
    },
    capabilities: {
        command: 'capabilities',
        template: 'List all plugin capabilities grouped by category: agents, hooks, tools, MCPs, features.',
        description: 'Dynamic capability listing',
    },
    onboarding: {
        command: 'onboarding',
        template: 'Show interactive welcome menu with contextual guidance for first-time users.',
        description: 'First-run interactive guide',
    },
    log: {
        command: 'log',
        template: 'Query the transparency log. {{args}}',
        description: 'Transparency log query (recent, stats, by type, by session)',
    },
    agents: {
        command: 'agents',
        template: 'List all active agents with their models, roles, and status.',
        description: 'List all active agents',
    },
};
function parseSlashCommand(text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/'))
        return null;
    const match = trimmed.match(SLASH_COMMAND_PATTERN);
    if (!match)
        return null;
    return {
        command: match[1].toLowerCase(),
        args: (match[2] || '').trim(),
        raw: trimmed,
    };
}
function removeCodeBlocks(text) {
    return text.replace(/```[\s\S]*?```/g, '');
}
function findSlashCommandPartIndex(parts) {
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].type === 'text' && parts[i].text?.trim().startsWith('/')) {
            return i;
        }
    }
    return -1;
}
function extractPromptText(parts) {
    return parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text ?? '')
        .join(' ')
        .trim();
}
export function createAutoSlashCommandHook(_ctx, _config) {
    const processedCommands = new Map();
    return {
        'chat.message': async (input, output) => {
            const promptText = extractPromptText(output.parts);
            const textWithoutCodeBlocks = removeCodeBlocks(promptText);
            if (!textWithoutCodeBlocks.trim().startsWith('/'))
                return;
            // Prevent re-processing
            if (promptText.includes(AUTO_SLASH_COMMAND_TAG_OPEN) ||
                promptText.includes(AUTO_SLASH_COMMAND_TAG_CLOSE)) {
                return;
            }
            const parsed = parseSlashCommand(textWithoutCodeBlocks);
            if (!parsed)
                return;
            // Only handle OUR commands
            if (!OUR_COMMANDS.has(parsed.command))
                return;
            const commandKey = input.messageID
                ? `${input.sessionID}:${input.messageID}:${parsed.command}`
                : `${input.sessionID}:${parsed.command}`;
            if (processedCommands.has(commandKey))
                return;
            processedCommands.set(commandKey, true);
            const template = COMMAND_TEMPLATES[parsed.command];
            if (!template)
                return;
            const replacementText = template.template.replace('{{args}}', parsed.args);
            const taggedContent = `${AUTO_SLASH_COMMAND_TAG_OPEN}\n${replacementText}\n${AUTO_SLASH_COMMAND_TAG_CLOSE}`;
            const idx = findSlashCommandPartIndex(output.parts);
            if (idx < 0)
                return;
            output.parts[idx].text = taggedContent;
            log('[auto-slash-command] Replaced message with command template', {
                sessionID: input.sessionID,
                command: parsed.command,
            });
        },
        'command.execute.before': async (input, output) => {
            const normalizedCommand = input.command.toLowerCase();
            // Only handle OUR commands
            if (!OUR_COMMANDS.has(normalizedCommand))
                return;
            const commandKey = `${input.sessionID}:cmd:${normalizedCommand}:${input.arguments || ''}`;
            if (processedCommands.has(commandKey))
                return;
            processedCommands.set(commandKey, true);
            const template = COMMAND_TEMPLATES[normalizedCommand];
            if (!template)
                return;
            const replacementText = template.template.replace('{{args}}', input.arguments);
            const taggedContent = `${AUTO_SLASH_COMMAND_TAG_OPEN}\n${replacementText}\n${AUTO_SLASH_COMMAND_TAG_CLOSE}`;
            // Find existing text part or prepend
            const idx = findSlashCommandPartIndex(output.parts);
            if (idx >= 0) {
                output.parts[idx].text = taggedContent;
            }
            else {
                output.parts.unshift({ type: 'text', text: taggedContent });
            }
            log('[auto-slash-command] command.execute.before - injected template', {
                sessionID: input.sessionID,
                command: normalizedCommand,
            });
        },
        // Cleanup on session end
        event: async (input) => {
            if (input.event.type === 'session.deleted') {
                const props = input.event.properties;
                const sessionID = props?.sessionID ?? props?.info?.id;
                if (sessionID) {
                    // Clean up processed commands for this session
                    for (const key of processedCommands.keys()) {
                        if (key.startsWith(`${sessionID}:`)) {
                            processedCommands.delete(key);
                        }
                    }
                }
            }
        },
    };
}
//# sourceMappingURL=auto-slash-command.js.map