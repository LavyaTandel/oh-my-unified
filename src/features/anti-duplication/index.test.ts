import { describe, it, expect, beforeEach } from 'bun:test'
import { AntiDuplication } from './index'
import type { SearchKey, SearchResult } from './index'

describe('AntiDuplication', () => {
  let ad: AntiDuplication

  beforeEach(() => {
    ad = new AntiDuplication()
  })

  // ── 1. Same query from different agents — only first executes ──────────

  it('only executes once for the same query from different agents', async () => {
    let executeCount = 0
    const key: SearchKey = { type: 'code-search', query: 'auth system' }

    const execute = async () => {
      executeCount++
      return 'result from auth search'
    }

    const [r1, r2] = await Promise.all([
      ad.deduplicate(key, 'AgentA', execute),
      ad.deduplicate(key, 'AgentB', execute),
    ])

    expect(executeCount).toBe(1)
    expect(r1.cached).toBe(false)
    expect(r2.cached).toBe(true)
    expect(r1.result).toBe('result from auth search')
    expect(r2.result).toBe('result from auth search')
  })

  // ── 2. Cached result returned within TTL ──────────────────────────────

  it('returns cached result within TTL', async () => {
    const key: SearchKey = { type: 'doc-lookup', query: 'SystemObserver API' }

    const r1 = await ad.deduplicate(key, 'AgentA', async () => 'API docs content')
    expect(r1.cached).toBe(false)

    const r2 = await ad.deduplicate(key, 'AgentB', async () => 'should not run')
    expect(r2.cached).toBe(true)
    expect(r2.result).toBe('API docs content')
  })

  // ── 3. Stale cache entries are cleared after TTL ──────────────────────

  it('clears stale cache entries after TTL', async () => {
    // Use a mock TTL by manipulating Date.now via a small delay
    const key: SearchKey = { type: 'arch-analysis', query: 'component tree' }

    await ad.deduplicate(key, 'AgentA', async () => 'architecture data')

    // Wait for TTL to expire (default is 60s, so we need a shorter one)
    // We'll set ttlMs via type assertion to avoid exposing it
    // For this test, we use clearStale with time passage
    const adShort = new AntiDuplication()
    Object.defineProperty(adShort, 'ttlMs', { value: 10, writable: true })

    const shortKey: SearchKey = { type: 'pattern-find', query: 'race condition' }
    await adShort.deduplicate(shortKey, 'AgentA', async () => 'pattern data')

    // Wait past TTL
    await new Promise(r => setTimeout(r, 20))

    adShort.clearStale()

    // Should execute again since cache is stale
    let execCount = 0
    await adShort.deduplicate(shortKey, 'AgentB', async () => { execCount++; return 'fresh data' })
    expect(execCount).toBe(1)
  })

  // ── 4. Different queries are not deduplicated ─────────────────────────

  it('does not deduplicate different queries', async () => {
    let countA = 0
    let countB = 0

    const [r1, r2] = await Promise.all([
      ad.deduplicate({ type: 'code-search', query: 'auth' }, 'AgentA', async () => { countA++; return 'auth' }),
      ad.deduplicate({ type: 'code-search', query: 'billing' }, 'AgentB', async () => { countB++; return 'billing' }),
    ])

    expect(countA).toBe(1)
    expect(countB).toBe(1)
    expect(r1.cached).toBe(false)
    expect(r2.cached).toBe(false)
    expect(r1.result).toBe('auth')
    expect(r2.result).toBe('billing')
  })

  // ── 5. In-flight wait works (two agents same query) ───────────────────

  it('waits for in-flight search from another agent', async () => {
    let resolve!: (v: string) => void
    const slowPromise = new Promise<string>(r => { resolve = r })

    const key: SearchKey = { type: 'doc-lookup', query: 'heavy computation' }

    // Start first deduplicate (won't resolve until we trigger resolve)
    const promise1 = ad.deduplicate(key, 'AgentA', async () => slowPromise)

    // Small yield to ensure inFlight is set
    await new Promise(r => setTimeout(r, 5))

    // Second call — should attach to the same in-flight promise
    const promise2 = ad.deduplicate(key, 'AgentB', async () => 'should not run')

    resolve!('heavy result')
    const [r1, r2] = await Promise.all([promise1, promise2])

    expect(r1.cached).toBe(false)
    expect(r2.cached).toBe(true)
    expect(r1.result).toBe('heavy result')
    expect(r2.result).toBe('heavy result')
  })

  // ── 6. Different scopes are different keys ────────────────────────────

  it('treats different scopes as different keys', async () => {
    let countA = 0
    let countB = 0

    const [r1, r2] = await Promise.all([
      ad.deduplicate({ type: 'code-search', query: 'logger', scope: 'src/' }, 'AgentA', async () => { countA++; return 'src logger' }),
      ad.deduplicate({ type: 'code-search', query: 'logger', scope: 'tests/' }, 'AgentB', async () => { countB++; return 'test logger' }),
    ])

    expect(countA).toBe(1)
    expect(countB).toBe(1)
    expect(r1.cached).toBe(false)
    expect(r2.cached).toBe(false)
    expect(r1.result).toBe('src logger')
    expect(r2.result).toBe('test logger')
  })

  // ── 7. clearStale removes expired entries ─────────────────────────────

  it('removes only expired entries on clearStale', async () => {
    const adShort = new AntiDuplication()
    Object.defineProperty(adShort, 'ttlMs', { value: 5, writable: true })

    const freshKey: SearchKey = { type: 'code-search', query: 'fresh' }
    const staleKey: SearchKey = { type: 'code-search', query: 'stale' }

    await adShort.deduplicate(staleKey, 'AgentA', async () => 'stale data')

    // Wait for stale entry to expire
    await new Promise(r => setTimeout(r, 10))

    await adShort.deduplicate(freshKey, 'AgentB', async () => 'fresh data')

    adShort.clearStale()

    // staleKey should re-execute (cache was cleared)
    let staleCount = 0
    const rStale = await adShort.deduplicate(staleKey, 'AgentC', async () => { staleCount++; return 'new stale' })
    expect(staleCount).toBe(1)
    expect(rStale.cached).toBe(false)

    // freshKey should still be cached
    const rFresh = await adShort.deduplicate(freshKey, 'AgentD', async () => 'should not run')
    expect(rFresh.cached).toBe(true)
    expect(rFresh.result).toBe('fresh data')
  })

  // ── 8. cache:true flag set on cached results ──────────────────────────

  it('sets cached:true on deduplicated results', async () => {
    const key: SearchKey = { type: 'pattern-find', query: 'singleton pattern' }

    const r1 = await ad.deduplicate(key, 'AgentA', async () => 'singleton analysis')
    expect(r1.cached).toBe(false)

    const r2 = await ad.deduplicate(key, 'AgentB', async () => 'should not run')
    expect(r2.cached).toBe(true)

    const r3 = await ad.deduplicate(key, 'AgentC', async () => 'should not run')
    expect(r3.cached).toBe(true)
  })
})
