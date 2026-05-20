export async function webfetch(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'No title';
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (text.length > 5000) {
            text = text.substring(0, 5000) + '... [truncated]';
        }
        return { url, title, content: text };
    }
    catch (err) {
        return {
            url,
            title: 'Error',
            content: '',
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
export function createWebfetchTool(_ctx) {
    return webfetch;
}
//# sourceMappingURL=tool.js.map