import { describe, test, expect, beforeEach } from 'bun:test';
import { createLearningEngine } from './index';
describe('LearningEngine', () => {
    let engine;
    beforeEach(() => {
        engine = createLearningEngine(':memory:');
    });
    test('saves and retrieves lessons', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'build REST API with authentication',
            description: 'Use JWT tokens with refresh mechanism',
            outcome: 'success',
            modelUsed: 'test-model',
            confidence: 0.8,
        });
        const lessons = engine.getLessonsByCategory('planning');
        expect(lessons.length).toBe(1);
        expect(lessons[0].pattern).toBe('build REST API with authentication');
        expect(lessons[0].confidence).toBe(0.8);
    });
    test('finds relevant lessons by pattern matching', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'implementation',
            lessonType: 'best_practice',
            pattern: 'React component with hooks and state management',
            description: 'Use custom hooks for complex state logic',
            outcome: 'success',
            confidence: 0.9,
        });
        const matches = engine.findRelevantLessons('implementation', 'React hooks state');
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].similarity).toBeGreaterThan(0.2);
    });
    test('records lesson application', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'debugging',
            lessonType: 'failure_pattern',
            pattern: 'async race condition in data fetching',
            description: 'Use abort controller to cancel stale requests',
            outcome: 'success',
            confidence: 0.7,
        });
        const lessons = engine.getLessonsByCategory('debugging');
        expect(lessons[0].applied_count).toBe(0);
        engine.recordLessonApplied(lessons[0].id);
        const updated = engine.getLessonsByCategory('debugging');
        expect(updated[0].applied_count).toBe(1);
    });
    test('updates lesson confidence', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'review',
            lessonType: 'optimization',
            pattern: 'code review checklist',
            description: 'Check for null safety, error handling, and performance',
            outcome: 'success',
            confidence: 0.5,
        });
        const lessons = engine.getLessonsByCategory('review');
        engine.updateLessonConfidence(lessons[0].id, 0.2);
        const updated = engine.getLessonsByCategory('review');
        expect(updated[0].confidence).toBeCloseTo(0.7, 1);
    });
    test('generates learning stats', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'pattern 1',
            description: 'desc 1',
            outcome: 'success',
            confidence: 0.8,
        });
        engine.saveLesson({
            sessionId: 's2',
            taskCategory: 'implementation',
            lessonType: 'failure_pattern',
            pattern: 'pattern 2',
            description: 'desc 2',
            outcome: 'failure',
            confidence: 0.6,
        });
        const stats = engine.getStats();
        expect(stats.totalLessons).toBe(2);
        expect(stats.byType['success_pattern']).toBe(1);
        expect(stats.byType['failure_pattern']).toBe(1);
        expect(stats.byCategory['planning']).toBe(1);
        expect(stats.byCategory['implementation']).toBe(1);
        expect(stats.byOutcome['success']).toBe(1);
        expect(stats.byOutcome['failure']).toBe(1);
    });
    test('gets top lessons by confidence', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'low confidence',
            description: 'desc',
            outcome: 'success',
            confidence: 0.3,
        });
        engine.saveLesson({
            sessionId: 's2',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'high confidence',
            description: 'desc',
            outcome: 'success',
            confidence: 0.9,
        });
        const top = engine.getTopLessons(1);
        expect(top.length).toBe(1);
        expect(top[0].confidence).toBe(0.9);
    });
    test('prunes low confidence lessons', () => {
        engine.saveLesson({
            sessionId: 's1',
            taskCategory: 'planning',
            lessonType: 'success_pattern',
            pattern: 'keep',
            description: 'desc',
            outcome: 'success',
            confidence: 0.5,
        });
        engine.saveLesson({
            sessionId: 's2',
            taskCategory: 'planning',
            lessonType: 'failure_pattern',
            pattern: 'remove',
            description: 'desc',
            outcome: 'failure',
            confidence: 0.05,
        });
        const pruned = engine.pruneLowConfidence(0.1);
        expect(pruned).toBe(1);
        const remaining = engine.getLessonsByCategory('planning');
        expect(remaining.length).toBe(1);
        expect(remaining[0].pattern).toBe('keep');
    });
});
//# sourceMappingURL=index.test.js.map