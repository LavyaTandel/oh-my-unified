import { log } from '../../utils/logger';
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
    registry;
    taskList;
    config;
    state = 'idle';
    activeTeams = new Map();
    teardownTimers = new Map();
    reshapeCallbacks = new Map();
    constructor(registry, taskList, config) {
        this.registry = registry;
        this.taskList = taskList;
        this.config = {
            enableImmediateTeardown: true,
            enableRecreateToReshape: true,
            reshapeDelayMs: 200,
            ...config,
        };
    }
    getState() {
        return this.state;
    }
    async startTeam(teamId) {
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
            const sessionIds = [];
            for (const member of team.members) {
                const sessionId = await this.createMemberSession(teamId, member);
                sessionIds.push(sessionId);
            }
            this.activeTeams.set(teamId, { team, sessionIds });
            this.state = 'running';
            log('[team-orchestrator] team started', { teamId, members: team.members.length });
        }
        catch (err) {
            this.state = 'idle';
            throw err;
        }
    }
    async stopTeam(teamId) {
        const active = this.activeTeams.get(teamId);
        if (!active) {
            log('[team-orchestrator] team not running, ignoring stop', { teamId });
            return;
        }
        await this.teardownTeam(teamId, active);
    }
    async onTeamCompositionChanged(teamId) {
        if (!this.config.enableImmediateTeardown) {
            log('[team-orchestrator] immediate teardown disabled, skipping', { teamId });
            return;
        }
        await this.triggerReshape(teamId);
    }
    async triggerReshape(teamId) {
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
            }
            catch (err) {
                log('[team-orchestrator] reshape failed', { teamId, error: String(err) });
                this.state = 'idle';
            }
        }, this.config.reshapeDelayMs);
        if (typeof timer === 'object' && 'unref' in timer) {
            timer.unref();
        }
        this.teardownTimers.set(teamId, timer);
    }
    async teardownTeam(teamId, active) {
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
    async createMemberSession(_teamId, _member) {
        const sessionId = `team-${_teamId}-${_member.agentName}-${Date.now()}`;
        log('[team-orchestrator] member session created', {
            teamId: _teamId,
            agent: _member.agentName,
            sessionId,
        });
        return sessionId;
    }
    async terminateSession(_sessionId) {
        log('[team-orchestrator] session terminated', { sessionId: _sessionId });
    }
    onReshapeComplete(teamId, callback) {
        const callbacks = this.reshapeCallbacks.get(teamId) ?? [];
        callbacks.push(callback);
        this.reshapeCallbacks.set(teamId, callbacks);
    }
    notifyReshapeComplete(teamId) {
        const callbacks = this.reshapeCallbacks.get(teamId) ?? [];
        for (const cb of callbacks) {
            try {
                cb(teamId);
            }
            catch (err) {
                log('[team-orchestrator] reshape callback error', { teamId, error: String(err) });
            }
        }
        this.reshapeCallbacks.delete(teamId);
    }
    getActiveTeamSessions() {
        const result = new Map();
        for (const [teamId, active] of this.activeTeams) {
            result.set(teamId, [...active.sessionIds]);
        }
        return result;
    }
    async dispose() {
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
//# sourceMappingURL=team-orchestrator.js.map