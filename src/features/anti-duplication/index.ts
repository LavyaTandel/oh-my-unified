// Anti-Duplication System
// Prevents multiple agents from searching/querying the same thing simultaneously.
// When Odin (@Odin) sends both @Sif and @Eir to research the "auth system",
// only ONE actually runs — the other gets the cached result.

export interface SearchKey {
  type: 'code-search' | 'doc-lookup' | 'arch-analysis' | 'pattern-find'
  query: string
  scope?: string
}

export interface SearchResult {
  key: SearchKey
  result: string
  agentName: string
  timestamp: number
  cached: boolean
}

export class AntiDuplication {
  private inFlight: Map<string, Promise<SearchResult>> = new Map()
  private completed: Map<string, SearchResult> = new Map()
  private ttlMs: number = 60000  // Cache results for 1 minute

  // Check if a search is already in progress or was recently completed
  async deduplicate(key: SearchKey, agentName: string, execute: () => Promise<string>): Promise<SearchResult> {
    const keyStr = this.buildKey(key)

    // Return cached result if available and fresh
    const cached = this.completed.get(keyStr)
    if (cached && (Date.now() - cached.timestamp) < this.ttlMs) {
      return { ...cached, cached: true }
    }

    // If same search is in flight by another agent, wait for it
    const inFlight = this.inFlight.get(keyStr)
    if (inFlight) {
      const result = await inFlight
      return { ...result, cached: true }
    }

    // Execute the search and cache it
    const promise = execute().then(content => {
      const result: SearchResult = { key, result: content, agentName, timestamp: Date.now(), cached: false }
      this.completed.set(keyStr, result)
      return result
    }).finally(() => {
      this.inFlight.delete(keyStr)
    })

    this.inFlight.set(keyStr, promise)
    return promise
  }

  // Clear stale cache entries
  clearStale(): void {
    const now = Date.now()
    for (const [key, result] of this.completed) {
      if (now - result.timestamp > this.ttlMs) {
        this.completed.delete(key)
      }
    }
  }

  private buildKey(key: SearchKey): string {
    return `${key.type}::${key.query}::${key.scope || ''}`
  }
}
