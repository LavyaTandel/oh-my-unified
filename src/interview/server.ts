// Interview Engine — web-based requirements gathering UI
// Used by @Odin during the /assess phase to interview users

import { createServer } from 'node:http';

export interface InterviewQuestion {
  id: string;
  question: string;
  context?: string;
  expectedAnswerType: 'text' | 'choice' | 'multi-choice';
  options?: string[];
}

export interface InterviewSession {
  id: string;
  startedAt: number;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  completed: boolean;
}

export class InterviewEngine {
  private sessions: Map<string, InterviewSession> = new Map();
  private port: number;

  constructor(port = 3456) {
    this.port = port;
  }

  createSession(questions: InterviewQuestion[]): InterviewSession {
    const session: InterviewSession = {
      id: `interview-${Date.now()}`,
      startedAt: Date.now(),
      questions,
      answers: {},
      completed: false,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): InterviewSession | undefined {
    return this.sessions.get(id);
  }

  submitAnswer(sessionId: string, questionId: string, answer: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.answers[questionId] = answer;
    // Check if all questions answered
    session.completed = session.questions.every((q) => session.answers[q.id]);
    return true;
  }

  start(): void {
    const server = createServer((req, res) => {
      // Serve a simple HTML interview UI
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html><head><title>Interview — oh-my-unified</title>
          <style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:2rem}
          .question{background:#f5f5f5;padding:1.5rem;border-radius:8px;margin:1rem 0}
          textarea{width:100%;min-height:80px;padding:0.5rem;border:1px solid #ddd;border-radius:4px}
          button{background:#0066cc;color:white;border:none;padding:0.75rem 1.5rem;border-radius:4px;cursor:pointer}
          .completed{background:#d4edda;padding:1rem;border-radius:8px}
          </style></head><body>
          <h1>🧠 Interview — oh-my-unified</h1>
          <p>Odin is gathering requirements. Answer the questions below.</p>
          <div id="questions"></div>
          <script>
            fetch('/api/questions').then(r=>r.json()).then(session => {
              const container = document.getElementById('questions')
              session.questions.forEach(q => {
                const div = document.createElement('div')
                div.className = 'question'
                div.innerHTML = '<strong>' + q.question + '</strong>' +
                  (q.context ? '<p><em>' + q.context + '</em></p>' : '') +
                  '<textarea id="q-' + q.id + '" placeholder="Your answer..."></textarea><br>' +
                  '<button onclick="submitAnswer(\'' + q.id + '\')">Submit</button>'
                container.appendChild(div)
              })
            })
            function submitAnswer(questionId) {
              const answer = document.getElementById('q-' + questionId).value
              fetch('/api/answer', {method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({questionId,answer})}).then(r=>r.json()).then(result => {
                if(result.completed) {
                  document.getElementById('questions').innerHTML =
                    '<div class="completed"><h2>✅ Interview Complete</h2><p>All questions answered. Confidence threshold can be evaluated.</p></div>'
                }
              })
            }
          </script>
          </body></html>
        `);
      } else if (req.url === '/api/questions') {
        // Return first active session
        const session = this.sessions.values().next().value;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
      } else if (req.url === '/api/answer' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const { questionId, answer } = JSON.parse(body);
          const session = this.sessions.values().next().value;
          if (session) this.submitAnswer(session.id, questionId, answer);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ completed: session?.completed }));
        });
      }
    });
    server.listen(this.port);
    console.log(`[Interview] Server running on http://localhost:${this.port}`);
  }
}
