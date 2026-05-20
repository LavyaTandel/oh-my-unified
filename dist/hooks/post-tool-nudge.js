import { log } from '../utils/logger';
const DEFAULT_WATCHED_TOOLS = [
    'edit',
    'write',
    'Write',
    'Edit',
    'file_write',
    'file_edit',
    'apply_diff',
    'replace',
    'overwrite',
    'create',
];
const DEFAULT_MESSAGE = 'Change applied. Consider running `bun run typecheck` and `bun test` ' +
    '(or your project\'s equivalent) to verify the change didn\'t break anything.';
/**
 * Creates a hook that nudges the agent (or user) to run typecheck and
 * test commands after file write/edit operations succeed.
 *
 * This reduces the feedback loop by proactively suggesting verification
 * steps instead of waiting for a build failure later.
 */
export function createPostToolNudgeHook(_ctx, _config, hookConfig) {
    const cfg = {
        enabled: true,
        watchedTools: [...DEFAULT_WATCHED_TOOLS],
        message: DEFAULT_MESSAGE,
        skipOnError: false,
        ...hookConfig,
    };
    const watched = new Set(cfg.watchedTools);
    /**
     * Hook that fires after a tool call. If the tool was a file
     * mutation (edit/write/replace etc.) and succeeded, attaches a
     * verification nudge to the output.
     */
    async function handleToolAfter(input, output) {
        if (!cfg.enabled)
            return;
        if (!watched.has(input.tool))
            return;
        if (cfg.skipOnError && input.error)
            return;
        log(`[post-tool-nudge] "${input.tool}" completed — adding verification nudge`);
        output.postToolNudge = cfg.message;
    }
    return {
        'tool.after': handleToolAfter,
    };
}
//# sourceMappingURL=post-tool-nudge.js.map