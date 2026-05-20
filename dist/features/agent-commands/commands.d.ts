import { PipelineOrchestrator } from '../pipeline';
export declare function getPipeline(): PipelineOrchestrator;
export type UnifiedCommand = {
    name: string;
    description: string;
    template: string;
    action?: () => Promise<string | void>;
};
export declare const UNIFIED_COMMANDS: Record<string, UnifiedCommand>;
//# sourceMappingURL=commands.d.ts.map