import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let astGrep = null;
try {
    astGrep = require('@ast-grep/napi');
}
catch {
    // ast-grep not available
}
function checkAstGrep() {
    if (!astGrep) {
        throw new Error('@ast-grep/napi is not installed. Run: bun install @ast-grep/napi');
    }
    return astGrep;
}
export async function ast_grep_search(params) {
    const ag = checkAstGrep();
    const opts = {
        path: params.path,
        pattern: params.pattern,
    };
    if (params.filePattern)
        opts.filePattern = params.filePattern;
    if (params.lang)
        opts.lang = params.lang;
    if (params.useRegexp)
        opts.regex = true;
    const result = await ag.search(opts);
    return { matches: result.matches || [] };
}
export async function ast_grep_replace(params) {
    const ag = checkAstGrep();
    const opts = {
        path: params.path,
        pattern: params.pattern,
        rewrite: params.rewrite,
        dryRun: params.dryRun ?? false,
    };
    if (params.filePattern)
        opts.filePattern = params.filePattern;
    if (params.lang)
        opts.lang = params.lang;
    if (params.useRegexp)
        opts.regex = true;
    const result = await ag.rewrite(opts);
    return { replacements: result.replacements || 0, files: result.files || [] };
}
// Tool definitions for OpenCode registration
export const ast_grep_search_tool = {
    name: 'ast_grep_search',
    description: 'Search code patterns using AST-aware grep (structural search)',
    input: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Directory to search in' },
            pattern: { type: 'string', description: 'Search pattern (AST node pattern or regex)' },
            filePattern: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.ts")' },
            lang: { type: 'string', description: 'Language filter (typescript, python, etc.)' },
            useRegexp: { type: 'boolean', description: 'Use regex matching instead of AST patterns' },
        },
        required: ['path', 'pattern'],
    },
    func: ast_grep_search,
};
export const ast_grep_replace_tool = {
    name: 'ast_grep_replace',
    description: 'Replace code patterns using AST-aware rewrite (structural replace)',
    input: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Directory to search in' },
            pattern: { type: 'string', description: 'Search pattern (AST node pattern or regex)' },
            rewrite: { type: 'string', description: 'Replacement pattern' },
            filePattern: { type: 'string', description: 'Glob pattern to filter files' },
            lang: { type: 'string', description: 'Language filter' },
            useRegexp: { type: 'boolean', description: 'Use regex matching' },
            dryRun: { type: 'boolean', description: 'Preview changes without applying' },
        },
        required: ['path', 'pattern', 'rewrite'],
    },
    func: ast_grep_replace,
};
//# sourceMappingURL=ast-grep.js.map