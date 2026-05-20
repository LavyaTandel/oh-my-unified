const PRIMITIVE_TOOLS = new Set(['bash', 'read', 'write', 'edit', 'grep', 'glob', 'webfetch']);
export class ToolUsageMonitor {
    sessions = new Map();
    recordToolUse(sessionId, toolName, provider) {
        let session = this.sessions.get(sessionId);
        if (!session) {
            session = { turnCount: 0, lastNonPrimitiveTurn: 0, toolsUsed: new Set() };
            this.sessions.set(sessionId, session);
        }
        session.turnCount++;
        session.toolsUsed.add(toolName);
        if (provider !== 'primitive') {
            session.lastNonPrimitiveTurn = session.turnCount;
        }
    }
    needsNudge(sessionId, nudgeAfterTurns = 3) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        const turnsSinceNonPrimitive = session.turnCount - session.lastNonPrimitiveTurn;
        return turnsSinceNonPrimitive >= nudgeAfterTurns;
    }
    generateNudge(sessionId, availableTools) {
        if (!this.needsNudge(sessionId))
            return null;
        const session = this.sessions.get(sessionId);
        const usedList = Array.from(session.toolsUsed).join(', ');
        const nudge = [
            `⚠️  You've been using only primitive tools for several turns.`,
            ``,
            `Tools used this session: ${usedList}`,
            ``,
            `Available higher-level tools you could leverage:`,
            ...availableTools.slice(0, 6).map((t) => `  • ${t}`),
            ``,
            `Tip: Consider using MCP servers (e.g., code-review-graph, exa, context7)`,
            `or gstack skills (/qa, /browse, /investigate) for task-specific automation.`,
        ];
        return nudge.join('\n');
    }
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}
//# sourceMappingURL=tool-usage-monitor.js.map