import { describe, it, expect, beforeEach } from 'bun:test'
import { SessionMultiplexer } from './index'
import type { MultiplexerType } from './index'

describe('SessionMultiplexer', () => {
  let mux: SessionMultiplexer

  beforeEach(() => {
    mux = new SessionMultiplexer()
  })

  // ── 1. Default type is 'tmux' ─────────────────────────────────────────

  it('defaults to tmux when no type is given', () => {
    expect(mux.getType()).toBe('tmux')
  })

  // ── 2. Constructor accepts a custom multiplexer type ───────────────────

  it('accepts a custom multiplexer type', () => {
    const zellij = new SessionMultiplexer('zellij')
    expect(zellij.getType()).toBe('zellij')

    const none = new SessionMultiplexer('none')
    expect(none.getType()).toBe('none')
  })

  // ── 3. createSession returns a session with correct properties ─────────

  it('creates a session with correct properties', () => {
    const session = mux.createSession('dev-session')

    expect(session.id).toMatch(/^ses-mux-\d+$/)
    expect(session.name).toBe('dev-session')
    expect(session.type).toBe('tmux')
    expect(session.active).toBe(true)
    expect(typeof session.createdAt).toBe('number')
  })

  // ── 4. createSession increments IDs ────────────────────────────────────

  it('increments session IDs on each creation', () => {
    const s1 = mux.createSession('first')
    const s2 = mux.createSession('second')

    expect(s1.id).toBe('ses-mux-1')
    expect(s2.id).toBe('ses-mux-2')
  })

  // ── 5. getSession returns a session by id ──────────────────────────────

  it('retrieves a session by id', () => {
    const created = mux.createSession('my-session')
    const found = mux.getSession(created.id)

    expect(found).toBeDefined()
    expect(found!.name).toBe('my-session')
    expect(found!.id).toBe(created.id)
  })

  // ── 6. getSession returns undefined for unknown id ─────────────────────

  it('returns undefined for an unknown session id', () => {
    const session = mux.getSession('nonexistent')
    expect(session).toBeUndefined()
  })

  // ── 7. listActiveSessions returns only active sessions ─────────────────

  it('lists only active sessions', () => {
    const s1 = mux.createSession('active-one')
    const s2 = mux.createSession('to-close')
    const s3 = mux.createSession('active-two')

    mux.closeSession(s2.id)

    const active = mux.listActiveSessions()
    expect(active).toHaveLength(2)
    expect(active.map((s) => s.name)).toEqual(['active-one', 'active-two'])
    expect(active.every((s) => s.active)).toBe(true)
  })

  // ── 8. closeSession marks session as inactive ──────────────────────────

  it('marks a session as inactive when closed', () => {
    const session = mux.createSession('closable')
    expect(session.active).toBe(true)

    const result = mux.closeSession(session.id)
    expect(result).toBe(true)

    const retrieved = mux.getSession(session.id)
    expect(retrieved!.active).toBe(false)
  })

  // ── 9. closeSession returns false for unknown sessions ─────────────────

  it('returns false when closing an unknown session', () => {
    const result = mux.closeSession('fake-id')
    expect(result).toBe(false)
  })

  // ── 10. getSessionCount returns total created sessions ─────────────────

  it('returns total session count including closed ones', () => {
    expect(mux.getSessionCount()).toBe(0)

    mux.createSession('s1')
    mux.createSession('s2')
    expect(mux.getSessionCount()).toBe(2)

    const s3 = mux.createSession('s3')
    mux.closeSession(s3.id)
    // Count should still be 3 (includes closed sessions)
    expect(mux.getSessionCount()).toBe(3)
  })
})
