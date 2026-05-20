type ToolProvider = 'mcp' | 'gstack' | 'builtin' | 'primitive';
export declare class ToolUsageMonitor {
    private sessions;
    recordToolUse(sessionId: string, toolName: string, provider: ToolProvider): void;
    needsNudge(sessionId: string, nudgeAfterTurns?: number): boolean;
    generateNudge(sessionId: string, availableTools: string[]): string | null;
    clearSession(sessionId: string): void;
}
export {};
//# sourceMappingURL=tool-usage-monitor.d.ts.map