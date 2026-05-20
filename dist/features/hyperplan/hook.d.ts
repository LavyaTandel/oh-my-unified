import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { HyperplanManager } from './index';
export interface HyperplanConfig {
    enabled?: boolean;
}
export declare function createHyperplanHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: HyperplanConfig): {
    manager: HyperplanManager;
    checkTrigger: (input: string) => boolean;
    activate: (input: {
        sessionID: string;
        agent?: string;
    }, output: {
        message: unknown;
        parts: unknown[];
    }) => void;
};
//# sourceMappingURL=hook.d.ts.map