import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from '../utils/logger';
const DEFAULT_FILES = ['AGENTS.md', 'README.md'];
/**
 * Creates a hook that reads AGENTS.md and README.md from the current
 * project directory (or a custom path) and injects their content as
 * system context. This gives all agents project-specific guidance
 * about architecture, conventions, and available tools.
 */
export function createDirectoryContextInjectorHook(ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        directory: ctx.directory ?? process.cwd(),
        contextFiles: [...DEFAULT_FILES],
        maxFileLength: 8000,
        ...hookConfig,
    };
    let cachedContext = null;
    let lastCacheTime = 0;
    const CACHE_TTL_MS = 60_000; // Re-read every 60s
    /**
     * Reads a project context file and returns its content.
     * Returns null if the file doesn't exist or is unreadable.
     */
    function readContextFile(fileName) {
        try {
            const filePath = resolve(cfg.directory, fileName);
            if (!existsSync(filePath))
                return null;
            const content = readFileSync(filePath, 'utf-8');
            if (content.length > cfg.maxFileLength) {
                return content.slice(0, cfg.maxFileLength) +
                    `\n\n[... truncated at ${cfg.maxFileLength} characters]`;
            }
            return content;
        }
        catch {
            return null;
        }
    }
    /**
     * Gathers all context files and concatenates them into a single
     * context block.
     */
    function gatherContext() {
        const now = Date.now();
        if (cachedContext && now - lastCacheTime < CACHE_TTL_MS) {
            return cachedContext;
        }
        const parts = [];
        for (const fileName of cfg.contextFiles) {
            const content = readContextFile(fileName);
            if (content) {
                parts.push(`### Context from ${fileName}\n${content}`);
            }
        }
        if (parts.length === 0) {
            cachedContext = null;
            return null;
        }
        cachedContext = `--- Project Context ---\n${parts.join('\n\n')}\n---`;
        lastCacheTime = now;
        return cachedContext;
    }
    /**
     * Invalidates the cache so the next call re-reads from disk.
     */
    function invalidateCache() {
        cachedContext = null;
        lastCacheTime = 0;
    }
    /**
     * Hook that fires before processing a user message. Injects the
     * directory context (AGENTS.md / README.md) into the message metadata
     * so the model receives project-specific guidance.
     */
    async function handleMessageBefore(input, _output) {
        if (!cfg.enabled)
            return;
        if (input.role !== 'user')
            return;
        const context = gatherContext();
        if (context) {
            log('[directory-context-injector] injecting project context');
            input._projectContext = context;
        }
        else {
            log('[directory-context-injector] no context files found');
        }
    }
    return {
        gatherContext,
        invalidateCache,
        'message.before': handleMessageBefore,
    };
}
//# sourceMappingURL=directory-context-injector.js.map