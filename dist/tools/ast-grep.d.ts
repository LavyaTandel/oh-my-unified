interface AstGrepParams {
    path: string;
    pattern: string;
    filePattern?: string;
    lang?: string;
    useRegexp?: boolean;
}
export declare function ast_grep_search(params: AstGrepParams): Promise<{
    matches: Array<{
        file: string;
        line: number;
        text: string;
    }>;
}>;
export declare function ast_grep_replace(params: AstGrepParams & {
    rewrite: string;
    dryRun?: boolean;
}): Promise<{
    replacements: number;
    files: string[];
}>;
export declare const ast_grep_search_tool: {
    name: string;
    description: string;
    input: {
        type: string;
        properties: {
            path: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            filePattern: {
                type: string;
                description: string;
            };
            lang: {
                type: string;
                description: string;
            };
            useRegexp: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    func: typeof ast_grep_search;
};
export declare const ast_grep_replace_tool: {
    name: string;
    description: string;
    input: {
        type: string;
        properties: {
            path: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            rewrite: {
                type: string;
                description: string;
            };
            filePattern: {
                type: string;
                description: string;
            };
            lang: {
                type: string;
                description: string;
            };
            useRegexp: {
                type: string;
                description: string;
            };
            dryRun: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    func: typeof ast_grep_replace;
};
export {};
//# sourceMappingURL=ast-grep.d.ts.map