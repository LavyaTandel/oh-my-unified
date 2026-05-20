export function createSmartfetchTool(ctx) {
    return {
        name: 'smartfetch',
        description: 'Fetch web content with smart summarization',
        func: async (params) => {
            const { webfetch } = await import('./tool');
            return webfetch(params.url);
        },
    };
}
//# sourceMappingURL=index.js.map