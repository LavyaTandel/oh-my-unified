export type MultiplexerType = 'tmux' | 'zellij' | 'none';
export interface SessionInfo {
    id: string;
    name: string;
    type: MultiplexerType;
    createdAt: number;
    active: boolean;
}
export declare class SessionMultiplexer {
    private type;
    private sessions;
    private sessionCounter;
    constructor(type?: MultiplexerType);
    getType(): MultiplexerType;
    createSession(name: string): SessionInfo;
    getSession(id: string): SessionInfo | undefined;
    listActiveSessions(): SessionInfo[];
    closeSession(id: string): boolean;
    getSessionCount(): number;
}
//# sourceMappingURL=index.d.ts.map