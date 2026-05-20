import type { ComponentHealth, SystemReport, SystemObserverEvents, ComponentName } from './types';
import { COMPONENT_NAMES, DEFAULT_CHECK_INTERVAL_MS } from './types';
export type { ComponentHealth, SystemReport, SystemObserverEvents, ComponentName };
export { COMPONENT_NAMES, DEFAULT_CHECK_INTERVAL_MS };
export type HealthCheckFn = () => ComponentHealth | Promise<ComponentHealth>;
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
export declare class SystemObserver {
    private components;
    private health;
    private interval;
    private agentActivity;
    private warnings;
    private errors;
    private events;
    private runningTasks;
    private connectedMcps;
    constructor(config?: {
        checkIntervalMs?: number;
        events?: SystemObserverEvents;
    });
    /** Register (or override) a component health check. */
    register(name: string, check: HealthCheckFn): void;
    /** Start periodic health checks at the given interval (ms). */
    start(intervalMs?: number): void;
    /** Stop periodic health checks. */
    stop(): void;
    /** True when the observer is actively polling. */
    get isRunning(): boolean;
    /**
     * Run a full health check across every registered component.
     * Returns a fresh SystemReport.
     */
    runHealthCheck(): Promise<SystemReport>;
    /** Return a snapshot of the **last known** health state (no I/O). */
    getStatus(): SystemReport;
    /** Report a warning from an external module. */
    reportWarning(component: string, message: string): void;
    /** Report an error from an external module. */
    reportError(component: string, error: string): void;
    /** Record that an agent was active (updates lastActive timestamp). */
    recordAgentActivity(agentName: string): void;
    /** Increment the running task counter and optionally record the completing agent. */
    recordTaskCompletion(agentName?: string): void;
    /** Record that a task was launched. */
    recordTaskLaunch(): void;
    /** Set the connected MCP count (called by external connector). */
    setConnectedMcps(count: number): void;
    /**
     * Detect conflicting plugins loaded in the same OpenCode session.
     * Checks for known plugin namespaces that conflict with oh-my-unified.
     */
    detectPluginConflicts(): string[];
    /** Return the raw warning queue (for testing / debugging). */
    getRawWarnings(): Array<{
        component: string;
        message: string;
        time: number;
    }>;
    /** Return the raw error queue (for testing / debugging). */
    getRawErrors(): Array<{
        component: string;
        error: string;
        time: number;
    }>;
    /** Return the raw health map (for testing / debugging). */
    getRawHealth(): Map<string, ComponentHealth>;
    /** Return the raw agent-activity map (for testing / debugging). */
    getRawAgentActivity(): Map<string, {
        lastActive: number;
        tasksCompleted: number;
    }>;
}
//# sourceMappingURL=observer.d.ts.map