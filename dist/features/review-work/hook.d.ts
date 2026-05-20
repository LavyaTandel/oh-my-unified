import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { ReviewWorkManager } from './index';
import type { TransparencyLog } from '../transparency-log';
export interface ReviewWorkConfig {
    enabled?: boolean;
}
export declare function createReviewWorkHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: ReviewWorkConfig, opts?: {
    transparencyLog?: TransparencyLog;
}): {
    manager: ReviewWorkManager;
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