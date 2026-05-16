import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';
import { getPersistedData, setPersistedData } from '../utils/persist';
import { Phase } from '../workflow';

const STORAGE_KEY = 'compaction-context';
const OWNERSHIP_KEY = 'compaction-ownership';

/**
 * Context snapshot preserved across compaction boundaries.
 */
export interface CompactionContext {
  phase?: Phase;
  activeAgents: string[];
  currentTask?: string;
  sessionIds: string[];
  metadata: Record<string, unknown>;
  timestamp: number;
}

/**
 * Ownership record preventing ralph-loop and other agents from
 * continuing sessions they don't own.
 */
export interface CompactionOwnership {
  /** Session ID that owns the continuation */
  ownerSessionId: string;
  /** Agent name that initiated the continuation */
  ownerAgent: string;
  /** Timestamp when ownership was claimed */
  claimedAt: number;
  /** Whether this continuation is still valid */
  valid: boolean;
}

export interface CompactionContextInjectorConfig {
  enabled?: boolean;
  preserveKeys?: string[];
  /** Enable ownership guards (default: true) */
  enableOwnershipGuards?: boolean;
}

/**
 * Creates a hook that preserves key operational context across session
 * compaction events AND enforces continuation ownership to prevent
 * ralph-loop and other agents from hijacking sessions they don't own.
 */
export function createCompactionContextInjectorHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: CompactionContextInjectorConfig,
) {
  const cfg: Required<CompactionContextInjectorConfig> = {
    enabled: true,
    preserveKeys: ['phase', 'currentTask', 'activeAgents', 'sessionIds'],
    enableOwnershipGuards: true,
    ...hookConfig,
  };

  let currentContext: CompactionContext = {
    activeAgents: [],
    sessionIds: [],
    metadata: {},
    timestamp: Date.now(),
  };

  let currentOwnership: CompactionOwnership | null = null;

  function buildSnapshot(overrides?: Partial<CompactionContext>): CompactionContext {
    return {
      ...currentContext,
      ...overrides,
      timestamp: Date.now(),
    };
  }

  function updateContext(partial: Partial<CompactionContext>): void {
    currentContext = { ...currentContext, ...partial, timestamp: Date.now() };
  }

  /**
   * Claim ownership for a session that is about to be compacted.
   * Only the session that created the background task can continue it.
   */
  function claimOwnership(sessionId: string, agent: string): CompactionOwnership {
    const ownership: CompactionOwnership = {
      ownerSessionId: sessionId,
      ownerAgent: agent,
      claimedAt: Date.now(),
      valid: true,
    };
    currentOwnership = ownership;
    return ownership;
  }

  /**
   * Release ownership when a session completes or is cancelled.
   */
  function releaseOwnership(): void {
    if (currentOwnership) {
      currentOwnership.valid = false;
      currentOwnership = null;
    }
  }

  /**
   * Check if a session is allowed to continue after compaction.
   * Returns false if another session owns the continuation.
   */
  function canContinue(sessionId: string): boolean {
    if (!cfg.enableOwnershipGuards) return true;
    if (!currentOwnership) return true;
    if (!currentOwnership.valid) return true;
    return currentOwnership.ownerSessionId === sessionId;
  }

  async function handleCompactionBefore(
    input: Record<string, unknown>,
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;

    const snapshot = buildSnapshot();
    try {
      setPersistedData(STORAGE_KEY, snapshot);
      log('[compaction-context] saved context snapshot before compaction', {
        phase: snapshot.phase,
        agents: snapshot.activeAgents.length,
        task: snapshot.currentTask ? snapshot.currentTask.slice(0, 60) : undefined,
      });
    } catch (err) {
      log(`[compaction-context] failed to save snapshot: ${err}`);
    }

    // Persist ownership if active
    if (cfg.enableOwnershipGuards && currentOwnership?.valid) {
      try {
        setPersistedData(OWNERSHIP_KEY, currentOwnership);
        log('[compaction-ownership] persisted ownership before compaction', {
          owner: currentOwnership.ownerAgent,
          session: currentOwnership.ownerSessionId.slice(0, 12),
        });
      } catch (err) {
        log(`[compaction-ownership] failed to persist ownership: ${err}`);
      }
    }

    // Extract session info from input if available
    const sessionId = (input.sessionId as string) || '';
    const agent = (input.agent as string) || 'unknown';
    if (sessionId) {
      claimOwnership(sessionId, agent);
    }
  }

  async function handleCompactionAfter(
    input: Record<string, unknown>,
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;

    // Check ownership before allowing continuation
    const sessionId = (input.sessionId as string) || '';
    if (!canContinue(sessionId)) {
      log('[compaction-ownership] continuation blocked — session does not own this task', {
        requestingSession: sessionId.slice(0, 12),
        ownerSession: currentOwnership?.ownerSessionId.slice(0, 12),
        ownerAgent: currentOwnership?.ownerAgent,
      });
      (output as Record<string, unknown>).ownershipBlocked = true;
      (output as Record<string, unknown>).injectedContext =
        '--- Continuation Blocked: Ownership Mismatch ---\n' +
        `This task is owned by session ${currentOwnership?.ownerAgent} (${currentOwnership?.ownerSessionId.slice(0, 12)}).\n` +
        'You cannot continue this task. Let the owning session handle it.\n' +
        '---';
      return;
    }

    // Restore ownership from persistence
    if (cfg.enableOwnershipGuards) {
      try {
        const savedOwnership = getPersistedData<CompactionOwnership | null>(OWNERSHIP_KEY, null);
        if (savedOwnership?.valid) {
          currentOwnership = savedOwnership;
          log('[compaction-ownership] restored ownership after compaction', {
            owner: savedOwnership.ownerAgent,
          });
        }
      } catch (err) {
        log(`[compaction-ownership] failed to restore ownership: ${err}`);
      }
    }

    // Restore context
    try {
      const saved = getPersistedData<CompactionContext | null>(STORAGE_KEY, null);
      if (!saved) {
        log('[compaction-context] no saved context found after compaction');
        return;
      }

      currentContext = saved;

      const lines: string[] = ['--- Context Restored After Compaction ---'];
      if (saved.currentTask) {
        lines.push(`Task: ${saved.currentTask}`);
      }
      if (saved.phase !== undefined) {
        const phaseLabels = ['assess', 'assemble', 'act', 'improvise'];
        lines.push(`Phase: ${phaseLabels[saved.phase] ?? 'unknown'}`);
      }
      if (saved.activeAgents.length > 0) {
        lines.push(`Active Agents: ${saved.activeAgents.join(', ')}`);
      }
      if (saved.sessionIds.length > 0) {
        lines.push(`Sessions: ${saved.sessionIds.join(', ')}`);
      }
      if (currentOwnership?.valid) {
        lines.push(`Continuation Owner: ${currentOwnership.ownerAgent}`);
      }
      lines.push('---');

      (output as Record<string, unknown>).injectedContext = lines.join('\n');

      log('[compaction-context] injected restored context', {
        phase: saved.phase,
        agents: saved.activeAgents.length,
        sessions: saved.sessionIds.length,
      });
    } catch (err) {
      log(`[compaction-context] failed to restore snapshot: ${err}`);
    }
  }

  return {
    updateContext,
    buildSnapshot,
    getContext: () => ({ ...currentContext }),
    claimOwnership,
    releaseOwnership,
    canContinue,
    getOwnership: () => currentOwnership,
    'compaction.before': handleCompactionBefore,
    'compaction.after': handleCompactionAfter,
  };
}
