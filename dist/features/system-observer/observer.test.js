import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { SystemObserver } from './observer';
describe('SystemObserver', () => {
    let observer;
    beforeEach(() => {
        observer = new SystemObserver();
    });
    afterEach(() => {
        observer.stop();
    });
    // ── 1. Default config ───────────────────────────────────────────────
    it('creates an observer with default config and registers all components', () => {
        const o = new SystemObserver();
        expect(o).toBeInstanceOf(SystemObserver);
        // getStatus should list all registered components
        const report = o.getStatus();
        expect(report.components).toHaveLength(7);
        const names = report.components.map((c) => c.name).sort();
        expect(names).toEqual([
            'divoom',
            'mcp-bus',
            'openclaw',
            'persistent-task-engine',
            'plugin-bootstrap',
            'task-registry',
            'tool-use-enforcer',
        ]);
    });
    // ── 2. runHealthCheck returns SystemReport with all components ───────
    it('runHealthCheck returns a SystemReport with all components', async () => {
        const report = await observer.runHealthCheck();
        expect(report).toBeDefined();
        expect(report.timestamp).toBeGreaterThan(0);
        expect(report.components).toHaveLength(7);
        expect(['healthy', 'degraded', 'critical']).toContain(report.overall);
        expect(typeof report.runningTasks).toBe('number');
        expect(typeof report.connectedMcps).toBe('number');
        expect(Array.isArray(report.warnings)).toBe(true);
        expect(Array.isArray(report.errors)).toBe(true);
    });
    // ── 3. Start begins interval checks ─────────────────────────────────
    it('start begins periodic health checks', async () => {
        expect(observer.isRunning).toBe(false);
        observer.start();
        expect(observer.isRunning).toBe(true);
        // Give it a tick to run the initial check
        await new Promise((r) => setTimeout(r, 50));
        const report = observer.getStatus();
        // After start(), components should have been checked
        expect(report.components.every((c) => c.lastCheck > 0)).toBe(true);
    });
    // ── 4. Stop clears interval ─────────────────────────────────────────
    it('stop clears the health check interval', () => {
        observer.start();
        expect(observer.isRunning).toBe(true);
        observer.stop();
        expect(observer.isRunning).toBe(false);
    });
    // ── 5. reportWarning adds to warnings ───────────────────────────────
    it('reportWarning appends to the warnings collection', () => {
        observer.reportWarning('mcp-bus', 'slow response time');
        observer.reportWarning('divoom', 'display lag');
        const report = observer.getStatus();
        expect(report.warnings).toHaveLength(2);
        expect(report.warnings[0]).toContain('mcp-bus');
        expect(report.warnings[0]).toContain('slow response time');
        expect(report.warnings[1]).toContain('divoom');
    });
    // ── 6. reportError adds to errors ──────────────────────────────────
    it('reportError appends to the errors collection', () => {
        observer.reportError('plugin-bootstrap', 'failed to load config');
        observer.reportError('task-registry', 'SQLite query timeout');
        const report = observer.getStatus();
        expect(report.errors).toHaveLength(2);
        expect(report.errors[0]).toContain('plugin-bootstrap');
        expect(report.errors[1]).toContain('task-registry');
    });
    // ── 7. recordAgentActivity tracks agent ─────────────────────────────
    it('recordAgentActivity updates agent lastActive timestamp', () => {
        observer.recordAgentActivity('sif');
        observer.recordAgentActivity('builder');
        const report = observer.getStatus();
        expect(report.agentActivity['sif']).toBeDefined();
        expect(report.agentActivity['builder']).toBeDefined();
        expect(report.agentActivity['sif'].lastActive).toBeGreaterThan(0);
        expect(report.agentActivity['sif'].tasksCompleted).toBe(0);
    });
    // ── 8. recordTaskCompletion increments tasks ────────────────────────
    it('recordTaskCompletion decrements runningTasks and records for agent', () => {
        observer.recordTaskLaunch();
        observer.recordTaskLaunch();
        expect(observer.getStatus().runningTasks).toBe(2);
        observer.recordTaskCompletion('sif');
        expect(observer.getStatus().runningTasks).toBe(1);
        const activity = observer.getStatus().agentActivity['sif'];
        expect(activity).toBeDefined();
        expect(activity.tasksCompleted).toBe(1);
    });
    // ── 9. getStatus returns current snapshot ──────────────────────────
    it('getStatus returns the last known state without I/O', () => {
        observer.reportWarning('divoom', 'test warning');
        observer.reportError('mcp-bus', 'test error');
        observer.recordAgentActivity('eir');
        observer.recordTaskLaunch();
        const report = observer.getStatus();
        expect(report.timestamp).toBeGreaterThan(0);
        expect(report.warnings).toHaveLength(1);
        expect(report.errors).toHaveLength(1);
        expect(report.agentActivity['eir']).toBeDefined();
        expect(report.runningTasks).toBe(1);
    });
    // ── 10. Component status degrades after repeated errors ────────────
    it('degrades a component after reportError when previously healthy', async () => {
        // First run a health check to populate the health map with 'healthy' status
        await observer.runHealthCheck();
        let health = observer.getRawHealth();
        let divoomHealth = health.get('divoom');
        expect(divoomHealth).toBeDefined();
        expect(divoomHealth.status).toBe('healthy');
        // Report an error — should degrade the component
        observer.reportError('divoom', 'connection lost');
        health = observer.getRawHealth();
        divoomHealth = health.get('divoom');
        expect(divoomHealth).toBeDefined();
        expect(divoomHealth.status).toBe('degraded');
        expect(divoomHealth.lastError).toBe('connection lost');
        // Verify the raw error queue too
        const rawErrors = observer.getRawErrors();
        expect(rawErrors).toHaveLength(1);
        expect(rawErrors[0].component).toBe('divoom');
        expect(rawErrors[0].error).toBe('connection lost');
    });
    it('records multiple degraded components correctly', () => {
        observer.reportError('divoom', 'connection lost');
        observer.reportError('mcp-bus', 'timeout');
        const report = observer.getStatus();
        expect(report.errors).toHaveLength(2);
        // Verify via raw access
        const rawErrors = observer.getRawErrors();
        expect(rawErrors).toHaveLength(2);
        expect(rawErrors[0].component).toBe('divoom');
        expect(rawErrors[1].component).toBe('mcp-bus');
    });
    // ── 11. Custom component registration ────────────────────────────────
    it('allows registering custom component health checks', async () => {
        const customCheck = () => ({
            name: 'custom-db',
            status: 'degraded',
            lastCheck: Date.now(),
            lastError: 'connection pool at 90%',
            details: { poolUsage: 0.9 },
        });
        observer.register('custom-db', customCheck);
        const report = await observer.runHealthCheck();
        const dbHealth = report.components.find((c) => c.name === 'custom-db');
        expect(dbHealth).toBeDefined();
        expect(dbHealth.status).toBe('degraded');
        expect(dbHealth.lastError).toBe('connection pool at 90%');
        expect(dbHealth.details).toEqual({ poolUsage: 0.9 });
    });
    // ── 12. Event callbacks fire on status transitions ──────────────────
    it('fires onStatusChange when a component transitions', async () => {
        const transitions = [];
        const o = new SystemObserver({
            events: {
                onStatusChange: (component, from, to) => {
                    transitions.push({ component, from, to });
                },
            },
        });
        // Force a degradation
        o.reportError('divoom', 'connection lost');
        // Manually set a component to down via reportError after it was healthy
        // Start the observer so it runs checks
        await o.runHealthCheck();
        // Now degrade
        o.reportError('divoom', 'connection lost again');
        // There should be at least one transition event
        expect(transitions.length).toBeGreaterThanOrEqual(1);
        o.stop();
    });
    // ── 13. recordTaskLaunch increments runningTasks ─────────────────────
    it('recordTaskLaunch increments the running task counter', () => {
        expect(observer.getStatus().runningTasks).toBe(0);
        observer.recordTaskLaunch();
        expect(observer.getStatus().runningTasks).toBe(1);
        observer.recordTaskLaunch();
        observer.recordTaskLaunch();
        expect(observer.getStatus().runningTasks).toBe(3);
    });
    // ── 14. setConnectedMcps sets the MCP count ─────────────────────────
    it('setConnectedMcps updates the connected MCP count', () => {
        expect(observer.getStatus().connectedMcps).toBe(0);
        observer.setConnectedMcps(5);
        expect(observer.getStatus().connectedMcps).toBe(5);
        observer.setConnectedMcps(13);
        expect(observer.getStatus().connectedMcps).toBe(13);
    });
    // ── 15. Multiple components degrade independently ───────────────────
    it('handles multiple components degrading independently', () => {
        observer.reportError('plugin-bootstrap', 'config parse error');
        observer.reportError('task-registry', 'disk full');
        const report = observer.getStatus();
        expect(report.errors).toHaveLength(2);
        expect(report.errors[0]).toContain('plugin-bootstrap');
        expect(report.errors[1]).toContain('task-registry');
        // Each error should be in the raw queue with correct component
        const rawErrors = observer.getRawErrors();
        expect(rawErrors[0].component).toBe('plugin-bootstrap');
        expect(rawErrors[1].component).toBe('task-registry');
    });
    // ── 16. Health map is accessible via getRawHealth ───────────────────
    it('getRawHealth returns the internal health map', async () => {
        await observer.runHealthCheck();
        const health = observer.getRawHealth();
        expect(health.size).toBeGreaterThanOrEqual(7);
        const pluginHealth = health.get('plugin-bootstrap');
        expect(pluginHealth).toBeDefined();
        expect(pluginHealth.lastCheck).toBeGreaterThan(0);
    });
    // ── 17. Agent activity map is accessible via getRawAgentActivity ────
    it('getRawAgentActivity returns the internal agent activity map', () => {
        observer.recordAgentActivity('tester');
        observer.recordTaskCompletion('tester');
        const activity = observer.getRawAgentActivity();
        expect(activity.has('tester')).toBe(true);
        expect(activity.get('tester').tasksCompleted).toBe(1);
        expect(activity.get('tester').lastActive).toBeGreaterThan(0);
    });
    // ── 18. Stop is idempotent ──────────────────────────────────────────
    it('stop is idempotent (calling multiple times does not throw)', () => {
        expect(() => {
            observer.stop();
            observer.stop();
            observer.stop();
        }).not.toThrow();
    });
    // ── 19. start is idempotent (multiple calls do not stack intervals) ──
    it('start is idempotent (multiple calls do not stack intervals)', () => {
        observer.start();
        observer.start();
        observer.start();
        expect(observer.isRunning).toBe(true);
        observer.stop();
        expect(observer.isRunning).toBe(false);
    });
    // ── 20. Overall status reflects worst component ─────────────────────
    it('overall status is critical when any component is down', async () => {
        // Register a component that always returns 'down'
        const alwaysDown = () => ({
            name: 'failing-component',
            status: 'down',
            lastCheck: Date.now(),
            lastError: 'catastrophic failure',
        });
        observer.register('failing-component', alwaysDown);
        const report = await observer.runHealthCheck();
        expect(report.overall).toBe('critical');
    });
});
//# sourceMappingURL=observer.test.js.map