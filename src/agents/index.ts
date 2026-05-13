import type { PluginConfig } from '../config/schema';
import { getSkillPermissionsForAgent } from '../cli/skills';
import {
  type AgentOverrideConfig,
  ALL_AGENT_NAMES,
  DEFAULT_MODELS,
  getAgentOverride,
  getCustomAgentNames,
  LOOM_PRESET,
  PROTECTED_AGENTS,
  SUBAGENT_NAMES,
} from '../config';
import { getAgentMcpList } from '../config/agent-mcps';

import { createCouncilAgent } from './council';
import { createCouncillorAgent } from './councillor';
import { createDesignerAgent } from './designer';
import { createExplorerAgent } from './explorer';
import { createFixerAgent } from './fixer';
import { createLibrarianAgent } from './librarian';
import { createObserverAgent } from './observer';
import { createOracleAgent } from './oracle';
import {
  type AgentDefinition,
  buildOrchestratorPrompt,
  resolvePrompt,
} from './orchestrator';

export type { AgentDefinition } from './orchestrator';

type AgentFactory = (
  model: string,
  customPrompt?: string,
  customAppendPrompt?: string,
) => AgentDefinition;

const COUNCIL_TOOL_ALLOWED_AGENTS = new Set(['council']);
const SAFE_AGENT_ALIAS_RE = /^[a-z][a-z0-9_-]*$/i;

function normalizeDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

function isSafeDisplayName(displayName: string): boolean {
  return SAFE_AGENT_ALIAS_RE.test(displayName);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Agent Configuration Helpers ────────────────────────────────────────────

function applyOverrides(
  agent: AgentDefinition,
  override: AgentOverrideConfig,
): void {
  if (override.model) {
    if (Array.isArray(override.model)) {
      agent._modelArray = override.model.map((m) =>
        typeof m === 'string' ? { id: m } : m,
      );
      agent.config.model = undefined;
    } else {
      agent.config.model = override.model;
    }
  }
  if (override.variant) agent.config.variant = override.variant;
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
    agent.config.prompt = resolvePrompt(agent.config.prompt!, override.prompt);
  }
}

function getAgentModel(
  agentName: string,
  config: PluginConfig | undefined,
): string {
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

const agentFactories: Record<string, AgentFactory> = {
  orchestrator: (_model: string, customPrompt?: string, customAppendPrompt?: string): AgentDefinition => {
    const model = getAgentModel('orchestrator', undefined);
    const prompt = buildOrchestratorPrompt(undefined);
    return {
      name: 'orchestrator',
      description:
        'Central coordinator that analyzes requests and delegates to specialist agents.',
      config: {
        model,
        temperature: 0.1,
        prompt: customPrompt || prompt,
      },
    };
  },
  oracle: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createOracleAgent(model, customPrompt, customAppendPrompt),
  librarian: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createLibrarianAgent(model, customPrompt, customAppendPrompt),
  explorer: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createExplorerAgent(model, customPrompt, customAppendPrompt),
  designer: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createDesignerAgent(model, customPrompt, customAppendPrompt),
  fixer: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createFixerAgent(model, customPrompt, customAppendPrompt),
  observer: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createObserverAgent(model, customPrompt, customAppendPrompt),
  council: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createCouncilAgent(model, customPrompt, customAppendPrompt),
  councillor: (model: string, customPrompt?: string, customAppendPrompt?: string) =>
    createCouncillorAgent(model, customPrompt, customAppendPrompt),
};

// ─── Main Exported Functions ────────────────────────────────────────────────

export function createAgents(config: PluginConfig | undefined): AgentDefinition[] {
  const disabledAgents = config?.disabled_agents ?? [];
  const agentOverrides = config?.agents ?? {};
  const result: AgentDefinition[] = [];

  for (const name of ALL_AGENT_NAMES) {
    if (disabledAgents.includes(name)) continue;

    const override = getAgentOverride(config, name);
    let model: string;
    if (override?.model) {
      if (Array.isArray(override.model)) {
        const first = override.model[0];
        model = (typeof first === 'string' ? first : first.id) || 'openai/gpt-5.4-mini';
      } else {
        model = override.model;
      }
    } else {
      model = getAgentModel(name, config);
    }

    const factory = agentFactories[name];
    if (!factory) continue;

    let agentDef = factory(model, override?.prompt, undefined);

    // Apply remaining overrides
    if (override) {
      applyOverrides(agentDef, override);
    }

    // Set MCP list for this agent
    const mcpList = getAgentMcpList(name, config);
    if (mcpList) {
      agentDef.config.mcps = mcpList;
    }

    result.push(agentDef);
  }

  return result;
}

export function getAgentConfigs(
  config: PluginConfig | undefined,
): Record<string, any> {
  const agents = createAgents(config);
  const configs: Record<string, any> = {};
  for (const agent of agents) {
    configs[agent.name] = agent.config;
    if (agent.displayName) {
      configs[agent.name].displayName = agent.displayName;
    }
  }
  return configs;
}

export function getDisabledAgents(
  config: PluginConfig | undefined,
): Set<string> {
  return new Set(config?.disabled_agents ?? []);
}