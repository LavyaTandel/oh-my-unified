import { describe, it, expect, afterEach } from 'bun:test';
import { InterviewEngine } from './server';

describe('InterviewEngine', () => {
  let engine: InterviewEngine;

  afterEach(() => {
    if (engine) engine.dispose();
  });

  it('creates a session', () => {
    engine = new InterviewEngine(0);
    const session = engine.createSession('s1', 'Project Setup', [
      { id: 'q1', question: 'What?', category: 'project', expectedAnswerType: 'text' },
    ]);
    expect(session.id).toMatch(/^interview-/);
    expect(session.title).toBe('Project Setup');
    expect(session.completed).toBe(false);
  });

  it('tracks active sessions', () => {
    engine = new InterviewEngine(0);
    engine.createSession('s1', 'A', [{ id: 'q1', question: 'Q', category: 'project', expectedAnswerType: 'text' }]);
    const active = engine.getActiveSessions();
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('A');
  });

  it('submits answers and tracks completion', () => {
    engine = new InterviewEngine(0);
    const session = engine.createSession('s1', 'Test', [
      { id: 'q1', question: 'Q1', category: 'project', expectedAnswerType: 'text' },
      { id: 'q2', question: 'Q2', category: 'team', expectedAnswerType: 'text' },
    ]);

    engine.submitAnswer(session.id, 'q1', 'Answer 1');
    expect(session.completed).toBe(false);

    engine.submitAnswer(session.id, 'q2', 'Answer 2');
    expect(session.completed).toBe(true);
    expect(session.completedAt).toBeDefined();
  });

  it('ignores answers for unknown session', () => {
    engine = new InterviewEngine(0);
    expect(engine.submitAnswer('unknown', 'q1', 'ans')).toBe(false);
  });

  it('deletes sessions', () => {
    engine = new InterviewEngine(0);
    const session = engine.createSession('s1', 'Test', []);
    expect(engine.deleteSession(session.id)).toBe(true);
    expect(engine.getSession(session.id)).toBeUndefined();
    expect(engine.deleteSession('unknown')).toBe(false);
  });

  it('returns stats', () => {
    engine = new InterviewEngine(0);
    const s1 = engine.createSession('s1', 'A', [
      { id: 'q1', question: 'Q', category: 'project', expectedAnswerType: 'text' },
    ]);
    const s2 = engine.createSession('s2', 'B', [
      { id: 'q1', question: 'Q', category: 'project', expectedAnswerType: 'text' },
    ]);
    engine.submitAnswer(s1.id, 'q1', 'done');

    const stats = engine.getStats();
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.totalAnswers).toBe(1);
  });

  it('generates dashboard HTML', () => {
    engine = new InterviewEngine(0);
    const html = (engine as any).getDashboardHTML();
    expect(html).toContain('Interview Dashboard');
    expect(html).toContain('EventSource');
    expect(html).toContain('/sse');
  });

  it('disposes cleanly', () => {
    engine = new InterviewEngine(0);
    engine.createSession('s1', 'Test', []);
    engine.dispose();
    expect(engine.getActiveSessions()).toHaveLength(0);
    expect(engine.getStats().total).toBe(0);
  });
});
