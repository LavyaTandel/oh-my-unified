import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
// ── Default paths ──────────────────────────────────────────────
function homeDir() {
    return process.env.HOME || process.env.USERPROFILE || '/tmp';
}
const DEFAULT_PATHS = {
    opencodeConfig: join(homeDir(), '.config', 'opencode', 'opencode.json'),
    opencodeSkills: join(homeDir(), '.config', 'opencode', 'skills'),
    claudeSkills: join(homeDir(), '.claude', 'skills'),
};
// ── SKILL.md frontmatter parser ────────────────────────────────
/** Extract name+description from a SKILL.md file's YAML frontmatter */
function parseSkillFrontmatter(content) {
    const result = {};
    // Match --- delimited YAML frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)/);
    if (!fmMatch)
        return result;
    const fm = fmMatch[1];
    // name: <value>
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    if (nameMatch)
        result.name = nameMatch[1].trim();
    // description: <value>  (single-line)
    // description: |\n  <multiline>  (block scalar)
    const blockMatch = fm.match(/^description:\s*\|\n((?:\s{2,}.*(?:\n|$))*)/m);
    if (blockMatch) {
        result.description = blockMatch[1]
            .split('\n')
            .map((l) => l.replace(/^\s{2,}/, '').trim())
            .filter(Boolean)
            .join(' ')
            .trim();
    }
    else {
        const descMatch = fm.match(/^description:\s*(.+)$/m);
        if (descMatch)
            result.description = descMatch[1].trim();
    }
    return result;
}
/** Build a one-line description from an MCP server config */
function describeMcp(name, cfg) {
    if (cfg.type === 'remote') {
        return `Remote MCP server: ${cfg.url ?? 'unknown URL'}`;
    }
    const cmd = cfg.command;
    if (Array.isArray(cmd)) {
        return `Local MCP server: ${cmd.join(' ')}`;
    }
    return `MCP server: ${name}`;
}
// ═══════════════════════════════════════════════════════════════
//  M C P   S K I L L   C A T A L O G
// ═══════════════════════════════════════════════════════════════
export class McpSkillCatalog {
    options;
    entries = [];
    constructor(options) {
        this.options = options;
        this.initialize();
    }
    // ── Initialization ──────────────────────────────────────────
    initialize() {
        // 1. Load MCP servers from user config (or fallback defaults)
        const userMcps = this.readUserConfig();
        if (userMcps.length > 0) {
            this.entries.push(...userMcps);
        }
        else {
            this.loadDefaultMcps();
        }
        // 2. Load skills from disk (or fallback defaults)
        const userSkills = this.scanUserSkills();
        if (userSkills.length > 0) {
            this.entries.push(...userSkills);
        }
        else {
            this.loadDefaultSkills();
        }
        // 3. Always load conceptual builtins
        this.loadBuiltins();
    }
    // ── Public API ──────────────────────────────────────────────
    getAll() {
        return [...this.entries];
    }
    findByTrigger(text) {
        const lower = text.toLowerCase();
        return this.entries.filter((entry) => entry.triggers.some((t) => lower.includes(t)) ||
            entry.name.toLowerCase().includes(lower) ||
            entry.description.toLowerCase().includes(lower));
    }
    findByCategory(cat) {
        return this.entries.filter((entry) => entry.category === cat);
    }
    toMarkdown() {
        const groups = new Map();
        for (const entry of this.entries) {
            const group = groups.get(entry.category) ?? [];
            group.push(entry);
            groups.set(entry.category, group);
        }
        const header = `# Available Tools & Skills\n\n_Automatically generated from McpSkillCatalog — ${this.entries.length} entries_\n\n`;
        const sections = [];
        for (const [category, items] of groups) {
            sections.push(`## ${category}\n`);
            for (const item of items) {
                const triggers = item.triggers.map((t) => `\`${t}\``).join(', ');
                const serverLine = item.serverName ? ` (server: \`${item.serverName}\`)` : '';
                // Prefix discovered entries so users can distinguish them from defaults
                let prefix = '';
                if (item.source === 'discovered') {
                    prefix = item.category === 'mcp' ? '📡 ' : '🔧 ';
                }
                sections.push(`- ${prefix}**${item.name}**${serverLine}: ${item.description}`);
                if (item.triggers.length > 0) {
                    sections.push(`  - Triggers: ${triggers}`);
                }
            }
            sections.push('');
        }
        return header + sections.join('\n');
    }
    generateTaskSuggestions(description) {
        const matched = this.findByTrigger(description);
        if (matched.length === 0) {
            return `No specific tools matched "${description}". Consider using:\n- \`/browse\` for web-related tasks\n- \`/qa\` for testing\n- \`code-review-graph\` for code analysis\n- \`delegate_task\` for parallel sub-agents`;
        }
        const lines = [`Based on "${description}", consider these tools:\n`];
        for (const entry of matched.slice(0, 5)) {
            const badge = entry.category === 'mcp' ? 'MCP' : entry.category === 'gstack-skill' ? 'GSKILL' : 'BUILTIN';
            lines.push(`- [${badge}] **${entry.name}**: ${entry.description}`);
        }
        if (matched.length > 5) {
            lines.push(`\n_… and ${matched.length - 5} more matches_`);
        }
        return lines.join('\n');
    }
    // ── User config reading (MCP servers) ───────────────────────
    configPath() {
        return this.options?.opencodeConfigPath ?? DEFAULT_PATHS.opencodeConfig;
    }
    /**
     * Read MCP servers from the user's opencode.json.
     * Returns an empty array if the file doesn't exist or has no MCP section.
     */
    readUserConfig() {
        const configPath = this.configPath();
        try {
            if (!existsSync(configPath))
                return [];
            const raw = readFileSync(configPath, 'utf-8');
            const config = JSON.parse(raw);
            const mcpSection = config.mcp;
            if (!mcpSection || typeof mcpSection !== 'object')
                return [];
            const entries = [];
            for (const [name, cfg] of Object.entries(mcpSection)) {
                if (typeof cfg !== 'object' || cfg === null)
                    continue;
                if (cfg.enabled === false)
                    continue;
                entries.push({
                    category: 'mcp',
                    name,
                    description: describeMcp(name, cfg),
                    triggers: [
                        name.toLowerCase(),
                        ...name.split(/[-_\s.]+/).filter(Boolean).map((s) => s.toLowerCase()),
                    ],
                    serverName: name,
                    source: 'discovered',
                });
            }
            return entries;
        }
        catch {
            return [];
        }
    }
    // ── Skill scanning ──────────────────────────────────────────
    skillsPaths() {
        return {
            opencode: this.options?.opencodeSkillsPath ?? DEFAULT_PATHS.opencodeSkills,
            claude: this.options?.claudeSkillsPath ?? DEFAULT_PATHS.claudeSkills,
        };
    }
    /**
     * Scan the user's skill directories on disk.
     * Returns discovered CatalogEntry[] or empty array if nothing found.
     */
    scanUserSkills() {
        const { opencode, claude } = this.skillsPaths();
        const entries = [];
        entries.push(...this.scanSkillDir(opencode, 'gstack-skill'));
        entries.push(...this.scanSkillDir(claude, 'builtin'));
        return entries;
    }
    scanSkillDir(dirPath, category) {
        try {
            if (!existsSync(dirPath))
                return [];
            if (!statSync(dirPath).isDirectory())
                return [];
            const entries = [];
            const items = readdirSync(dirPath);
            for (const item of items) {
                // Skip hidden files, node_modules, .git
                if (item.startsWith('.') || item === 'node_modules' || item === '.git')
                    continue;
                const fullPath = join(dirPath, item);
                let stat;
                try {
                    stat = statSync(fullPath);
                }
                catch {
                    continue;
                }
                if (!stat.isDirectory())
                    continue;
                const skillMdPath = join(fullPath, 'SKILL.md');
                let name = item;
                let description = `${item} — a ${category.replace('-', ' ')}`;
                const triggers = [item.toLowerCase()];
                if (existsSync(skillMdPath)) {
                    try {
                        const content = readFileSync(skillMdPath, 'utf-8');
                        const parsed = parseSkillFrontmatter(content);
                        if (parsed.name)
                            name = parsed.name;
                        if (parsed.description)
                            description = parsed.description;
                    }
                    catch {
                        // fall through to defaults
                    }
                }
                entries.push({
                    category,
                    name,
                    description,
                    triggers: [...new Set([...triggers, ...name.toLowerCase().split(/[-_\s.]+/).filter(Boolean)])],
                    source: 'discovered',
                });
            }
            return entries;
        }
        catch {
            return [];
        }
    }
    // ── Default entries (fallback when user config/skills unavailable) ──
    addEntry(entry) {
        // Only used by defaults — all forced to 'default' source
        this.entries.push({ ...entry, source: 'default' });
    }
    loadDefaultMcps() {
        this.addEntry({
            category: 'mcp',
            name: 'clawdi',
            description: 'Cross-agent long-term memory: preferences, coding habits, named entities, past bugs, architecture decisions',
            triggers: ['memory', 'remember', 'past session', 'preferences', 'what do I usually', 'like last time'],
            serverName: 'clawdi',
        });
        this.addEntry({
            category: 'mcp',
            name: 'gbrain',
            description: 'Persistent knowledge brain: query, store, search across pages, facts, takes, timeline',
            triggers: ['knowledge', 'search brain', 'stored info', 'gbrain', 'what do I know about'],
            serverName: 'gbrain',
        });
        this.addEntry({
            category: 'mcp',
            name: 'code-review-graph',
            description: 'Code knowledge graph: communities, impact, flows, architecture analysis, dependency traversal',
            triggers: ['architecture', 'code structure', 'dependencies', 'communities', 'impact analysis', 'code graph'],
            serverName: 'code-review-graph',
        });
        this.addEntry({
            category: 'mcp',
            name: 'gitnexus',
            description: 'Cross-repo code search, impact analysis, symbol context, API route mapping',
            triggers: ['cross-repo', 'code search', 'impact analysis', 'symbol lookup', 'git nexus'],
            serverName: 'gitnexus',
        });
        this.addEntry({
            category: 'mcp',
            name: 'context7',
            description: 'Up-to-date library & framework documentation with code examples',
            triggers: ['docs', 'api reference', 'library', 'documentation for', 'how to use'],
            serverName: 'context7',
        });
        this.addEntry({
            category: 'mcp',
            name: 'exa',
            description: 'Web search and page fetch with clean markdown extraction',
            triggers: ['web search', 'find online', 'look up', 'search the internet', 'current information'],
            serverName: 'exa',
        });
        this.addEntry({
            category: 'mcp',
            name: 'deepwiki',
            description: 'GitHub repository documentation reader',
            triggers: ['github docs', 'repo docs', 'repository documentation'],
            serverName: 'deepwiki',
        });
        this.addEntry({
            category: 'mcp',
            name: 'loom-mcp',
            description: 'Personal vault and knowledge base query engine',
            triggers: ['vault', 'notes', 'personal knowledge', 'loom'],
            serverName: 'loom-mcp',
        });
        this.addEntry({
            category: 'mcp',
            name: 'openspace',
            description: 'Skill execution and search across local and cloud registries',
            triggers: ['execute skill', 'run skill', 'openspace'],
            serverName: 'openspace',
        });
        this.addEntry({
            category: 'mcp',
            name: 'agent-browser',
            description: 'Browser automation: navigate, fill forms, screenshot, scrape',
            triggers: ['browse', 'screenshot', 'test page', 'open website', 'automate browser'],
            serverName: 'agent-browser',
        });
        this.addEntry({
            category: 'mcp',
            name: 'gh_grep',
            description: 'Search public GitHub repositories for real-world code examples',
            triggers: ['github code search', 'find code example', 'search github'],
            serverName: 'gh_grep',
        });
        this.addEntry({
            category: 'mcp',
            name: 'sequential-thinking',
            description: 'Structured multi-step reasoning for complex problems',
            triggers: ['reasoning', 'step by step', 'complex problem', 'think through'],
            serverName: 'sequential-thinking',
        });
        this.addEntry({
            category: 'mcp',
            name: 'context-mode',
            description: 'Execute and analyze code/data in sandbox, search indexed knowledge',
            triggers: ['run code', 'analyze data', 'process output', 'context mode'],
            serverName: 'context-mode',
        });
        this.addEntry({
            category: 'mcp',
            name: 'codex',
            description: 'OpenAI Codex CLI wrapper: review, challenge, consult',
            triggers: ['second opinion', 'codex review', 'ask codex', 'consult codex'],
            serverName: 'codex',
        });
    }
    loadDefaultSkills() {
        this.addEntry({
            category: 'gstack-skill',
            name: 'qa',
            description: 'Systematic QA testing with bug fixing',
            triggers: ['qa', 'test site', 'find bugs', 'test and fix'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'browse',
            description: 'Fast headless browser for QA, screenshots, page verification',
            triggers: ['open in browser', 'test site', 'screenshot', 'dogfood'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'ship',
            description: 'Merge, bump version, update changelog, create PR',
            triggers: ['ship', 'deploy', 'create pr', 'merge and push'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'review',
            description: 'Pre-landing PR review for structural issues',
            triggers: ['review pr', 'code review', 'check diff', 'pre-landing'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'cso',
            description: 'Chief Security Officer: infrastructure audit, secrets, dependencies',
            triggers: ['security audit', 'threat model', 'pentest', 'owasp'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'investigate',
            description: 'Systematic debugging with root cause analysis',
            triggers: ['debug', 'fix bug', 'root cause', 'investigate error'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'design-review',
            description: 'Visual QA: spacing, hierarchy, consistency fixes',
            triggers: ['audit design', 'visual qa', 'design polish', 'check looks'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'health',
            description: 'Code quality dashboard with weighted composite score',
            triggers: ['health check', 'code quality', 'quality score', 'run all checks'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'canary',
            description: 'Post-deploy monitoring: console errors, perf regressions',
            triggers: ['monitor deploy', 'canary', 'post-deploy check', 'verify deploy'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'scrape',
            description: 'Web scraping with codified browser-skill caching',
            triggers: ['scrape', 'get data from', 'extract from', 'pull data'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'claude',
            description: 'Claude Code CLI: independent diff review, adversarial challenge',
            triggers: ['claude review', 'claude challenge', 'ask claude', 'outside voice'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'codex',
            description: 'Codex CLI wrapper: adversarial review',
            triggers: ['codex review', 'second opinion', 'consult codex'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'office-hours',
            description: 'YC Office Hours: demand validation, brainstorming',
            triggers: ['brainstorm', 'idea validation', 'office hours', 'think through idea'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'design-consultation',
            description: 'Full design system: aesthetic, typography, color, layout',
            triggers: ['design system', 'brand guidelines', 'create design'],
        });
        this.addEntry({
            category: 'gstack-skill',
            name: 'design-shotgun',
            description: 'Multiple AI design variants with comparison board',
            triggers: ['explore designs', 'show options', 'design variants', 'visual brainstorm'],
        });
    }
    loadBuiltins() {
        this.addEntry({
            category: 'builtin',
            name: 'delegate_task',
            description: 'Spawn background sub-agents for parallel work',
            triggers: ['delegate', 'background task', 'parallel work', 'subagent'],
        });
        this.addEntry({
            category: 'builtin',
            name: 'council',
            description: 'Multi-LLM consensus-based analysis session',
            triggers: ['council', 'multi-model', 'consensus', 'multiple opinions'],
        });
        this.addEntry({
            category: 'builtin',
            name: 'subtask',
            description: 'Break work into sequential subtasks with dependencies',
            triggers: ['subtask', 'break down', 'sequential steps'],
        });
        this.addEntry({
            category: 'builtin',
            name: 'smartfetch',
            description: 'Intelligent web fetching with content extraction',
            triggers: ['fetch url', 'get webpage', 'smart fetch'],
        });
        this.addEntry({
            category: 'builtin',
            name: 'ast-grep',
            description: 'AST-aware code search, replace, and refactoring',
            triggers: ['ast search', 'pattern replace', 'code transformation'],
        });
    }
}
//# sourceMappingURL=mcp-skill-catalog.js.map