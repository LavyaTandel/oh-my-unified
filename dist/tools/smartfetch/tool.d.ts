import type { PluginContext } from '../../plugin/types';
export declare function webfetch(url: string): Promise<{
    url: string;
    title: string;
    content: string;
    error?: string;
}>;
export declare function createWebfetchTool(_ctx: PluginContext): typeof webfetch;
//# sourceMappingURL=tool.d.ts.map