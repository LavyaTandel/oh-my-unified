import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { Phase } from '../workflow';
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
export declare function createCompactionContextInjectorHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: CompactionContextInjectorConfig): {
    updateContext: (partial: Partial<CompactionContext>) => void;
    buildSnapshot: (overrides?: Partial<CompactionContext>) => CompactionContext;
    getContext: () => {
        phase?: Phase;
        activeAgents: string[];
        currentTask?: string;
        sessionIds: string[];
        metadata: Record<string, unknown>;
        timestamp: number;
    };
    claimOwnership: (sessionId: string, agent: string) => CompactionOwnership;
    releaseOwnership: () => void;
    canContinue: (sessionId: string) => boolean;
    getOwnership: () => CompactionOwnership | null;
    'compaction.before': (input: Record<string, unknown>, _output: Record<string, unknown>) => Promise<void>;
    'compaction.after': (input: Record<string, unknown>, output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=compaction-context-injector.d.ts.map