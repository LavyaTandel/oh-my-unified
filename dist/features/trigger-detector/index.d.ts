export type MatchMode = 'includes' | 'exact' | 'regex' | 'fuzzy';
export interface TriggerRule {
    feature: string;
    keywords: string[];
    mode?: MatchMode;
    priority?: number;
    enabled?: boolean;
}
export interface TriggerMatch {
    feature: string;
    matchedKeyword: string;
    priority: number;
    mode: MatchMode;
}
export declare class TriggerDetector {
    private rules;
    register(rule: TriggerRule): void;
    registerMany(rules: TriggerRule[]): void;
    detect(input: string): TriggerMatch | null;
    detectAll(input: string): TriggerMatch[];
    isEnabled(feature: string): boolean;
    setEnabled(feature: string, enabled: boolean): void;
    getRules(): TriggerRule[];
    clear(): void;
    private matches;
}
export declare function createDefaultTriggerDetector(): TriggerDetector;
//# sourceMappingURL=index.d.ts.map