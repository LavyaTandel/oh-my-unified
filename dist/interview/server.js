// Interview Engine — web-based requirements gathering UI with dashboard
// Used by @Odin during the /assess phase to interview users
import { createServer } from 'node:http';
import { log } from '../utils/logger';
const CATEGORIES = ['project', 'team', 'tech-stack', 'requirements', 'constraints', 'timeline'];
export class InterviewEngine {
    sessions = new Map();
    server = null;
    port;
    clients = new Set();
    constructor(port = 3456) {
        this.port = port;
    }
    createSession(sessionId, title, questions) {
        const session = {
            id: `interview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            startedAt: Date.now(),
            questions,
            answers: {},
            completed: false,
            sessionId,
        };
        this.sessions.set(session.id, session);
        log('[interview] session created', { id: session.id, title, questionCount: questions.length });
        this.broadcastUpdate();
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    getActiveSessions() {
        return [...this.sessions.values()].filter((s) => !s.completed);
    }
    submitAnswer(sessionId, questionId, answer) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.answers[questionId] = answer;
        session.completed = session.questions.every((q) => session.answers[q.id]?.trim());
        if (session.completed) {
            session.completedAt = Date.now();
            log('[interview] session completed', { id: session.id, answerCount: Object.keys(session.answers).length });
        }
        this.broadcastUpdate();
        return true;
    }
    deleteSession(id) {
        const removed = this.sessions.delete(id);
        if (removed)
            this.broadcastUpdate();
        return removed;
    }
    getStats() {
        const all = [...this.sessions.values()];
        return {
            total: all.length,
            active: all.filter((s) => !s.completed).length,
            completed: all.filter((s) => s.completed).length,
            totalAnswers: all.reduce((sum, s) => sum + Object.keys(s.answers).length, 0),
        };
    }
    broadcastUpdate() {
        const data = JSON.stringify({ type: 'update', sessions: this.getSummary() });
        for (const client of this.clients) {
            try {
                client.write(`data: ${data}\n\n`);
            }
            catch {
                this.clients.delete(client);
            }
        }
    }
    getSummary() {
        return [...this.sessions.values()].map((s) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            progress: s.questions.length > 0
                ? Math.round((Object.keys(s.answers).length / s.questions.length) * 100)
                : 0,
            questionCount: s.questions.length,
        }));
    }
    start() {
        this.server = createServer((req, res) => {
            const url = new URL(req.url ?? '/', `http://localhost:${this.port}`);
            if (url.pathname === '/sse') {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                });
                const client = {
                    write: (data) => res.write(data),
                    end: () => res.end(),
                };
                this.clients.add(client);
                req.on('close', () => this.clients.delete(client));
                res.write(`data: ${JSON.stringify({ type: 'init', sessions: this.getSummary() })}\n\n`);
                return;
            }
            if (url.pathname === '/api/sessions' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getSummary()));
                return;
            }
            if (url.pathname === '/api/stats' && req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getStats()));
                return;
            }
            if (url.pathname.startsWith('/api/session/') && req.method === 'GET') {
                const id = url.pathname.split('/').pop() ?? '';
                const session = this.getSession(id);
                if (!session) {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Session not found' }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(session));
                return;
            }
            if (url.pathname.startsWith('/api/session/') && url.pathname.endsWith('/answer') && req.method === 'POST') {
                const parts = url.pathname.split('/');
                const sessionId = parts[3];
                let body = '';
                req.on('data', (chunk) => (body += chunk));
                req.on('end', () => {
                    try {
                        const { questionId, answer } = JSON.parse(body);
                        const ok = this.submitAnswer(sessionId, questionId, answer);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ ok, completed: this.getSession(sessionId)?.completed }));
                    }
                    catch {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Invalid request' }));
                    }
                });
                return;
            }
            if (url.pathname === '/' || url.pathname === '/dashboard') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getDashboardHTML());
                return;
            }
            res.writeHead(404);
            res.end('Not found');
        });
        this.server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                log('[interview] port in use, trying fallback', { port: this.port });
                this.server?.listen(0, () => {
                    const addr = this.server?.address();
                    const actualPort = typeof addr === 'object' && addr ? addr.port : this.port;
                    log('[interview] dashboard running', { port: actualPort, url: `http://localhost:${actualPort}` });
                });
            }
            else {
                log('[interview] server error', { error: err.message });
            }
        });
        this.server.listen(this.port, () => {
            log('[interview] dashboard running', { port: this.port, url: `http://localhost:${this.port}` });
        });
    }
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            for (const client of this.clients)
                client.end();
            this.clients.clear();
            log('[interview] server stopped');
        }
    }
    dispose() {
        this.stop();
        this.sessions.clear();
    }
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Dashboard — oh-my-unified</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #58a6ff; }
  .stats { display: flex; gap: 1rem; margin: 1rem 0; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; flex: 1; text-align: center; }
  .stat-value { font-size: 2rem; font-weight: 700; color: #58a6ff; }
  .stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; margin-top: 0.25rem; }
  .sessions { margin-top: 1.5rem; }
  .session { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; }
  .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .session-title { font-weight: 600; color: #c9d1d9; }
  .session-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; }
  .badge-active { background: #238636; color: #fff; }
  .badge-done { background: #1f6feb; color: #fff; }
  .progress-bar { height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #238636, #2ea043); transition: width 0.3s; }
  .progress-fill.done { background: linear-gradient(90deg, #1f6feb, #388bfd); }
  .progress-text { font-size: 0.75rem; color: #8b949e; margin-top: 0.25rem; }
  .empty { text-align: center; padding: 3rem; color: #484f58; font-size: 0.9rem; }
</style>
</head>
<body>
<h1>Interview Dashboard</h1>
<p style="color:#8b949e;font-size:0.85rem">Real-time interview session monitoring</p>
<div class="stats">
  <div class="stat"><div class="stat-value" id="stat-total">0</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-value" id="stat-active">0</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-value" id="stat-completed">0</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-value" id="stat-answers">0</div><div class="stat-label">Answers</div></div>
</div>
<div class="sessions" id="sessions"><div class="empty">No interview sessions yet</div></div>
<script>
const evt = new EventSource('/sse');
evt.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'init' || data.type === 'update') {
    render(data.sessions);
    fetch('/api/stats').then(r => r.json()).then(updateStats);
  }
};
function updateStats(s) {
  document.getElementById('stat-total').textContent = s.total;
  document.getElementById('stat-active').textContent = s.active;
  document.getElementById('stat-completed').textContent = s.completed;
  document.getElementById('stat-answers').textContent = s.totalAnswers;
}
function render(sessions) {
  const el = document.getElementById('sessions');
  if (!sessions || sessions.length === 0) {
    el.innerHTML = '<div class="empty">No interview sessions yet</div>';
    return;
  }
  el.innerHTML = sessions.map(s => \`
    <div class="session">
      <div class="session-header">
        <span class="session-title">\${s.title}</span>
        <span class="session-badge \${s.completed ? 'badge-done' : 'badge-active'}">\${s.completed ? 'Completed' : 'In Progress'}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill \${s.completed ? 'done' : ''}" style="width:\${s.progress}%"></div></div>
      <div class="progress-text">\${s.progress}% complete — \${s.questionCount} questions</div>
    </div>
  \`).join('');
}
</script>
</body>
</html>`;
    }
}
//# sourceMappingURL=server.js.map