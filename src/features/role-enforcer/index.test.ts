import { describe, it, expect, beforeEach } from 'bun:test'
import { RoleEnforcer } from './index'

describe('RoleEnforcer', () => {
  let enforcer: RoleEnforcer

  beforeEach(() => {
    enforcer = new RoleEnforcer()
  })

  // ── 1. Strategist (Odin) can do everything ─────────────────────────────

  it('1. Strategist (Odin) can delegate, edit, read, and research', () => {
    expect(enforcer.checkPermission('odin', 'delegate').blocked).toBe(false)
    expect(enforcer.checkPermission('odin', 'edit').blocked).toBe(false)
    expect(enforcer.checkPermission('odin', 'read').blocked).toBe(false)
    expect(enforcer.checkPermission('odin', 'research').blocked).toBe(false)
  })

  // ── 2. Orchestrator (Njord) cannot edit ────────────────────────────────

  it('2. Orchestrator (Njord) cannot edit files directly', () => {
    const result = enforcer.checkPermission('njord', 'edit')
    expect(result.blocked).toBe(true)
    expect(result.violation).toContain('Orchestrators cannot edit')
  })

  it('3. Orchestrator (Njord) can delegate and read', () => {
    expect(enforcer.checkPermission('njord', 'delegate').blocked).toBe(false)
    expect(enforcer.checkPermission('njord', 'read').blocked).toBe(false)
  })

  // ── 3. Advisor (Mimir) is read-only ────────────────────────────────────

  it('4. Advisor (Mimir) can only read', () => {
    expect(enforcer.checkPermission('mimir', 'read').blocked).toBe(false)
    expect(enforcer.checkPermission('mimir', 'edit').blocked).toBe(true)
    expect(enforcer.checkPermission('mimir', 'delegate').blocked).toBe(true)
  })

  // ── 4. Mapper (Vidar) cannot edit ──────────────────────────────────────

  it('5. Mapper (Vidar) cannot edit but can read and research', () => {
    expect(enforcer.checkPermission('vidar', 'edit').blocked).toBe(true)
    expect(enforcer.checkPermission('vidar', 'read').blocked).toBe(false)
    expect(enforcer.checkPermission('vidar', 'research').blocked).toBe(false)
  })

  // ── 5. Builder (Thor) can edit and delegate ────────────────────────────

  it('6. Builder (Thor) can edit, delegate, read, and research', () => {
    expect(enforcer.checkPermission('thor', 'edit').blocked).toBe(false)
    expect(enforcer.checkPermission('thor', 'delegate').blocked).toBe(false)
    expect(enforcer.checkPermission('thor', 'read').blocked).toBe(false)
    expect(enforcer.checkPermission('thor', 'research').blocked).toBe(false)
  })

  // ── 6. Runner (Hermod) cannot delegate ─────────────────────────────────

  it('7. Runner (Hermod) cannot delegate', () => {
    const result = enforcer.checkPermission('hermod', 'delegate')
    expect(result.blocked).toBe(true)
    expect(result.violation).toContain('Runners cannot delegate')
  })

  it('8. Runner (Hermod) can edit, read, and research', () => {
    expect(enforcer.checkPermission('hermod', 'edit').blocked).toBe(false)
    expect(enforcer.checkPermission('hermod', 'read').blocked).toBe(false)
    expect(enforcer.checkPermission('hermod', 'research').blocked).toBe(false)
  })

  // ── 7. Read-only researchers (Scout/Scholar/Watcher) ───────────────────

  it('9. Scout (Sif), Scholar (Eir), and Watcher (Heimdall) are read-only', () => {
    for (const name of ['sif', 'eir', 'heimdall']) {
      expect(enforcer.checkPermission(name, 'read').blocked).toBe(false)
      expect(enforcer.checkPermission(name, 'edit').blocked).toBe(true)
      expect(enforcer.checkPermission(name, 'delegate').blocked).toBe(true)
    }
  })

  // ── 8. Unknown agent ──────────────────────────────────────────────────

  it('10. Unknown agent is blocked', () => {
    const result = enforcer.checkPermission('unknown', 'read')
    expect(result.blocked).toBe(true)
    expect(result.violation).toBe('Unknown agent')
  })

  // ── 9. canDelegate — agent cannot delegate ────────────────────────────

  it('11. Mimir cannot delegate (canDelegate: false)', () => {
    const result = enforcer.canDelegate('mimir', 'odin')
    expect(result.blocked).toBe(true)
    expect(result.violation).toContain('cannot delegate')
  })

  // ── 10. canDelegate — delegatableAgents list ───────────────────────────

  it('12. Odin can delegate to allowed agents but not outsiders', () => {
    // Odin can delegate to Mimir (in delegatableAgents)
    const allowed = enforcer.canDelegate('odin', 'mimir')
    expect(allowed.blocked).toBe(false)

    // Odin cannot delegate to Thor (not in Odin's delegatableAgents)
    const blocked = enforcer.canDelegate('odin', 'thor')
    expect(blocked.blocked).toBe(true)
    expect(blocked.violation).toContain('cannot delegate to')
  })

  // ── 13. canDelegate — unknown agent ────────────────────────────────────

  it('13. canDelegate returns blocked for unknown agent', () => {
    const result = enforcer.canDelegate('nonexistent', 'odin')
    expect(result.blocked).toBe(true)
    expect(result.violation).toBe('Unknown agent')
  })
})
