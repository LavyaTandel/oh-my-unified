import { describe, test, expect, beforeEach } from 'bun:test';
import { createSkillCodifier } from './index';
describe('SkillCodifier', () => {
    let codifier;
    beforeEach(() => {
        codifier = createSkillCodifier({ threshold: 3 });
    });
    test('records occurrences', () => {
        codifier.recordOccurrence({
            pattern: 'build REST API',
            category: 'implementation',
            sessionId: 's1',
            timestamp: Date.now(),
            success: true,
        });
        const result = codifier.shouldGenerateSkill('implementation', 'build REST API');
        expect(result.generated).toBe(false);
        expect(result.reason).toContain('1/3');
    });
    test('generates skill after threshold', () => {
        for (let i = 0; i < 3; i++) {
            codifier.recordOccurrence({
                pattern: 'build REST API',
                category: 'implementation',
                sessionId: `s${i}`,
                timestamp: Date.now(),
                success: true,
            });
        }
        const result = codifier.shouldGenerateSkill('implementation', 'build REST API');
        expect(result.generated).toBe(true);
        expect(result.skill).toBeDefined();
        expect(result.skill?.name).toContain('build REST API');
        expect(result.skill?.confidence).toBe(1.0);
    });
    test('does not generate skill with low success rate', () => {
        for (let i = 0; i < 3; i++) {
            codifier.recordOccurrence({
                pattern: 'build REST API',
                category: 'implementation',
                sessionId: `s${i}`,
                timestamp: Date.now(),
                success: false,
            });
        }
        const result = codifier.shouldGenerateSkill('implementation', 'build REST API');
        expect(result.generated).toBe(false);
        expect(result.reason).toContain('Success rate too low');
    });
    test('does not generate duplicate skills', () => {
        for (let i = 0; i < 6; i++) {
            codifier.recordOccurrence({
                pattern: 'build REST API',
                category: 'implementation',
                sessionId: `s${i}`,
                timestamp: Date.now(),
                success: true,
            });
        }
        const result1 = codifier.shouldGenerateSkill('implementation', 'build REST API');
        expect(result1.generated).toBe(true);
        const result2 = codifier.shouldGenerateSkill('implementation', 'build REST API');
        expect(result2.generated).toBe(false);
        expect(result2.reason).toContain('already generated');
    });
    test('generates stats', () => {
        codifier.recordOccurrence({
            pattern: 'pattern1',
            category: 'implementation',
            sessionId: 's1',
            timestamp: Date.now(),
            success: true,
        });
        codifier.recordOccurrence({
            pattern: 'pattern2',
            category: 'review',
            sessionId: 's2',
            timestamp: Date.now(),
            success: true,
        });
        const stats = codifier.getStats();
        expect(stats.totalOccurrences).toBe(2);
        expect(stats.uniquePatterns).toBe(2);
        expect(stats.generatedSkills).toBe(0);
        expect(stats.avgOccurrencesPerPattern).toBe(1);
    });
    test('clears all data', () => {
        codifier.recordOccurrence({
            pattern: 'build REST API',
            category: 'implementation',
            sessionId: 's1',
            timestamp: Date.now(),
            success: true,
        });
        codifier.clear();
        const stats = codifier.getStats();
        expect(stats.totalOccurrences).toBe(0);
    });
});
//# sourceMappingURL=index.test.js.map