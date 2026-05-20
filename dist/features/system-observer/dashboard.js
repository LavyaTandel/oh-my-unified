/**
 * ObserverDashboard — renders a real-time terminal-formatted health report
 * from the SystemObserver.
 *
 * Usage:
 * ```ts
 * const observer = new SystemObserver()
 * const dashboard = new ObserverDashboard(observer)
 * console.log(dashboard.render())
 * ```
 */
export class ObserverDashboard {
    observer;
    constructor(observer) {
        this.observer = observer;
    }
    /**
     * Generate a terminal-formatted health report snapshot.
     * Reads the latest status from the observer and renders it as
     * a box-drawn table with overall status, components, metrics,
     * warnings, errors, and agent activity.
     */
    render() {
        const status = this.observer.getStatus();
        const lines = [];
        // ── Header ────────────────────────────────────────────────────────
        lines.push('┌─────────────────────────────────────────────────────────────┐');
        lines.push('│           oh-my-unified — System Health Dashboard          │');
        lines.push('├─────────────────────────────────────────────────────────────┤');
        // ── Overall status ─────────────────────────────────────────────────
        const icon = status.overall === 'healthy' ? '✅' : status.overall === 'degraded' ? '⚠️' : '❌';
        lines.push(`│  ${icon} Overall: ${status.overall.toUpperCase().padEnd(38)} │`);
        const timeStr = new Date(status.timestamp).toLocaleTimeString();
        lines.push(`│  🕐 ${timeStr.padEnd(47)} │`);
        lines.push('├─────────────────────────────────────────────────────────────┤');
        // ── Components ─────────────────────────────────────────────────────
        lines.push('│  Components:                                               │');
        for (const comp of status.components) {
            const cIcon = comp.status === 'healthy' ? '✅' : comp.status === 'degraded' ? '⚠️' : '❌';
            const namePadded = comp.name.padEnd(28);
            const statusPadded = comp.status.padEnd(10);
            lines.push(`│  ${cIcon} ${namePadded} ${statusPadded}            │`);
        }
        // ── Metrics ────────────────────────────────────────────────────────
        lines.push('├─────────────────────────────────────────────────────────────┤');
        const tasksStr = `Tasks: ${String(status.runningTasks).padStart(3)} running`;
        const mcpsStr = `${String(status.connectedMcps).padStart(2)} MCPs connected`;
        const agStr = status.agentActivity
            ? `${Object.keys(status.agentActivity).length} agents active`
            : '0 agents active';
        lines.push(`│  📊 ${tasksStr.padEnd(22)} ${mcpsStr.padEnd(20)} │`);
        lines.push(`│  🤖 ${agStr.padEnd(46)} │`);
        // ── Agent activity (detail) ────────────────────────────────────────
        const agentEntries = Object.entries(status.agentActivity ?? {});
        if (agentEntries.length > 0) {
            lines.push('│─────────────────────────────────────────────────────────────│');
            for (const [agent, data] of agentEntries) {
                const lastActive = new Date(data.lastActive).toLocaleTimeString();
                lines.push(`│  🤖 ${agent.padEnd(18)} last: ${lastActive.padEnd(10)} tasks: ${String(data.tasksCompleted).padStart(3)}    │`);
            }
        }
        // ── Warnings / Errors ──────────────────────────────────────────────
        if (status.warnings.length > 0 || status.errors.length > 0) {
            lines.push('├─────────────────────────────────────────────────────────────┤');
            if (status.warnings.length > 0) {
                lines.push(`│  ⚠️  Warnings: ${String(status.warnings.length).padStart(2)}                                    │`);
                const maxWarnings = Math.min(status.warnings.length, 3);
                for (let i = 0; i < maxWarnings; i++) {
                    const w = status.warnings[i].slice(0, 43);
                    lines.push(`│      ${w.padEnd(45)} │`);
                }
                if (status.warnings.length > 3) {
                    lines.push(`│      (... and ${status.warnings.length - 3} more)                     │`);
                }
            }
            if (status.errors.length > 0) {
                lines.push(`│  ❌ Errors: ${String(status.errors.length).padStart(2)}                                      │`);
                const maxErrors = Math.min(status.errors.length, 3);
                for (let i = 0; i < maxErrors; i++) {
                    const e = status.errors[i].slice(0, 43);
                    lines.push(`│      ${e.padEnd(45)} │`);
                }
                if (status.errors.length > 3) {
                    lines.push(`│      (... and ${status.errors.length - 3} more)                     │`);
                }
            }
        }
        // ── Footer ─────────────────────────────────────────────────────────
        lines.push('└─────────────────────────────────────────────────────────────┘');
        return lines.join('\n');
    }
    /**
     * Convenience: render and log the dashboard in one call.
     */
    print() {
        console.log(this.render());
    }
}
//# sourceMappingURL=dashboard.js.map