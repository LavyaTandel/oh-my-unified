export type LessonType = 'success_pattern' | 'failure_pattern' | 'optimization' | 'best_practice';
export type TaskCategory = 'planning' | 'implementation' | 'review' | 'debugging' | 'research' | 'refactoring' | 'testing';
export interface Lesson {
    id?: number;
    sessionId: string;
    taskCategory: TaskCategory;
    lessonType: LessonType;
    pattern: string;
    description: string;
    outcome: 'success' | 'failure' | 'partial';
    modelUsed?: string;
    agentUsed?: string;
    confidence: number;
    appliedCount: number;
    lastAppliedAt?: number;
    createdAt: number;
}
export interface PatternMatch {
    lesson: Lesson;
    similarity: number;
    reason: string;
}
export interface LearningStats {
    totalLessons: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byOutcome: Record<string, number>;
    avgConfidence: number;
    totalApplications: number;
}
export declare class LearningEngine {
    private db;
    constructor(dbPath?: string);
    private migrate;
    saveLesson(lesson: Omit<Lesson, 'id' | 'appliedCount' | 'createdAt'>): void;
    findRelevantLessons(taskCategory: TaskCategory, query: string): PatternMatch[];
    recordLessonApplied(lessonId: number): void;
    updateLessonConfidence(lessonId: number, delta: number): void;
    getStats(): LearningStats;
    getLessonsByCategory(category: TaskCategory): (Lesson & {
        id: number;
        applied_count: number;
    })[];
    getTopLessons(limit?: number): Lesson[];
    pruneLowConfidence(threshold?: number): number;
    close(): void;
}
export declare function createLearningEngine(dbPath?: string): LearningEngine;
//# sourceMappingURL=index.d.ts.map