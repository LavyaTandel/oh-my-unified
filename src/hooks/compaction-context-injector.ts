import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';
import { getPersistedData, setPersistedData } from '../utils/persist';
import { Phase } from '../workflow';

const STORAGE_KEY = 'compaction-context';

/**
 * Context snapshot preserved across compaction boundaries.
 */
export interface CompactionContext {
  /** Current workflow phase */
  phase?: Phase;
  /** Active agent names */
  activeAgents: string[];
  /** Current task description */
  currentTask?: string;
  /** Active session IDs */
  sessionIds: string[];
  /** Arbitrary key-value metadata */
  metadata: Record<string, unknown>;
  /** Timestamp of the snapshot */
  timestamp: number;
}

/**
 * Configuration for compaction context injection.
 */
export interface CompactionContextInjectorConfig {
  /** Enable context preservation (default: true) */
  enabled?: boolean;
  /** Metadata keys to persist selectively */
  preserveKeys?: string[];
}

/**
 * Creates a hook that preserves key operational context across session
 * compaction events. Before compaction, it snapshots the current task,
 * workflow phase, and active agents. After compaction, it re-injects
 * that context so the agent doesn't lose its place.
 */
export function createCompactionContextInjectorHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: CompactionContextInjectorConfig,
) {
  const cfg: Required<CompactionContextInjectorConfig> = {
    enabled: true,
    preserveKeys: ['phase', 'currentTask', 'activeAgents', 'sessionIds'],
    ...hookConfig,
  };

  let currentContext: CompactionContext = {
    activeAgents: [],
    sessionIds: [],
    metadata: {},
    timestamp: Date.now(),
  };

  /**
   * Builds the latest context snapshot from current state.
   */
  function buildSnapshot(overrides?: Partial<CompactionContext>): CompactionContext {
    return {
      ...currentContext,
      ...overrides,
      timestamp: Date.now(),
    };
  }

  /**
   * Updates the in-memory context with new values.
   */
  function updateContext(partial: Partial<CompactionContext>): void {
    currentContext = { ...currentContext, ...partial, timestamp: Date.now() };
  }

  /**
   * Hook that fires before session compaction. Persists the current
   * context snapshot to disk.
   */
  async function handleCompactionBefore(
    _input: Record<string, unknown>,
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
  }

  /**
   * Hook that fires after session compaction. Restores the persisted
   * context back into memory and injects it into the session.
   */
  async function handleCompactionAfter(
    _input: Record<string, unknown>,
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;

    try {
      const saved = getPersistedData<CompactionContext | null>(STORAGE_KEY, null);
      if (!saved) {
        log('[compaction-context] no saved context found after compaction');
        return;
      }

      currentContext = saved;

      // Build a compact restoration message
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
    'oh-my-unified.compaction.before': handleCompactionBefore,
    'oh-my-unified.compaction.after': handleCompactionAfter,
  };
}
