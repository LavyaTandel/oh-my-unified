import { getAgent } from '../features/agent-commands';
/**
 * Create an AgentDefinition from the agent-commands registry.
 * This unifies the two agent systems: agent-commands provides the
 * source of truth for prompts/roles/delegation, and this factory
 * produces runtime AgentDefinition objects for OpenCode.
 */
export function createNorseAgent(name, model, customPrompt, customAppendPrompt) {
    const agentConfig = getAgent(name);
    if (!agentConfig)
        return undefined;
    let prompt = agentConfig.template;
    if (customPrompt) {
        prompt = customPrompt;
    }
    else if (customAppendPrompt) {
        prompt = `${agentConfig.template}\n\n${customAppendPrompt}`;
    }
    return {
        name: agentConfig.name,
        displayName: agentConfig.displayName,
        description: agentConfig.description,
        config: {
            model,
            temperature: agentConfig.role === 'Strategist' || agentConfig.role === 'Orchestrator' ? 0.1 : 0.3,
            prompt,
        },
    };
}
//# sourceMappingURL=norse-agent.js.map