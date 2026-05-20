import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
/**
 * Configuration for auto-command detection.
 */
export interface AutoCommandDetectorConfig {
    /** Enable auto-command detection (default: true) */
    enabled?: boolean;
    /** User message must contain at least one of these to trigger detection */
    triggerKeywords?: string[];
    /** Minimum confidence (0-1) to auto-suggest (default: 0.6) */
    confidenceThreshold?: number;
    /** Available slash commands to match against */
    commands?: string[];
}
/**
 * Matched command suggestion.
 */
export interface CommandSuggestion {
    /** The suggested slash command */
    command: string;
    /** Optional arguments */
    arguments?: string;
    /** Confidence score 0-1 */
    confidence: number;
    /** Brief reason for the suggestion */
    reason: string;
}
/**
 * Creates a hook that monitors user input for patterns that match
 * registered agent triggers or slash command keywords. When a match
 * is found above the confidence threshold, it auto-suggests the
 * relevant /command.
 *
 * This is ported from openagent's keyword-detector and auto-slash-command
 * systems, allowing frictionless discovery of available commands.
 */
export declare function createAutoCommandDetectorHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: AutoCommandDetectorConfig): {
    detect: (input: string) => CommandSuggestion[];
    'message.before': (input: {
        content?: string;
        role?: string;
    }, output: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=auto-command-detector.d.ts.map