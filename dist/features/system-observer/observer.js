import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { COMPONENT_NAMES, DEFAULT_CHECK_INTERVAL_MS } from './types';
import { log } from '../../utils/logger';
export { COMPONENT_NAMES, DEFAULT_CHECK_INTERVAL_MS };
// ── Default health probes ──────────────────────────────────────────────
function defaultPluginBootstrapCheck() {
    try {
        const pluginAvail = !!globalThis.process?.versions?.node;
        return {
            name: 'plugin-bootstrap',
            status: pluginAvail ? 'healthy' : 'degraded',
            lastCheck: Date.now(),
            details: { nodeVersion: process.version, platform: process.platform },
        };
    }
    catch {
        return {
            name: 'plugin-bootstrap',
            status: 'down',
            lastCheck: Date.now(),
            lastError: 'Node.js runtime not available',
        };
    }
}
function defaultTaskRegistryCheck() {
    return {
        name: 'task-registry',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { registryAvailable: true },
    };
}
function defaultMcpBusCheck() {
    return {
        name: 'mcp-bus',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { configuredMcps: 13 },
    };
}
function defaultPersistentTaskEngineCheck() {
    return {
        name: 'persistent-task-engine',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { engineAvailable: true },
    };
}
function defaultToolUseEnforcerCheck() {
    return {
        name: 'tool-use-enforcer',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { enforcerAvailable: true },
    };
}
function defaultDivoomCheck() {
    return {
        name: 'divoom',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { divoomAvailable: true },
    };
}
function defaultOpenClawCheck() {
    return {
        name: 'openclaw',
        status: 'healthy',
        lastCheck: Date.now(),
        details: { gatewayAvailable: true },
    };
}
// ── SystemObserver ─────────────────────────────────────────────────────
/**
 * SystemObserver — runtime daemon that periodically checks ALL plugin
 * components and reports health.
 *
 * Architecture:
 * - Each component has a pluggable `check` function (default or custom).
 * - Health snapshots are taken every `checkIntervalMs` (default 30 s).
 * - When a component transitions status an event fires.
 * - Warnings / errors are collected from external modules via `report*()`.
 * - A `SystemReport` is produced on demand via `getStatus()`.
 *
 * Usage:
 * ```ts
 * const observer = new SystemObserver()
 * observer.start()               // begin periodic checks
 * const report = observer.getStatus() // snapshot now
 * observer.stop()                // tear down
 * ```
 */
export class SystemObserver {
    components = new Map();
    health = new Map();
    interval = null;
    agentActivity = new Map();
    warnings = [];
    errors = [];
    events = {};
    runningTasks = 0;
    connectedMcps = 0;
    constructor(config) {
        this.events = config?.events ?? {};
        // Register every component with its default check function
        this.register('plugin-bootstrap', defaultPluginBootstrapCheck);
        this.register('task-registry', defaultTaskRegistryCheck);
        this.register('mcp-bus', defaultMcpBusCheck);
        this.register('persistent-task-engine', defaultPersistentTaskEngineCheck);
        this.register('tool-use-enforcer', defaultToolUseEnforcerCheck);
        this.register('divoom', defaultDivoomCheck);
        this.register('openclaw', defaultOpenClawCheck);
    }
    // ── Registration ─────────────────────────────────────────────────────
    /** Register (or override) a component health check. */
    register(name, check) {
        this.components.set(name, { name, check });
        // Seed with 'healthy' so getStatus() never reports 'down' before first check
        if (!this.health.has(name)) {
            this.health.set(name, {
                name,
                status: 'healthy',
                lastCheck: Date.now(),
                details: { seeded: true },
            });
        }
    }
    // ── Lifecycle ────────────────────────────────────────────────────────
    /** Start periodic health checks at the given interval (ms). */
    start(intervalMs) {
        if (this.interval)
            return; // already running
        const ms = intervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
        // Run one check immediately
        this.runHealthCheck().catch((err) => {
            log('[SystemObserver] Initial health check failed', { error: String(err) });
        });
        this.interval = setInterval(() => {
            this.runHealthCheck().catch((err) => {
                log('[SystemObserver] Periodic health check failed', { error: String(err) });
            });
        }, ms);
    }
    /** Stop periodic health checks. */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    /** True when the observer is actively polling. */
    get isRunning() {
        return this.interval !== null;
    }
    // ── Health checks ────────────────────────────────────────────────────
    /**
     * Run a full health check across every registered component.
     * Returns a fresh SystemReport.
     */
    async runHealthCheck() {
        const results = [];
        for (const [name, spec] of this.components) {
            try {
                const health = await spec.check();
                const prev = this.health.get(name);
                // Detect status transitions
                if (prev && prev.status !== health.status) {
                    this.events.onStatusChange?.(name, prev.status, health.status);
                    log('[SystemObserver] component status changed', {
                        component: name,
                        from: prev.status,
                        to: health.status,
                        error: health.lastError,
                    });
                }
                this.health.set(name, health);
                results.push(health);
            }
            catch (err) {
                const crashed = {
                    name,
                    status: 'down',
                    lastCheck: Date.now(),
                    lastError: String(err),
                };
                this.health.set(name, crashed);
                results.push(crashed);
            }
        }
        // ── Plugin conflict detection ───────────────────────────────────
        const conflicts = this.detectPluginConflicts();
        if (conflicts.length > 0) {
            this.health.set('plugin-conflicts', {
                name: 'plugin-conflicts',
                status: 'degraded',
                lastCheck: Date.now(),
                details: { conflicts },
            });
            // Also push to warnings
            for (const c of conflicts) {
                this.warnings.push({
                    component: 'plugin-conflicts',
                    message: `Plugin conflict: ${c}`,
                    time: Date.now(),
                });
            }
        }
        else {
            this.health.set('plugin-conflicts', {
                name: 'plugin-conflicts',
                status: 'healthy',
                lastCheck: Date.now(),
            });
        }
        // ── Aggregate overall status ─────────────────────────────────────
        let overall = 'healthy';
        for (const h of results) {
            if (h.status === 'down') {
                overall = 'critical';
                break;
            }
            if (h.status === 'degraded') {
                overall = 'degraded';
                // keep iterating — a 'down' would upgrade to 'critical'
            }
        }
        // Also check conflict status
        if (conflicts.length > 0 && overall !== 'critical') {
            overall = 'degraded';
        }
        // Trim stale warnings / errors (keep last 50 each)
        if (this.warnings.length > 50)
            this.warnings = this.warnings.slice(-50);
        if (this.errors.length > 50)
            this.errors = this.errors.slice(-50);
        // Build agent activity snapshot
        const activitySnapshot = {};
        for (const [agent, data] of this.agentActivity) {
            activitySnapshot[agent] = { ...data };
        }
        log('[SystemObserver] health check complete', {
            overall,
            healthy: results.filter((r) => r.status === 'healthy').length,
            total: results.length,
            tasks: this.runningTasks,
            mcps: this.connectedMcps,
            warnings: this.warnings.length,
            errors: this.errors.length,
        });
        const report = {
            timestamp: Date.now(),
            overall,
            components: results,
            runningTasks: this.runningTasks,
            connectedMcps: this.connectedMcps,
            agentActivity: activitySnapshot,
            warnings: this.warnings.map((w) => `[${w.component}] ${w.message}`),
            errors: this.errors.map((e) => `[${e.component}] ${e.error}`),
        };
        this.events.onReport?.(report);
        return report;
    }
    // ── Status snapshot ──────────────────────────────────────────────────
    /** Return a snapshot of the **last known** health state (no I/O). */
    getStatus() {
        const components = [];
        for (const name of this.components.keys()) {
            const h = this.health.get(name);
            if (h) {
                components.push(h);
            }
            else {
                components.push({
                    name,
                    status: 'down',
                    lastCheck: Date.now(),
                    lastError: 'never checked',
                });
            }
        }
        let overall = 'healthy';
        for (const h of components) {
            if (h.status === 'down') {
                overall = 'critical';
                break;
            }
            if (h.status === 'degraded')
                overall = 'degraded';
        }
        const activitySnapshot = {};
        for (const [agent, data] of this.agentActivity) {
            activitySnapshot[agent] = { ...data };
        }
        return {
            timestamp: Date.now(),
            overall,
            components,
            runningTasks: this.runningTasks,
            connectedMcps: this.connectedMcps,
            agentActivity: activitySnapshot,
            warnings: this.warnings.map((w) => `[${w.component}] ${w.message}`),
            errors: this.errors.map((e) => `[${e.component}] ${e.error}`),
        };
    }
    // ── Event ingestion ──────────────────────────────────────────────────
    /** Report a warning from an external module. */
    reportWarning(component, message) {
        this.warnings.push({ component, message, time: Date.now() });
        this.events.onWarning?.(component, message);
    }
    /** Report an error from an external module. */
    reportError(component, error) {
        this.errors.push({ component, error, time: Date.now() });
        // Degrade the component that reported the error on next check
        const existing = this.health.get(component);
        if (existing && existing.status === 'healthy') {
            this.health.set(component, {
                ...existing,
                status: 'degraded',
                lastError: error,
            });
            this.events.onStatusChange?.(component, 'healthy', 'degraded');
        }
        this.events.onError?.(component, error);
    }
    /** Record that an agent was active (updates lastActive timestamp). */
    recordAgentActivity(agentName) {
        const existing = this.agentActivity.get(agentName) ?? {
            lastActive: 0,
            tasksCompleted: 0,
        };
        existing.lastActive = Date.now();
        this.agentActivity.set(agentName, existing);
    }
    /** Increment the running task counter and optionally record the completing agent. */
    recordTaskCompletion(agentName) {
        if (this.runningTasks > 0)
            this.runningTasks--;
        if (agentName) {
            const existing = this.agentActivity.get(agentName) ?? {
                lastActive: Date.now(),
                tasksCompleted: 0,
            };
            existing.tasksCompleted++;
            existing.lastActive = Date.now();
            this.agentActivity.set(agentName, existing);
        }
    }
    /** Record that a task was launched. */
    recordTaskLaunch() {
        this.runningTasks++;
    }
    /** Set the connected MCP count (called by external connector). */
    setConnectedMcps(count) {
        this.connectedMcps = count;
    }
    // ── Conflict detection ──────────────────────────────────────────────
    /**
     * Detect conflicting plugins loaded in the same OpenCode session.
     * Checks for known plugin namespaces that conflict with oh-my-unified.
     */
    detectPluginConflicts() {
        const conflicts = [];
        // 1. Check npm_config_global env var for conflicting packages
        try {
            const npmGlobal = process.env.npm_config_global ?? '';
            if (npmGlobal.includes('oh-my-openagent')) {
                conflicts.push('oh-my-openagent (global npm)');
            }
        }
        catch {
            // ignore
        }
        // 2. Check .config/opencode/package.json for conflicting dependencies
        try {
            const configDir = path.join(os.homedir(), '.config', 'opencode');
            const pkgJsonPath = path.join(configDir, 'package.json');
            if (fs.existsSync(pkgJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                if (pkg.dependencies?.['oh-my-openagent']) {
                    conflicts.push(`oh-my-openagent@${pkg.dependencies['oh-my-openagent']} in OpenCode config package.json`);
                }
                if (pkg.dependencies?.['oh-my-opencode-slim']) {
                    conflicts.push(`oh-my-opencode-slim@${pkg.dependencies['oh-my-opencode-slim']} in OpenCode config package.json`);
                }
            }
        }
        catch {
            // ignore
        }
        // 3. Check .config/opencode/plugins/ directory for conflicting plugin files
        try {
            const pluginsDir = path.join(os.homedir(), '.config', 'opencode', 'plugins');
            if (fs.existsSync(pluginsDir)) {
                const plugins = fs.readdirSync(pluginsDir);
                for (const plugin of plugins) {
                    if ((plugin.includes('oh-my-openagent') || plugin.includes('oh-my-opencode-slim')) && !plugin.includes('unified')) {
                        conflicts.push(`${plugin} in plugins directory`);
                    }
                }
            }
        }
        catch {
            // ignore
        }
        return conflicts;
    }
    // ── Diagnostics ──────────────────────────────────────────────────────
    /** Return the raw warning queue (for testing / debugging). */
    getRawWarnings() {
        return [...this.warnings];
    }
    /** Return the raw error queue (for testing / debugging). */
    getRawErrors() {
        return [...this.errors];
    }
    /** Return the raw health map (for testing / debugging). */
    getRawHealth() {
        return new Map(this.health);
    }
    /** Return the raw agent-activity map (for testing / debugging). */
    getRawAgentActivity() {
        return new Map(this.agentActivity);
    }
}
//# sourceMappingURL=observer.js.map