import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for edit error recovery.
 */
export interface EditErrorRecoveryConfig {
  /** Enable edit error recovery (default: true) */
  enabled?: boolean;
  /** Include detailed recovery suggestions (default: true) */
  detailedSuggestions?: boolean;
}

/**
 * Categorised error pattern → suggestion mappings.
 */
interface ErrorSuggestion {
  patterns: RegExp[];
  suggestion: string;
  autoFixable: boolean;
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
  {
    patterns: [/not found/, /no such file/i, /ENOENT/, /does not exist/i],
    suggestion:
      'The target file could not be found. Check that the file path is correct and the file exists. Use `glob` or `ls` to verify the file location.',
    autoFixable: false,
  },
  {
    patterns: [/permission denied/i, /EACCES/, /EPERM/],
    suggestion:
      'Permission denied. Ensure the file is not open in another editor and you have write access to the directory.',
    autoFixable: false,
  },
  {
    patterns: [/read-only/i, /readonly/i],
    suggestion:
      'The file is read-only. Check file permissions with `ls -l <file>` and update if needed with `chmod +w <file>`.',
    autoFixable: false,
  },
  {
    patterns: [/oldString not found/i, /no match/i],
    suggestion:
      'The exact text to replace was not found in the file. The content may have already changed, or the whitespace/indentation is slightly different. Read the file again to get the current content before editing.',
    autoFixable: false,
  },
  {
    patterns: [/Multiple matches/i, /multiple occurrence/i],
    suggestion:
      'Found multiple occurrences of the search string. Provide more surrounding context in oldString to uniquely identify the target location. Read the target section of the file to capture unique context.',
    autoFixable: true,
  },
  {
    patterns: [/is a directory/i, /EISDIR/],
    suggestion:
      'The path points to a directory, not a file. Append the filename to the path.',
    autoFixable: false,
  },
  {
    patterns: [/file system/i, /ENOSPC/, /disk full/i, /quota/i],
    suggestion:
      'The file system may be full or unavailable. Check disk space with `df -h .` and free up space if needed.',
    autoFixable: false,
  },
  {
    patterns: [/locked/i, /EBUSY/],
    suggestion:
      'The file is locked or busy. Another process may be writing to it. Wait a moment and retry.',
    autoFixable: false,
  },
  {
    patterns: [/argument.*invalid/i, /invalid argument/i, /EINVAL/],
    suggestion:
      'One of the edit parameters is invalid. Verify the file path, oldString, and newString are properly formatted.',
    autoFixable: false,
  },
  {
    patterns: [/tool.*timeout/i, /timed out/i],
    suggestion:
      'The edit operation timed out. The file may be very large. Try editing a smaller section or splitting the change into multiple edits.',
    autoFixable: false,
  },
];

/**
 * Creates a hook that intercepts file edit failures and provides
 * helpful recovery suggestions based on the error message pattern.
 *
 * Each suggestion includes whether the fix can be automated and
 * specific next steps for the agent or user.
 */
export function createEditErrorRecoveryHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: EditErrorRecoveryConfig,
) {
  const cfg: Required<EditErrorRecoveryConfig> = {
    enabled: true,
    detailedSuggestions: true,
    ...hookConfig,
  };

  /**
   * Matches an error message against known patterns and returns
   * suggestions.
   */
  function matchSuggestions(error: string): ErrorSuggestion[] {
    const matches: ErrorSuggestion[] = [];
    for (const entry of ERROR_SUGGESTIONS) {
      for (const pattern of entry.patterns) {
        if (pattern.test(error)) {
          matches.push(entry);
          break;
        }
      }
    }
    return matches;
  }

  /**
   * Given an error from a failed edit, returns a structured
   * recovery suggestion.
   */
  function suggest(error: string): {
    category: string;
    suggestion: string;
    autoFixable: boolean;
  } | null {
    const matches = matchSuggestions(error);

    if (matches.length === 0) {
      return null;
    }

    // Return the most specific (longest suggestion) match
    const best = matches.reduce((a, b) =>
      a.suggestion.length >= b.suggestion.length ? a : b,
    );

    return {
      category: 'edit-error',
      suggestion: cfg.detailedSuggestions
        ? best.suggestion
        : best.suggestion.split('.')[0] + '.',
      autoFixable: best.autoFixable,
    };
  }

  /**
   * Hook that fires after a tool call. If the tool was a file edit
   * operation that failed, logs recovery suggestions.
   */
  async function handleToolAfter(
    input: { tool: string; error?: string; filePath?: string },
    _output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    if (!input.error) return;

    const editTools = new Set([
      'edit',
      'write',
      'Write',
      'Edit',
      'file_write',
      'file_edit',
      'apply_diff',
    ]);
    if (!editTools.has(input.tool)) return;

    const error = input.error;
    const result = suggest(error);

    if (result) {
      const pathInfo = input.filePath ? ` for "${input.filePath}"` : '';
      log(
        `[edit-error-recovery] edit failed${pathInfo}: ${error.slice(0, 80)}`,
      );
      log(`[edit-error-recovery] suggestion: ${result.suggestion}`);
    } else {
      log(
        `[edit-error-recovery] unclassified edit error: ${error.slice(0, 100)}`,
      );
    }
  }

  return {
    'tool.after': handleToolAfter,
    suggest,
  };
}
