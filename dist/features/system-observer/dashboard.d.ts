import type { SystemObserver } from './observer';
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
export declare class ObserverDashboard {
    private observer;
    constructor(observer: SystemObserver);
    /**
     * Generate a terminal-formatted health report snapshot.
     * Reads the latest status from the observer and renders it as
     * a box-drawn table with overall status, components, metrics,
     * warnings, errors, and agent activity.
     */
    render(): string;
    /**
     * Convenience: render and log the dashboard in one call.
     */
    print(): void;
}
//# sourceMappingURL=dashboard.d.ts.map