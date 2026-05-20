import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { SecurityResearchManager } from './index';
export interface SecurityResearchConfig {
    enabled?: boolean;
}
export declare function createSecurityResearchHook(_ctx: PluginInput, _config: PluginConfig, hookConfig?: SecurityResearchConfig): {
    manager: SecurityResearchManager;
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