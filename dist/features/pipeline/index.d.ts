import { KanbanTracker } from '../kanban';
import { WorkflowEngine } from '../workflow-orchestrator/workflow-engine';
import { RoleEnforcer } from '../role-enforcer';
import { TaskRegistry } from '../../persistence';
/**
 * A SubSession represents ANY agent deployed to work autonomously.
 * The user can WATCH what they do but CANNOT interact.
 *
 * Critical rule: ONLY the conductor stays in the main session.
 * EVERY other agent (including other primary agents) gets a sub-session.
 * The conductor WAITS for all sub-sessions to complete before proceeding.
 */
export interface SubSession {
    agentName: string;
    displayName: string;
    sessionId: string;
    taskId: string;
    taskDescription: string;
    status: 'launched' | 'running' | 'completed' | 'failed';
    visible: true;
    result?: string;
    promptInstructions: string;
}
/**
 * Structured delegation task for sub-agents.
 * Mirrors the oh-my-openagent Sisyphus delegation pattern:
 *   What to do, Must do, Must NOT do, QA checks.
 */
export interface DelegatedTask {
    agentName: string;
    objective: string;
    mustDo: string[];
    mustNotDo: string[];
    dependsOn: string[];
    qa: string[];
    reportFormat: string;
}
/**
 * Generate a structured task prompt in the openagent format.
 * Produces a clear sectioned prompt that the sub-agent can follow precisely.
 */
export declare function generateTaskPrompt(task: DelegatedTask): string;
export declare class PipelineOrchestrator {
    private conductor;
    private subSessions;
    private kanban;
    private workflow;
    private roleEnforcer;
    private waitingForSubs;
    private taskRegistry;
    constructor(taskRegistry?: TaskRegistry);
    getKanban(): KanbanTracker;
    getWorkflow(): WorkflowEngine;
    getRoleEnforcer(): RoleEnforcer;
    getSubSessions(): Map<string, SubSession>;
    /**
     * Set who's conducting (selected from TUI).
     * Only one conductor — they stay in the main session.
     * Returns false if the agent doesn't exist or isn't a primary agent.
     */
    selectConductor(agentName: string): boolean;
    /** Get the current conductor's agent name */
    getConductor(): string;
    /**
     * Deploy ANY agent to a visible sub-session.
     * They work autonomously — user can watch but NOT interact.
     * The conductor WAITS for all sub-sessions to complete before proceeding.
     *
     * Even primary agents (other than the conductor) get sub-sessions.
     * Only the conductor stays in the main session.
     */
    callAgent(task: DelegatedTask, parentSessionId?: string): Promise<SubSession>;
    /**
     * The conductor calls this to WAIT for all sub-sessions to complete.
     * The conductor does NOT move forward until all sub-sessions finish or timeout.
     */
    waitForAllSubSessions(timeoutMs?: number): Promise<boolean>;
    /** Mark a sub-session as completed with result */
    completeSubSession(sessionId: string, result: string): boolean;
    /** Check if conductor is waiting for sub-sessions */
    isWaiting(): boolean;
    /** List all visible sub-sessions for the TUI */
    getVisibleSubSessions(): SubSession[];
    /** Clear completed sub-sessions */
    clearCompletedSubSessions(): void;
    /**
     * Start full pipeline: /plan
     * Only the conductor stays in the main session.
     * EVERY other agent gets a sub-session.
     */
    runFullPipeline(userRequest: string): Promise<void>;
    /**
     * Run a workflow phase.
     * ALL agents (primary + sub) get deployed to visible sub-sessions.
     * Only the conductor stays in the main session.
     */
    runPhase(phase: string): Promise<void>;
    /** Collect results from all sub-sessions */
    collectSubSessionResults(): string[];
    /** Synthesize all results into one report */
    synthesize(): string;
}
//# sourceMappingURL=index.d.ts.map