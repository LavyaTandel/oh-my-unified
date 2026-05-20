import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { SystemObserver } from '../system-observer';
export interface PipelineCommandHandler {
    handleCommand: (input: {
        command: string;
        sessionID: string;
        arguments: string;
    }, output: {
        parts: Array<{
            type: string;
            text?: string;
        }>;
    }) => Promise<void>;
}
export declare function createPipelineCommandHandler(_ctx: PluginInput, _config: PluginConfig, systemObserver?: SystemObserver): PipelineCommandHandler;
//# sourceMappingURL=handler.d.ts.map