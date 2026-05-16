import type { Team, TeamMember, TeamTask } from './types';
import { TeamRegistry } from './team-registry';
import { TeamTaskList } from './task-list';
import { log } from '../../utils/logger';

/**
 * State of a team session lifecycle.
 */
export type TeamSessionState =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'reshaping'
  | 'tearing-down'
  | 'terminating'
  | 'terminated';

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
export class TeamOrchestrator {
  private registry: TeamRegistry;
  private taskList: TeamTaskList;
  private config: Required<TeamOrchestratorConfig>;
  private state: TeamSessionState = 'idle';
  private activeTeams: Map<string, { team: Team; sessionIds: string[] }> = new Map();
  private teardownTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private reshapeCallbacks: Map<string, Array<(teamId: string) => void>> = new Map();

  constructor(
    registry: TeamRegistry,
    taskList: TeamTaskList,
    config?: TeamOrchestratorConfig,
  ) {
    this.registry = registry;
    this.taskList = taskList;
    this.config = {
      enableImmediateTeardown: true,
      enableRecreateToReshape: true,
      reshapeDelayMs: 200,
      ...config,
    };
  }

  getState(): TeamSessionState {
    return this.state;
  }

  async startTeam(teamId: string): Promise<void> {
    const team = this.registry.getTeam(teamId);
    if (!team) {
      throw new Error(`Team "${teamId}" not found`);
    }

    if (this.activeTeams.has(teamId)) {
      log('[team-orchestrator] team already running, triggering reshape', { teamId });
      await this.triggerReshape(teamId);
      return;
    }

    this.state = 'initializing';
    try {
      const sessionIds: string[] = [];
      for (const member of team.members) {
        const sessionId = await this.createMemberSession(teamId, member);
        sessionIds.push(sessionId);
      }

      this.activeTeams.set(teamId, { team, sessionIds });
      this.state = 'running';
      log('[team-orchestrator] team started', { teamId, members: team.members.length });
    } catch (err) {
      this.state = 'idle';
      throw err;
    }
  }

  async stopTeam(teamId: string): Promise<void> {
    const active = this.activeTeams.get(teamId);
    if (!active) {
      log('[team-orchestrator] team not running, ignoring stop', { teamId });
      return;
    }

    await this.teardownTeam(teamId, active);
  }

  async onTeamCompositionChanged(teamId: string): Promise<void> {
    if (!this.config.enableImmediateTeardown) {
      log('[team-orchestrator] immediate teardown disabled, skipping', { teamId });
      return;
    }

    await this.triggerReshape(teamId);
  }

  private async triggerReshape(teamId: string): Promise<void> {
    const active = this.activeTeams.get(teamId);
    if (!active) {
      log('[team-orchestrator] team not active, cannot reshape', { teamId });
      return;
    }

    this.state = 'tearing-down';
    await this.teardownTeam(teamId, active);

    if (!this.config.enableRecreateToReshape) {
      log('[team-orchestrator] recreate-to-reshape disabled, stopped after teardown', { teamId });
      return;
    }

    this.state = 'reshaping';
    const timer = setTimeout(async () => {
      this.teardownTimers.delete(teamId);
      try {
        await this.startTeam(teamId);
        this.notifyReshapeComplete(teamId);
      } catch (err) {
        log('[team-orchestrator] reshape failed', { teamId, error: String(err) });
        this.state = 'idle';
      }
    }, this.config.reshapeDelayMs);

    if (typeof timer === 'object' && 'unref' in timer) {
      (timer as NodeJS.Timeout).unref();
    }

    this.teardownTimers.set(teamId, timer);
  }

  private async teardownTeam(
    teamId: string,
    active: { team: Team; sessionIds: string[] },
  ): Promise<void> {
    log('[team-orchestrator] tearing down team sessions', {
      teamId,
      sessions: active.sessionIds.length,
    });

    for (const sessionId of active.sessionIds) {
      await this.terminateSession(sessionId);
    }

    this.activeTeams.delete(teamId);
    log('[team-orchestrator] team torn down', { teamId });
  }

  private async createMemberSession(_teamId: string, _member: TeamMember): Promise<string> {
    const sessionId = `team-${_teamId}-${_member.agentName}-${Date.now()}`;
    log('[team-orchestrator] member session created', {
      teamId: _teamId,
      agent: _member.agentName,
      sessionId,
    });
    return sessionId;
  }

  private async terminateSession(_sessionId: string): Promise<void> {
    log('[team-orchestrator] session terminated', { sessionId: _sessionId });
  }

  onReshapeComplete(teamId: string, callback: (teamId: string) => void): void {
    const callbacks = this.reshapeCallbacks.get(teamId) ?? [];
    callbacks.push(callback);
    this.reshapeCallbacks.set(teamId, callbacks);
  }

  private notifyReshapeComplete(teamId: string): void {
    const callbacks = this.reshapeCallbacks.get(teamId) ?? [];
    for (const cb of callbacks) {
      try {
        cb(teamId);
      } catch (err) {
        log('[team-orchestrator] reshape callback error', { teamId, error: String(err) });
      }
    }
    this.reshapeCallbacks.delete(teamId);
  }

  getActiveTeamSessions(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [teamId, active] of this.activeTeams) {
      result.set(teamId, [...active.sessionIds]);
    }
    return result;
  }

  async dispose(): Promise<void> {
    this.state = 'terminating';

    for (const [teamId, timer] of this.teardownTimers) {
      clearTimeout(timer);
      this.teardownTimers.delete(teamId);
    }

    const activeTeams = new Map(this.activeTeams);
    for (const [teamId, active] of activeTeams) {
      await this.teardownTeam(teamId, active);
    }

    this.state = 'terminated';
    log('[team-orchestrator] disposed');
  }
}
