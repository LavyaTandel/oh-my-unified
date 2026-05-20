import type { PluginContext } from '../../plugin/types';
export interface SmartfetchOptions {
    maxLength?: number;
    startLength?: number;
    showLink?: boolean;
}
export declare function createSmartfetchTool(ctx: PluginContext): {
    name: string;
    description: string;
    func: (params: {
        url: string;
        maxLength?: number;
    }) => Promise<{
        url: string;
        title: string;
        content: string;
        error?: string;
    }>;
};
//# sourceMappingURL=index.d.ts.map