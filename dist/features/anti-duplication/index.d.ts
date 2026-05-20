export interface SearchKey {
    type: 'code-search' | 'doc-lookup' | 'arch-analysis' | 'pattern-find';
    query: string;
    scope?: string;
}
export interface SearchResult {
    key: SearchKey;
    result: string;
    agentName: string;
    timestamp: number;
    cached: boolean;
}
export declare class AntiDuplication {
    private inFlight;
    private completed;
    private ttlMs;
    deduplicate(key: SearchKey, agentName: string, execute: () => Promise<string>): Promise<SearchResult>;
    clearStale(): void;
    private buildKey;
}
//# sourceMappingURL=index.d.ts.map