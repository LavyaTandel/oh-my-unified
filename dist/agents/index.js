import { ALL_AGENT_NAMES, DEFAULT_MODELS, getAgentOverride, PRIMARY_AGENT_NAMES, SUBAGENT_NAMES, } from '../config';
import { getAgentMcpList } from '../config/agent-mcps';
import { createCouncilAgent } from './council';
import { createCouncillorAgent } from './councillor';
import { createFreyrAgent } from './designer';
import { createSifAgent } from './explorer';
import { createHermodAgent } from './fixer';
import { createEirAgent } from './librarian';
import { createHeimdallAgent } from './observer';
import { createMimirAgent } from './oracle';
import { resolvePrompt, } from './orchestrator';
import { createNorseAgent } from './norse-agent';
const COUNCIL_TOOL_ALLOWED_AGENTS = new Set(['forseti']);
const SAFE_AGENT_ALIAS_RE = /^[a-z][a-z0-9_-]*$/i;
const PRIMARY_SET = new Set(PRIMARY_AGENT_NAMES);
const SUBAGENT_SET = new Set(SUBAGENT_NAMES);
function applyAgentMode(name, sdkConfig) {
    if (name === 'odin' || name === 'njord') {
        sdkConfig.mode = 'primary';
    }
    else if (PRIMARY_SET.has(name)) {
        sdkConfig.mode = 'all';
    }
    else if (SUBAGENT_SET.has(name)) {
        sdkConfig.mode = 'subagent';
    }
    else {
        sdkConfig.mode = 'subagent';
    }
}
function normalizeDisplayName(displayName) {
    const trimmed = displayName.trim();
    return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}
function isSafeDisplayName(displayName) {
    return SAFE_AGENT_ALIAS_RE.test(displayName);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// ─── Agent Configuration Helpers ────────────────────────────────────────────
function applyOverrides(agent, override) {
    if (override.model) {
        if (Array.isArray(override.model)) {
            agent._modelArray = override.model.map((m) => typeof m === 'string' ? { id: m } : m);
            agent.config.model = undefined;
        }
        else {
            agent.config.model = override.model;
        }
    }
    // Build _modelArray from model + fallback_models for graceful degradation
    if (override.fallback_models?.length) {
        const primaryModel = Array.isArray(override.model)
            ? (typeof override.model[0] === 'string' ? override.model[0] : override.model[0].id)
            : (override.model || agent.config.model);
        if (primaryModel) {
            agent._modelArray = [
                { id: primaryModel },
                ...override.fallback_models.map((m) => ({ id: m })),
            ];
        }
    }
    if (override.variant)
        agent.config.variant = override.variant;
    if (override.temperature !== undefined)
        agent.config.temperature = override.temperature;
    if (override.options) {
        agent.config.options = override.options;
    }
    if (override.skills) {
        agent.config.skills = override.skills;
    }
    if (override.mcps) {
        agent.config.mcps = override.mcps;
    }
    if (override.displayName) {
        agent.displayName = normalizeDisplayName(override.displayName);
    }
    if (override.prompt) {
        agent.config.prompt = resolvePrompt(agent.config.prompt, override.prompt);
    }
}
function getAgentModel(agentName, config) {
    const override = getAgentOverride(config, agentName);
    if (override?.model) {
        if (Array.isArray(override.model)) {
            const first = override.model[0];
            return (typeof first === 'string' ? first : first.id) || 'openai/gpt-5.4-mini';
        }
        return override.model;
    }
    return DEFAULT_MODELS[agentName] || 'openai/gpt-5.4-mini';
}
// ─── Agent Factories ────────────────────────────────────────────────────────
const agentFactories = {
    odin: (model, customPrompt, customAppendPrompt) => createNorseAgent('odin', model, customPrompt, customAppendPrompt) ??
        createNorseAgent('njord', model, customPrompt, customAppendPrompt),
    njord: (model, customPrompt, customAppendPrompt) => createNorseAgent('njord', model, customPrompt, customAppendPrompt),
    mimir: (model, customPrompt, customAppendPrompt) => createMimirAgent(model, customPrompt, customAppendPrompt),
    vidar: (model, customPrompt, customAppendPrompt) => createNorseAgent('vidar', model, customPrompt, customAppendPrompt),
    thor: (model, customPrompt, customAppendPrompt) => createNorseAgent('thor', model, customPrompt, customAppendPrompt),
    freyr: (model, customPrompt, customAppendPrompt) => createFreyrAgent(model, customPrompt, customAppendPrompt),
    hermod: (model, customPrompt, customAppendPrompt) => createHermodAgent(model, customPrompt, customAppendPrompt),
    heimdall: (model, customPrompt, customAppendPrompt) => createHeimdallAgent(model, customPrompt, customAppendPrompt),
    forseti: (model, customPrompt, customAppendPrompt) => createCouncilAgent(model, customPrompt, customAppendPrompt),
    frigg: (model, customPrompt, customAppendPrompt) => createNorseAgent('frigg', model, customPrompt, customAppendPrompt),
    tyr: (model, customPrompt, customAppendPrompt) => createNorseAgent('tyr', model, customPrompt, customAppendPrompt),
    eir: (model, customPrompt, customAppendPrompt) => createEirAgent(model, customPrompt, customAppendPrompt),
    sif: (model, customPrompt, customAppendPrompt) => createSifAgent(model, customPrompt, customAppendPrompt),
    magni: (model, customPrompt, customAppendPrompt) => createNorseAgent('magni', model, customPrompt, customAppendPrompt),
    hod: (model, customPrompt, customAppendPrompt) => createCouncillorAgent(model, customPrompt, customAppendPrompt),
};
// ─── Main Exported Functions ────────────────────────────────────────────────
export function createAgents(config, catalog) {
    const disabledAgents = config?.disabled_agents ?? [];
    const agentOverrides = config?.agents ?? {};
    const result = [];
    for (const name of ALL_AGENT_NAMES) {
        if (disabledAgents.includes(name))
            continue;
        const override = getAgentOverride(config, name);
        let model;
        if (override?.model) {
            if (Array.isArray(override.model)) {
                const first = override.model[0];
                model = (typeof first === 'string' ? first : first.id) || 'openai/gpt-5.4-mini';
            }
            else {
                model = override.model;
            }
        }
        else {
            model = getAgentModel(name, config);
        }
        const factory = agentFactories[name];
        if (!factory)
            continue;
        let agentDef = factory(model, override?.prompt, undefined);
        // Apply remaining overrides
        if (override) {
            applyOverrides(agentDef, override);
        }
        // Set MCP list for this agent — prefer user config, fall back to discovery
        const mcpList = getAgentMcpList(name, config);
        if (mcpList) {
            agentDef.config.mcps = mcpList;
        }
        else if (catalog) {
            // Auto-assign MCPs based on agent role + discovered catalog
            const matched = catalog.findByTrigger(name);
            if (matched.length > 0) {
                agentDef.config.mcps = matched
                    .filter(e => e.category === 'mcp' && e.serverName)
                    .map(e => e.serverName);
            }
        }
        result.push(agentDef);
    }
    return result;
}
export function getAgentConfigs(config, catalog) {
    const agents = createAgents(config, catalog);
    const entries = [];
    for (const agent of agents) {
        const sdkConfig = {
            ...agent.config,
            description: agent.description || '',
            mcps: getAgentMcpList(agent.name, config) ?? agent.config.mcps,
        };
        applyAgentMode(agent.name, sdkConfig);
        const displayName = agent.displayName
            ? normalizeDisplayName(agent.displayName)
            : agent.name;
        if (displayName && displayName !== agent.name && isSafeDisplayName(displayName)) {
            entries.push([displayName, { ...sdkConfig, mode: sdkConfig.mode }]);
            entries.push([agent.name, { ...sdkConfig, hidden: true }]);
        }
        else {
            entries.push([agent.name, sdkConfig]);
        }
    }
    return Object.fromEntries(entries);
}
export function getDisabledAgents(config) {
    return new Set(config?.disabled_agents ?? []);
}
//# sourceMappingURL=index.js.map