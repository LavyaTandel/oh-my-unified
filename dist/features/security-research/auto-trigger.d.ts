export interface SecurityTriggerResult {
    triggered: boolean;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    suggestedAction: string;
}
export declare class SecurityAutoTrigger {
    detectSensitiveWrite(filePath: string, content?: string): SecurityTriggerResult | null;
    shouldTrigger(filePath: string, content?: string): boolean;
    queueResearch(sessionId: string, reason: string): void;
    getTriggerStats(): {
        patterns: number;
        severity: Record<string, number>;
    };
}
export declare function createSecurityAutoTrigger(): SecurityAutoTrigger;
//# sourceMappingURL=auto-trigger.d.ts.map