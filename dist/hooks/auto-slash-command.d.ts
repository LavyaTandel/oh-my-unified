import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../config';
export declare function createAutoSlashCommandHook(_ctx: PluginInput, _config: PluginConfig): {
    'chat.message': (input: {
        sessionID: string;
        messageID?: string;
    }, output: {
        parts: Array<{
            type: string;
            text?: string;
        }>;
    }) => Promise<void>;
    'command.execute.before': (input: {
        command: string;
        sessionID: string;
        arguments: string;
    }, output: {
        parts: Array<{
            type: string;
            text?: string;
        }>;
    }) => Promise<void>;
    event: (input: {
        event: {
            type: string;
            properties?: unknown;
        };
    }) => Promise<void>;
};
//# sourceMappingURL=auto-slash-command.d.ts.map