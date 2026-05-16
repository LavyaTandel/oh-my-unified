import type { PluginInput } from '@opencode-ai/plugin';
import { log } from '../../utils/logger';

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
export class RalphLoopManager {
  private config: Required<RalphLoopConfig>;
  private states = new Map<string, RalphLoopState>();
  private iterationCounts = new Map<string, number>();

  constructor(config?: RalphLoopConfig) {
    this.config = {
      enabled: config?.enabled ?? true,
      defaultMaxIterations: config?.defaultMaxIterations ?? 10,
      iterationCooldownMs: config?.iterationCooldownMs ?? 1000,
    };
  }

  /** Start a new Ralph Loop for a session */
  startLoop(
    sessionId: string,
    prompt: string,
    options?: {
      maxIterations?: number;
      strategy?: 'refine' | 'verify';
      completionPromiseId?: string;
    },
  ): void {
    if (!this.config.enabled) return;

    this.states.set(sessionId, {
      active: true,
      prompt,
      iteration: 0,
      maxIterations: options?.maxIterations ?? this.config.defaultMaxIterations,
      sessionId,
      completionPromiseId: options?.completionPromiseId,
      strategy: options?.strategy ?? 'refine',
    });
    this.iterationCounts.set(sessionId, 0);

    log('[ralph-loop] started', {
      sessionId,
      prompt: prompt.slice(0, 100),
      maxIterations: options?.maxIterations ?? this.config.defaultMaxIterations,
      strategy: options?.strategy ?? 'refine',
    });
  }

  /** Check if a session has an active loop */
  isActive(sessionId: string): boolean {
    const state = this.states.get(sessionId);
    return state?.active ?? false;
  }

  /** Get the current loop state for a session */
  getState(sessionId: string): RalphLoopState | undefined {
    return this.states.get(sessionId);
  }

  /** Increment the iteration counter for a session */
  incrementIteration(sessionId: string): number {
    const state = this.states.get(sessionId);
    if (!state || !state.active) return 0;

    state.iteration++;
    const current = (this.iterationCounts.get(sessionId) ?? 0) + 1;
    this.iterationCounts.set(sessionId, current);

    if (state.iteration >= state.maxIterations) {
      log('[ralph-loop] max iterations reached', {
        sessionId,
        iteration: state.iteration,
        maxIterations: state.maxIterations,
      });
      this.stopLoop(sessionId);
    }

    return state.iteration;
  }

  /** Stop a loop for a session */
  stopLoop(sessionId: string): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    state.active = false;
    log('[ralph-loop] stopped', {
      sessionId,
      iterations: state.iteration,
    });
  }

  /** Cancel all active loops */
  cancelAll(): void {
    for (const sessionId of this.states.keys()) {
      this.stopLoop(sessionId);
    }
  }

  /** Get the continuation prompt for the next iteration */
  getContinuationPrompt(state: RalphLoopState): string {
    if (state.strategy === 'verify') {
      return `Continue verifying the task. Iteration ${state.iteration + 1} of ${state.maxIterations}.

Original task: ${state.prompt}

Review the work done so far and identify any remaining issues, gaps, or improvements. If the work is complete and correct, respond with <ralph-complete/>.`;
    }

    return `Continue refining and improving the work. Iteration ${state.iteration + 1} of ${state.maxIterations}.

Original task: ${state.prompt}

Build on the work done so far. Improve quality, fix any issues, and add missing details. If the work is complete and cannot be further improved, respond with <ralph-complete/>.`;
  }

  /** Check if the output contains a completion signal */
  containsCompletionSignal(output: string): boolean {
    return (
      output.includes('<ralph-complete/>') ||
      output.includes('<ralph_complete/>') ||
      output.includes('RALPH_COMPLETE') ||
      output.toLowerCase().includes('task is complete') &&
        output.toLowerCase().includes('no further improvements')
    );
  }

  /** Get active loop count */
  getActiveCount(): number {
    let count = 0;
    for (const state of this.states.values()) {
      if (state.active) count++;
    }
    return count;
  }

  /** Get all active session IDs */
  getActiveSessions(): string[] {
    const sessions: string[] = [];
    for (const [sessionId, state] of this.states) {
      if (state.active) sessions.push(sessionId);
    }
    return sessions;
  }

  /** Dispose: cancel all loops */
  dispose(): void {
    this.cancelAll();
    this.states.clear();
    this.iterationCounts.clear();
  }
}

/**
 * Creates a Ralph Loop hook for the plugin.
 */
export function createRalphLoopHook(
  _ctx: PluginInput,
  config?: RalphLoopConfig,
) {
  const manager = new RalphLoopManager(config);

  return {
    manager,

    /** Hook into tool.execute.after to detect completion signals */
    'tool.execute.after': async (
      input: { tool: string; sessionID: string },
      output: { output: string },
    ): Promise<void> => {
      if (!manager.isActive(input.sessionID)) return;
      if (typeof output.output !== 'string') return;

      if (manager.containsCompletionSignal(output.output)) {
        log('[ralph-loop] completion signal detected', {
          sessionID: input.sessionID,
        });
        manager.stopLoop(input.sessionID);
      }
    },

    /** Hook into event for session cleanup */
    'event': async (input: { event: { type: string; properties?: unknown } }): Promise<void> => {
      if (input.event.type === 'session.deleted') {
        const props = input.event.properties as Record<string, unknown> | undefined;
        const sessionId = props?.sessionID as string | undefined;
        if (sessionId) {
          manager.stopLoop(sessionId);
        }
      }
    },
  };
}
