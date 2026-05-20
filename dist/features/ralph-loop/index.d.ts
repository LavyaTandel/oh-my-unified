import type { PluginInput } from '@opencode-ai/plugin';
/**
 * State for a Ralph Loop session.
 */
export interface RalphLoopState {
    /** Whether the loop is active */
    active: boolean;
    /** The original prompt/task */
    prompt: string;
    /** Current iteration number */
    iteration: number;
    /** Maximum iterations allowed */
    maxIterations: number;
    /** Session ID of the loop */
    sessionId: string;
    /** Completion promise ID (if set) */
    completionPromiseId?: string;
    /** Strategy: "refine" (improve) or "verify" (check) */
    strategy: 'refine' | 'verify';
}
/**
 * Configuration for the Ralph Loop.
 */
export interface RalphLoopConfig {
    /** Enable Ralph Loop (default: true) */
    enabled?: boolean;
    /** Default max iterations (default: 10) */
    defaultMaxIterations?: number;
    /** Cooldown between iterations in ms (default: 1000) */
    iterationCooldownMs?: number;
}
/**
 * Ralph Loop — iterative refinement system.
 *
 * Allows agents to loop on a task, refining their output through multiple
 * iterations. Each iteration builds on the previous one, progressively
 * improving quality until the task is complete or max iterations reached.
 *
 * Pattern adapted from openagent's ralph-loop (30+ files distilled to core).
 */
export declare class RalphLoopManager {
    private config;
    private states;
    private iterationCounts;
    constructor(config?: RalphLoopConfig);
    /** Start a new Ralph Loop for a session */
    startLoop(sessionId: string, prompt: string, options?: {
        maxIterations?: number;
        strategy?: 'refine' | 'verify';
        completionPromiseId?: string;
    }): void;
    /** Check if a session has an active loop */
    isActive(sessionId: string): boolean;
    /** Get the current loop state for a session */
    getState(sessionId: string): RalphLoopState | undefined;
    /** Increment the iteration counter for a session */
    incrementIteration(sessionId: string): number;
    /** Stop a loop for a session */
    stopLoop(sessionId: string): void;
    /** Cancel all active loops */
    cancelAll(): void;
    /** Get the continuation prompt for the next iteration */
    getContinuationPrompt(state: RalphLoopState): string;
    /** Check if the output contains a completion signal */
    containsCompletionSignal(output: string): boolean;
    /** Get active loop count */
    getActiveCount(): number;
    /** Get all active session IDs */
    getActiveSessions(): string[];
    /** Dispose: cancel all loops */
    dispose(): void;
}
/**
 * Creates a Ralph Loop hook for the plugin.
 */
export declare function createRalphLoopHook(_ctx: PluginInput, config?: RalphLoopConfig): {
    manager: RalphLoopManager;
    /** Hook into tool.execute.after to detect completion signals */
    'tool.execute.after': (input: {
        tool: string;
        sessionID: string;
    }, output: {
        output: string;
    }) => Promise<void>;
    /** Hook into event for session cleanup */
    event: (input: {
        event: {
            type: string;
            properties?: unknown;
        };
    }) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map