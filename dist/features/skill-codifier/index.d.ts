export interface PatternOccurrence {
    pattern: string;
    category: string;
    sessionId: string;
    timestamp: number;
    success: boolean;
    modelUsed?: string;
    tokensUsed?: number;
}
export interface SkillTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    triggerPatterns: string[];
    template: string;
    confidence: number;
    occurrenceCount: number;
    lastUsedAt: number;
    createdAt: number;
}
export interface SkillGenerationResult {
    generated: boolean;
    skill?: SkillTemplate;
    reason: string;
}
export declare class SkillCodifier {
    private occurrences;
    private generatedSkills;
    private threshold;
    constructor(options?: {
        threshold?: number;
    });
    recordOccurrence(occurrence: PatternOccurrence): void;
    shouldGenerateSkill(category: string, pattern: string): SkillGenerationResult;
    private generateSkillTemplate;
    private buildTemplateFromOccurrences;
    getGeneratedSkills(): SkillTemplate[];
    getSkill(id: string): SkillTemplate | undefined;
    getStats(): {
        totalOccurrences: number;
        uniquePatterns: number;
        generatedSkills: number;
        avgOccurrencesPerPattern: number;
    };
    clear(): void;
}
export declare function createSkillCodifier(options?: {
    threshold?: number;
}): SkillCodifier;
//# sourceMappingURL=index.d.ts.map