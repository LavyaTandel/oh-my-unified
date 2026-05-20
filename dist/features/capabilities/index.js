export class CapabilitiesExplorer {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    getCapabilities() {
        return [
            // Planning & Execution
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Full Pipeline',
                command: '/plan <topic>',
                description: 'Run 4-phase pipeline: Assess→Assemble→Improvise→Act',
                example: '/plan "build a REST API with authentication"',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Pipeline Status',
                command: '/plan status',
                description: 'Show pipeline progress, conductor, and sub-sessions',
                example: '/plan status',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Assess Phase',
                command: '/assess',
                description: 'Requirements analysis with Odin\'s interview swarm',
                example: '/assess',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Assemble Phase',
                command: '/assemble',
                description: 'Research + architecture mapping with specialist agents',
                example: '/assemble',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Improvise Phase',
                command: '/improvise',
                description: 'Critique and refine before execution',
                example: '/improvise',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Act Phase',
                command: '/act',
                description: 'Multi-agent execution: Thor builds, Hermod fixes, Freyr crafts UI',
                example: '/act',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Synthesize',
                command: '/synthesize',
                description: 'Unified report from all agent findings',
                example: '/synthesize',
            },
            {
                category: 'Planning & Execution',
                icon: '📋',
                name: 'Structured Planning',
                command: '/om-plan <phase>',
                description: '4-phase planning with model-specialized routing',
                example: '/om-plan assess',
            },
            // Review & Quality
            {
                category: 'Review & Quality',
                icon: '🔍',
                name: 'Code Audit',
                command: '/om-audit <check>',
                description: '4-perspective audit: architecture, quality, security, UX',
                example: '/om-audit security',
            },
            {
                category: 'Review & Quality',
                icon: '🔍',
                name: '5-Agent Review',
                command: '"review my work"',
                description: 'Tyr, Heimdall, Mimir, Frigg, Forseti review panel',
                example: 'review my work',
            },
            {
                category: 'Review & Quality',
                icon: '🔍',
                name: 'Hyperplan',
                command: '"hyperplan"',
                description: 'Adversarial stress test: Skeptic, Creative, Pragmatist',
                example: 'hyperplan this plan',
            },
            {
                category: 'Review & Quality',
                icon: '🔍',
                name: 'Red Team',
                command: '"red team"',
                description: 'Security-focused adversarial review',
                example: 'red team this implementation',
            },
            // Security
            {
                category: 'Security',
                icon: '🛡️',
                name: 'Security Research',
                command: '"security research"',
                description: 'Deep security analysis: auth, crypto, network, data',
                example: 'security research this auth flow',
            },
            {
                category: 'Security',
                icon: '🛡️',
                name: 'Auto-Trigger',
                command: 'Automatic',
                description: 'Detects sensitive file writes (auth, crypto, eval, XSS)',
                example: 'Write a file with password hashing → auto-triggers security scan',
            },
            // Monitoring
            {
                category: 'Monitoring',
                icon: '📊',
                name: 'System Health',
                command: '/health',
                description: 'System health dashboard with component status',
                example: '/health',
            },
            {
                category: 'Monitoring',
                icon: '📊',
                name: 'Pipeline Status',
                command: '/status',
                description: 'Pipeline progress, kanban, conductor, confidence',
                example: '/status',
            },
            {
                category: 'Monitoring',
                icon: '📊',
                name: 'Diagnostics',
                command: '/diagnose',
                description: 'Comprehensive system diagnostic (12 checks)',
                example: '/diagnose',
            },
            // Agent Interaction
            {
                category: 'Agent Interaction',
                icon: '🤖',
                name: 'Agent List',
                command: '/',
                description: `Show all ${this.ctx.agentCount} agents with model, skills, MCPs, health`,
                example: '/',
            },
            {
                category: 'Agent Interaction',
                icon: '🤖',
                name: 'Agent Mention',
                command: '@AgentName',
                description: 'Resolve agent metadata + capabilities',
                example: '@Thor',
            },
            {
                category: 'Agent Interaction',
                icon: '🤖',
                name: 'Agent Suggestions',
                command: 'Automatic',
                description: 'Auto-suggest agents based on task context',
                example: 'Type "I need to build a UI" → suggests @Freyr',
            },
        ];
    }
    getTier2Capabilities() {
        if (!this.ctx.hasLearningEngine && !this.ctx.hasModelPredictor && !this.ctx.hasBenchmarkTracker) {
            return [];
        }
        const capabilities = [];
        if (this.ctx.hasLearningEngine) {
            capabilities.push({
                category: 'Intelligence (Tier 2)',
                icon: '🧠',
                name: 'Cross-Session Learning',
                command: 'Automatic',
                description: 'Remembers what worked/failed, auto-applies lessons',
                example: 'Similar request → shows learned patterns from past sessions',
            });
        }
        if (this.ctx.hasModelPredictor) {
            capabilities.push({
                category: 'Intelligence (Tier 2)',
                icon: '🧠',
                name: 'Predictive Routing',
                command: 'Automatic',
                description: 'Picks best model based on historical success rates',
                example: 'Task → selects model with highest success rate for that category',
            });
        }
        if (this.ctx.hasBenchmarkTracker) {
            capabilities.push({
                category: 'Intelligence (Tier 2)',
                icon: '🧠',
                name: 'Performance Tracking',
                command: 'Automatic',
                description: 'Detects latency/cost/quality regressions',
                example: 'Model change → alerts if performance degrades',
            });
        }
        return capabilities;
    }
    getTier3Capabilities() {
        if (!this.ctx.hasCircuitBreakers && this.ctx.pluginCount === 0 && this.ctx.integrationCount === 0) {
            return [];
        }
        const capabilities = [];
        if (this.ctx.pluginCount > 0 || this.ctx.hasCircuitBreakers) {
            capabilities.push({
                category: 'Extensibility (Tier 3)',
                icon: '🔌',
                name: 'Plugin System',
                command: 'Automatic',
                description: 'Third-party features can register hooks',
                example: `${this.ctx.pluginCount} plugin(s) currently loaded`,
            });
        }
        capabilities.push({
            category: 'Extensibility (Tier 3)',
            icon: '🔌',
            name: 'Auto-Skill Generation',
            command: 'Automatic',
            description: 'Codifies recurring patterns into reusable skills',
            example: 'Pattern occurs 5+ times → auto-generates skill template',
        });
        capabilities.push({
            category: 'Extensibility (Tier 3)',
            icon: '🔌',
            name: 'Multi-User Support',
            command: 'Automatic',
            description: 'Multiple humans, same agent org, shared state',
            example: 'User A and User B collaborate on same project',
        });
        if (this.ctx.integrationCount > 0) {
            capabilities.push({
                category: 'Extensibility (Tier 3)',
                icon: '🔌',
                name: 'External Integrations',
                command: 'Automatic',
                description: 'GitHub, Jira, Slack webhooks',
                example: `${this.ctx.integrationCount} integration(s) configured`,
            });
        }
        return capabilities;
    }
    formatCapabilities() {
        const lines = [];
        lines.push('🚀 oh-my-unified Capabilities');
        lines.push('═'.repeat(40));
        lines.push('');
        // Group by category
        const allCapabilities = [
            ...this.getCapabilities(),
            ...this.getTier2Capabilities(),
            ...this.getTier3Capabilities(),
        ];
        const byCategory = {};
        for (const cap of allCapabilities) {
            if (!byCategory[cap.category]) {
                byCategory[cap.category] = [];
            }
            byCategory[cap.category].push(cap);
        }
        for (const [category, caps] of Object.entries(byCategory)) {
            lines.push(`${caps[0].icon} ${category.toUpperCase()}`);
            for (const cap of caps) {
                lines.push(`  ${cap.command.padEnd(25)} → ${cap.description}`);
            }
            lines.push('');
        }
        // Summary
        lines.push(`📊 ${allCapabilities.length} capabilities across ${Object.keys(byCategory).length} categories`);
        lines.push(`🤖 ${this.ctx.agentCount} agents | 🔌 ${this.ctx.mcpCount} MCPs`);
        lines.push('');
        lines.push('💡 Try: /plan "build a REST API" to see the full pipeline in action');
        lines.push('💡 Try: /diagnose to check system health');
        return lines.join('\n');
    }
}
export function createCapabilitiesExplorer(ctx) {
    return new CapabilitiesExplorer(ctx);
}
//# sourceMappingURL=index.js.map