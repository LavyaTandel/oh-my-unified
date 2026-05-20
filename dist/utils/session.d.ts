import type { PluginInput } from '@opencode-ai/plugin';
type OpencodeClient = PluginInput['client'];
export declare const SESSION_ABORT_TIMEOUT_MS = 1000;
export declare class OperationTimeoutError extends Error {
    constructor(message: string);
}
export declare function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T>;
export declare function abortSessionWithTimeout(client: OpencodeClient, sessionId: string, timeoutMs?: number): Promise<void>;
export declare function shortModelLabel(modelId: string): string;
export {};
//# sourceMappingURL=session.d.ts.map