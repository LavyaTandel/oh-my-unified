import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
import { log } from '../utils/logger';

/**
 * Configuration for JSON error recovery.
 */
export interface JsonErrorRecoveryConfig {
  /** Enable JSON error recovery (default: true) */
  enabled?: boolean;
  /** Maximum recovery attempts per tool invocation (default: 2) */
  maxAttempts?: number;
  /** Whether to log recovery details (default: true) */
  verbose?: boolean;
}

/**
 * Known JSON error patterns and their fixes.
 */
const JSON_FIXES: Array<{
  name: string;
  test: (text: string) => boolean;
  fix: (text: string) => string;
}> = [
  {
    name: 'trailing-commas',
    test: (text) => /,\s*[}\]"]/.test(text),
    fix: (text) =>
      text.replace(/,\s*([}\]])/g, '$1'),
  },
  {
    name: 'unquoted-keys',
    test: (text) => /[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(text),
    fix: (text) =>
      text.replace(/([{,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1 "$2":'),
  },
  {
    name: 'single-quoted-strings',
    test: (text) => /'[^']*'/.test(text),
    fix: (text) =>
      text.replace(/'([^']*)'/g, (_, inner: string) =>
        `"${inner.replace(/"/g, '\\"')}"`),
  },
  {
    name: 'unquoted-string-values',
    test: (text) => /:\s*[a-zA-Z][a-zA-Z0-9_]*\s*[,}\]\n]/.test(text),
    fix: (text) =>
      text.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}\]\n])/g, ': "$1"$2'),
  },
  {
    name: 'comment-stripping',
    test: (text) => /\/\/[^\n]*|\/\*[\s\S]*?\*\//.test(text),
    fix: (text) =>
      text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''),
  },
  {
    name: 'hexadecimal-numbers',
    test: (text) => /:\s*0x[0-9a-fA-F]+\s*[,}\]\n]/.test(text),
    fix: (text) =>
      text.replace(/:(\s*)0x([0-9a-fA-F]+)\s*([,}\]\n])/g,
        (_, ws: string, hex: string, end: string) =>
          `:${ws}${Number.parseInt(hex, 16)}${end}`),
  },
];

/**
 * Creates a hook that detects malformed JSON in tool responses and
 * attempts to recover by applying a series of common JSON fixes
 * (trailing commas, unquoted keys, single quotes, etc.).
 *
 * Recovery is attempted up to maxAttempts times. If all attempts
 * fail, the original error is reported.
 */
export function createJsonErrorRecoveryHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  hookConfig?: JsonErrorRecoveryConfig,
) {
  const cfg: Required<JsonErrorRecoveryConfig> = {
    enabled: true,
    maxAttempts: 2,
    verbose: true,
    ...hookConfig,
  };

  /**
   * Attempts to parse a JSON string. Returns [parsed, null] on
   * success or [null, errorMessage] on failure.
   */
  function tryParse(raw: string): [unknown, null] | [null, string] {
    try {
      const parsed = JSON.parse(raw);
      return [parsed, null];
    } catch (err) {
      return [null, String(err)];
    }
  }

  /**
   * Applies sequential JSON fixes to the raw text. Returns the
   * list of fix names applied.
   */
  function applyFixes(raw: string): { text: string; applied: string[] } {
    let text = raw;
    const applied: string[] = [];

    for (const fix of JSON_FIXES) {
      if (fix.test(text)) {
        const before = text;
        text = fix.fix(text);
        if (text !== before) {
          applied.push(fix.name);
        }
      }
    }

    return { text, applied };
  }

  /**
   * Attempts full recovery on a raw string — applies fixes and
   * retries parse up to maxAttempts rounds.
   */
  function recover(raw: string): {
    success: boolean;
    result?: unknown;
    error?: string;
    attempts: number;
    fixesApplied: string[];
  } {
    let text = raw;
    const allFixes: string[] = [];

    for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
      const { text: fixed, applied } = applyFixes(text);
      text = fixed;
      allFixes.push(...applied);

      const [parsed, parseErr] = tryParse(text);
      if (parsed !== null) {
        return {
          success: true,
          result: parsed,
          attempts: attempt + 1,
          fixesApplied: allFixes,
        };
      }

      if (attempt < cfg.maxAttempts - 1 && applied.length === 0) {
        // No progress — give up
        return {
          success: false,
          error: parseErr ?? 'Unknown parse error',
          attempts: attempt + 1,
          fixesApplied: allFixes,
        };
      }
    }

    const [, finalErr] = tryParse(text);
    return {
      success: false,
      error: finalErr ?? 'Recovery exhausted',
      attempts: cfg.maxAttempts,
      fixesApplied: allFixes,
    };
  }

  /**
   * Hook that fires after a tool call. If the result indicates a
   * JSON parse failure, attempts recovery.
   */
  async function handleToolAfter(
    input: { tool: string; result?: string; error?: string },
    output: Record<string, unknown>,
  ): Promise<void> {
    if (!cfg.enabled) return;
    if (!input.error && !input.result) return;

    // Check if the result contains a JSON parse error
    const errorText = input.error ?? '';
    const isJsonError =
      errorText.includes('JSON') ||
      errorText.includes('parse') ||
      errorText.includes('Unexpected token') ||
      errorText.includes('position');

    if (!isJsonError) return;

    const rawResult = input.result ?? '';

    if (cfg.verbose) {
      log(`[json-error-recovery] detected JSON error in "${input.tool}"`);
    }

    const recovery = recover(rawResult);
    if (recovery.success) {
      if (cfg.verbose) {
        log(
          `[json-error-recovery] recovered in ${recovery.attempts} attempt(s) ` +
          `with fixes: ${recovery.fixesApplied.join(', ')}`,
        );
      }
      (output as Record<string, unknown>).recoveredJson = recovery.result;
    } else {
      log(
        `[json-error-recovery] recovery failed after ${recovery.attempts} attempt(s)`,
      );
    }
  }

  return {
    'tool.after': handleToolAfter,
    recover,
  };
}
