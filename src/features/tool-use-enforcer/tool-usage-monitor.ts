type ToolProvider = 'mcp' | 'gstack' | 'builtin' | 'primitive'

const PRIMITIVE_TOOLS = new Set(['bash', 'read', 'write', 'edit', 'grep', 'glob', 'webfetch'])

interface SessionState {
  turnCount: number
  lastNonPrimitiveTurn: number
  toolsUsed: Set<string>
}

export class ToolUsageMonitor {
  private sessions = new Map<string, SessionState>()

  recordToolUse(sessionId: string, toolName: string, provider: ToolProvider): void {
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = { turnCount: 0, lastNonPrimitiveTurn: 0, toolsUsed: new Set() }
      this.sessions.set(sessionId, session)
    }

    session.turnCount++
    session.toolsUsed.add(toolName)

    if (provider !== 'primitive') {
      session.lastNonPrimitiveTurn = session.turnCount
    }
  }

  needsNudge(sessionId: string, nudgeAfterTurns = 3): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    const turnsSinceNonPrimitive = session.turnCount - session.lastNonPrimitiveTurn
    return turnsSinceNonPrimitive >= nudgeAfterTurns
  }

  generateNudge(sessionId: string, availableTools: string[]): string | null {
    if (!this.needsNudge(sessionId)) return null

    const session = this.sessions.get(sessionId)!
    const usedList = Array.from(session.toolsUsed).join(', ')

    const nudge: string[] = [
      `⚠️  You've been using only primitive tools for several turns.`,
      ``,
      `Tools used this session: ${usedList}`,
      ``,
      `Available higher-level tools you could leverage:`,
      ...availableTools.slice(0, 6).map((t) => `  • ${t}`),
      ``,
      `Tip: Consider using MCP servers (e.g., code-review-graph, exa, context7)`,
      `or gstack skills (/qa, /browse, /investigate) for task-specific automation.`,
    ]

    return nudge.join('\n')
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
}
