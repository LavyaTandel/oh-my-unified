export type MultiplexerType = 'tmux' | 'zellij' | 'none'

export interface SessionInfo {
  id: string
  name: string
  type: MultiplexerType
  createdAt: number
  active: boolean
}

export class SessionMultiplexer {
  private type: MultiplexerType = 'none'
  private sessions: Map<string, SessionInfo> = new Map()
  private sessionCounter = 0

  constructor(type?: MultiplexerType) {
    if (type) {
      this.type = type
    } else {
      // Auto-detect: prefer tmux, fallback to zellij
      this.type = 'tmux' // default
    }
  }

  getType(): MultiplexerType {
    return this.type
  }

  createSession(name: string): SessionInfo {
    this.sessionCounter++
    const session: SessionInfo = {
      id: `ses-mux-${this.sessionCounter}`,
      name,
      type: this.type,
      createdAt: Date.now(),
      active: true,
    }
    this.sessions.set(session.id, session)
    return session
  }

  getSession(id: string): SessionInfo | undefined {
    return this.sessions.get(id)
  }

  listActiveSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).filter((s) => s.active)
  }

  closeSession(id: string): boolean {
    const session = this.sessions.get(id)
    if (!session) return false
    session.active = false
    return true
  }

  getSessionCount(): number {
    return this.sessions.size
  }
}
