import type { PluginContext } from '../plugin/types';
interface CouncilParams {
    prompt: string;
    preset?: string;
}
export declare function council_session(params: CouncilParams): Promise<{
    response: string;
    councillors: Array<{
        name: string;
        response: string;
    }>;
    summary: string;
}>;
export declare const council_tool: {
    name: string;
    description: string;
    input: {
        type: string;
        properties: {
            prompt: {
                type: string;
                description: string;
            };
            preset: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    func: typeof council_session;
};
export declare function createCouncilTool(_ctx: PluginContext, _config: Record<string, any>, _depthTracker: any): Record<string, unknown>;
export {};
//# sourceMappingURL=council.d.ts.map