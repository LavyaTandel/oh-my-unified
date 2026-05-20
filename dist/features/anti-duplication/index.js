// Anti-Duplication System
// Prevents multiple agents from searching/querying the same thing simultaneously.
// When Odin (@Odin) sends both @Sif and @Eir to research the "auth system",
// only ONE actually runs — the other gets the cached result.
export class AntiDuplication {
    inFlight = new Map();
    completed = new Map();
    ttlMs = 60000; // Cache results for 1 minute
    // Check if a search is already in progress or was recently completed
    async deduplicate(key, agentName, execute) {
        const keyStr = this.buildKey(key);
        // Return cached result if available and fresh
        const cached = this.completed.get(keyStr);
        if (cached && (Date.now() - cached.timestamp) < this.ttlMs) {
            return { ...cached, cached: true };
        }
        // If same search is in flight by another agent, wait for it
        const inFlight = this.inFlight.get(keyStr);
        if (inFlight) {
            const result = await inFlight;
            return { ...result, cached: true };
        }
        // Execute the search and cache it
        const promise = execute().then(content => {
            const result = { key, result: content, agentName, timestamp: Date.now(), cached: false };
            this.completed.set(keyStr, result);
            return result;
        }).finally(() => {
            this.inFlight.delete(keyStr);
        });
        this.inFlight.set(keyStr, promise);
        return promise;
    }
    // Clear stale cache entries
    clearStale() {
        const now = Date.now();
        for (const [key, result] of this.completed) {
            if (now - result.timestamp > this.ttlMs) {
                this.completed.delete(key);
            }
        }
    }
    buildKey(key) {
        return `${key.type}::${key.query}::${key.scope || ''}`;
    }
}
//# sourceMappingURL=index.js.map