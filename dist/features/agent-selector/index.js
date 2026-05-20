import { AGENTS, getAgent } from '../agent-commands';
const TASK_KEYWORDS = {
    'planning': ['odin', 'mimir', 'frigg'],
    'implementation': ['thor', 'hermod', 'magni'],
    'design': ['freyr', 'heimdall'],
    'research': ['eir', 'sif', 'vidar'],
    'review': ['tyr', 'mimir', 'forseti'],
    'search': ['sif', 'vidar'],
    'council': ['forseti', 'hod'],
    'orchestration': ['njord'],
    'mapping': ['vidar'],
    'security': ['tyr', 'mimir'],
    'documentation': ['eir'],
    'testing': ['hermod', 'magni'],
};
export class AgentSelector {
    metadata = new Map();
    modelCapabilities = new Map();
    agentMCPs = new Map();
    agentHealth = new Map();
    lastSuggestionTime = new Map();
    suggestionCooldownMs = 30_000;
    registerAgent(agent) {
        this.metadata.set(agent.name, {
            currentModel: agent.model,
            modelCapabilities: [],
            assignedMCPs: [],
            healthStatus: 'healthy',
            lastActiveAt: 0,
            errorRate: 0,
            sessionCount: 0,
        });
        this.agentHealth.set(agent.name, {
            errors: 0,
            successes: 0,
            lastActive: 0,
        });
    }
    setModelCapabilities(agentName, capabilities) {
        this.modelCapabilities.set(agentName, capabilities);
        const meta = this.metadata.get(agentName);
        if (meta)
            meta.modelCapabilities = capabilities;
    }
    setAssignedMCPs(agentName, mcps) {
        this.agentMCPs.set(agentName, mcps);
        const meta = this.metadata.get(agentName);
        if (meta)
            meta.assignedMCPs = mcps;
    }
    recordSuccess(agentName) {
        const h = this.agentHealth.get(agentName);
        if (h) {
            h.successes++;
            h.lastActive = Date.now();
            const meta = this.metadata.get(agentName);
            if (meta) {
                meta.lastActiveAt = h.lastActive;
                meta.sessionCount = h.successes + h.errors;
                meta.errorRate = h.errors / Math.max(1, h.successes + h.errors);
                meta.healthStatus = meta.errorRate > 0.5 ? 'error' : meta.errorRate > 0.2 ? 'degraded' : 'healthy';
            }
        }
    }
    recordError(agentName) {
        const h = this.agentHealth.get(agentName);
        if (h) {
            h.errors++;
            h.lastActive = Date.now();
            const meta = this.metadata.get(agentName);
            if (meta) {
                meta.lastActiveAt = h.lastActive;
                meta.sessionCount = h.successes + h.errors;
                meta.errorRate = h.errors / Math.max(1, h.successes + h.errors);
                meta.healthStatus = meta.errorRate > 0.5 ? 'error' : meta.errorRate > 0.2 ? 'degraded' : 'healthy';
            }
        }
    }
    getAgentList() {
        return AGENTS.map((agent) => {
            const meta = this.metadata.get(agent.name) ?? {};
            const health = this.agentHealth.get(agent.name);
            return {
                ...agent,
                currentModel: meta.currentModel ?? agent.model,
                modelCapabilities: meta.modelCapabilities ?? this.modelCapabilities.get(agent.name) ?? [],
                assignedMCPs: meta.assignedMCPs ?? this.agentMCPs.get(agent.name) ?? [],
                healthStatus: meta.healthStatus ?? 'healthy',
                lastActiveAt: meta.lastActiveAt ?? health?.lastActive ?? 0,
                errorRate: meta.errorRate ?? 0,
                sessionCount: meta.sessionCount ?? (health?.successes ?? 0) + (health?.errors ?? 0),
            };
        });
    }
    getAgentByMention(mention) {
        const agent = getAgent(mention);
        if (!agent)
            return undefined;
        const meta = this.metadata.get(agent.name) ?? {};
        const health = this.agentHealth.get(agent.name);
        return {
            ...agent,
            currentModel: meta.currentModel ?? agent.model,
            modelCapabilities: meta.modelCapabilities ?? this.modelCapabilities.get(agent.name) ?? [],
            assignedMCPs: meta.assignedMCPs ?? this.agentMCPs.get(agent.name) ?? [],
            healthStatus: meta.healthStatus ?? 'healthy',
            lastActiveAt: meta.lastActiveAt ?? health?.lastActive ?? 0,
            errorRate: meta.errorRate ?? 0,
            sessionCount: meta.sessionCount ?? (health?.successes ?? 0) + (health?.errors ?? 0),
        };
    }
    getSuggestions(context, sessionId) {
        if (sessionId) {
            const lastTime = this.lastSuggestionTime.get(sessionId) ?? 0;
            if (Date.now() - lastTime < this.suggestionCooldownMs) {
                return [];
            }
        }
        const lower = context.toLowerCase();
        const suggestions = [];
        for (const [taskType, agentNames] of Object.entries(TASK_KEYWORDS)) {
            if (lower.includes(taskType)) {
                for (const name of agentNames) {
                    const meta = this.getAgentByMention(name);
                    if (meta && meta.healthStatus !== 'error') {
                        suggestions.push({
                            agent: meta,
                            relevance: meta.healthStatus === 'healthy' ? 1.0 : 0.7,
                            reason: `Best for ${taskType} tasks`,
                        });
                    }
                }
            }
        }
        if (suggestions.length > 0 && sessionId) {
            this.lastSuggestionTime.set(sessionId, Date.now());
        }
        suggestions.sort((a, b) => b.relevance - a.relevance);
        return suggestions.slice(0, 5);
    }
    getSlashCommandOutput() {
        const agents = this.getAgentList();
        const lines = ['**Available Agents**', ''];
        for (const agent of agents) {
            const status = agent.healthStatus === 'healthy' ? '✓' : agent.healthStatus === 'degraded' ? '⚠' : '✗';
            lines.push(`${status} **${agent.displayName}** — ${agent.role}`);
            lines.push(`   Model: ${agent.currentModel} | MCPs: ${agent.assignedMCPs.length} | Sessions: ${agent.sessionCount}`);
            if (agent.modelCapabilities.length > 0) {
                lines.push(`   Capabilities: ${agent.modelCapabilities.slice(0, 5).join(', ')}`);
            }
        }
        return lines.join('\n');
    }
    getStats() {
        const agents = this.getAgentList();
        return {
            total: agents.length,
            healthy: agents.filter((a) => a.healthStatus === 'healthy').length,
            degraded: agents.filter((a) => a.healthStatus === 'degraded').length,
            error: agents.filter((a) => a.healthStatus === 'error').length,
        };
    }
}
export function createAgentSelector() {
    const selector = new AgentSelector();
    for (const agent of AGENTS) {
        selector.registerAgent(agent);
    }
    return selector;
}
//# sourceMappingURL=index.js.map