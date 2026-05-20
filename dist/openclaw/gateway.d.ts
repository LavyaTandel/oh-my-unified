import type { OpenClawConfig, OutgoingMessage, IncomingMessage } from './types';
export declare class OpenClawGateway {
    private config;
    private listeners;
    constructor(config: OpenClawConfig);
    onMessage(listener: (msg: IncomingMessage) => void): void;
    send(msg: OutgoingMessage): Promise<boolean>;
    start(): Promise<void>;
    stop(): Promise<void>;
    isActive(): boolean;
}
//# sourceMappingURL=gateway.d.ts.map