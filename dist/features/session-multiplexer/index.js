export class SessionMultiplexer {
    type = 'none';
    sessions = new Map();
    sessionCounter = 0;
    constructor(type) {
        if (type) {
            this.type = type;
        }
        else {
            // Auto-detect: prefer tmux, fallback to zellij
            this.type = 'tmux'; // default
        }
    }
    getType() {
        return this.type;
    }
    createSession(name) {
        this.sessionCounter++;
        const session = {
            id: `ses-mux-${this.sessionCounter}`,
            name,
            type: this.type,
            createdAt: Date.now(),
            active: true,
        };
        this.sessions.set(session.id, session);
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    listActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.active);
    }
    closeSession(id) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        session.active = false;
        return true;
    }
    getSessionCount() {
        return this.sessions.size;
    }
}
//# sourceMappingURL=index.js.map