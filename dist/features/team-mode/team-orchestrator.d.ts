import { TeamRegistry } from './team-registry';
import { TeamTaskList } from './task-list';
/**
 * State of a team session lifecycle.
 */
export type TeamSessionState = 'idle' | 'initializing' | 'running' | 'reshaping' | 'tearing-down' | 'terminating' | 'terminated';
/**
 * Configuration for the team orchestrator.
 */
export interface TeamOrchestratorConfig {
    /** Enable immediate teardown on team changes (default: true) */
    enableImmediateTeardown?: boolean;
    /** Enable recreate-to-reshape loop (default: true) */
    enableRecreateToReshape?: boolean;
    /** Delay before reshape after teardown (ms, default: 200) */
    reshapeDelayMs?: number;
}
/**
 * Team orchestrator with immediate teardown and recreate-to-reshape loop.
 *
 * When team composition changes (member added/removed), the orchestrator:
 * 1. Immediately tears down the current team session
 * 2. Waits for the reshape delay
 * 3. Recreates the team session with the new composition
 *
 * This ensures the team layout always matches the current registry state,
 * preventing stale session configurations.
 */
export declare class TeamOrchestrator {
    private registry;
    private taskList;
    private config;
    private state;
    private activeTeams;
    private teardownTimers;
    private reshapeCallbacks;
    constructor(registry: TeamRegistry, taskList: TeamTaskList, config?: TeamOrchestratorConfig);
    getState(): TeamSessionState;
    startTeam(teamId: string): Promise<void>;
    stopTeam(teamId: string): Promise<void>;
    onTeamCompositionChanged(teamId: string): Promise<void>;
    private triggerReshape;
    private teardownTeam;
    private createMemberSession;
    private terminateSession;
    onReshapeComplete(teamId: string, callback: (teamId: string) => void): void;
    private notifyReshapeComplete;
    getActiveTeamSessions(): Map<string, string[]>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=team-orchestrator.d.ts.map