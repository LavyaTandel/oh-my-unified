import { log } from '../utils/logger';
/**
 * Known JSON error patterns and their fixes.
 */
const JSON_FIXES = [
    {
        name: 'trailing-commas',
        test: (text) => /,\s*[}\]"]/.test(text),
        fix: (text) => text.replace(/,\s*([}\]])/g, '$1'),
    },
    {
        name: 'unquoted-keys',
        test: (text) => /[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(text),
        fix: (text) => text.replace(/([{,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1 "$2":'),
    },
    {
        name: 'single-quoted-strings',
        test: (text) => /'[^']*'/.test(text),
        fix: (text) => text.replace(/'([^']*)'/g, (_, inner) => `"${inner.replace(/"/g, '\\"')}"`),
    },
    {
        name: 'unquoted-string-values',
        test: (text) => /:\s*[a-zA-Z][a-zA-Z0-9_]*\s*[,}\]\n]/.test(text),
        fix: (text) => text.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}\]\n])/g, ': "$1"$2'),
    },
    {
        name: 'comment-stripping',
        test: (text) => /\/\/[^\n]*|\/\*[\s\S]*?\*\//.test(text),
        fix: (text) => text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''),
    },
    {
        name: 'hexadecimal-numbers',
        test: (text) => /:\s*0x[0-9a-fA-F]+\s*[,}\]\n]/.test(text),
        fix: (text) => text.replace(/:(\s*)0x([0-9a-fA-F]+)\s*([,}\]\n])/g, (_, ws, hex, end) => `:${ws}${Number.parseInt(hex, 16)}${end}`),
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
export function createJsonErrorRecoveryHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        maxAttempts: 2,
        verbose: true,
        ...hookConfig,
    };
    /**
     * Attempts to parse a JSON string. Returns [parsed, null] on
     * success or [null, errorMessage] on failure.
     */
    function tryParse(raw) {
        try {
            const parsed = JSON.parse(raw);
            return [parsed, null];
        }
        catch (err) {
            return [null, String(err)];
        }
    }
    /**
     * Applies sequential JSON fixes to the raw text. Returns the
     * list of fix names applied.
     */
    function applyFixes(raw) {
        let text = raw;
        const applied = [];
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
    function recover(raw) {
        let text = raw;
        const allFixes = [];
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
    async function handleToolAfter(input, output) {
        if (!cfg.enabled)
            return;
        if (!input.error && !input.result)
            return;
        // Check if the result contains a JSON parse error
        const errorText = input.error ?? '';
        const isJsonError = errorText.includes('JSON') ||
            errorText.includes('parse') ||
            errorText.includes('Unexpected token') ||
            errorText.includes('position');
        if (!isJsonError)
            return;
        const rawResult = input.result ?? '';
        if (cfg.verbose) {
            log(`[json-error-recovery] detected JSON error in "${input.tool}"`);
        }
        const recovery = recover(rawResult);
        if (recovery.success) {
            if (cfg.verbose) {
                log(`[json-error-recovery] recovered in ${recovery.attempts} attempt(s) ` +
                    `with fixes: ${recovery.fixesApplied.join(', ')}`);
            }
            output.recoveredJson = recovery.result;
        }
        else {
            log(`[json-error-recovery] recovery failed after ${recovery.attempts} attempt(s)`);
        }
    }
    return {
        'tool.after': handleToolAfter,
        recover,
    };
}
//# sourceMappingURL=json-error-recovery.js.map