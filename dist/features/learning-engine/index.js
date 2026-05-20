import { Database } from '../../utils/sqlite.js';
import { log } from '../../utils/logger';
export class LearningEngine {
    db;
    constructor(dbPath = ':memory:') {
        this.db = new Database(dbPath);
        this.db.run('PRAGMA journal_mode=WAL');
        this.migrate();
    }
    migrate() {
        this.db.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        task_category TEXT NOT NULL,
        lesson_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        description TEXT NOT NULL,
        outcome TEXT NOT NULL,
        model_used TEXT,
        agent_used TEXT,
        confidence REAL NOT NULL DEFAULT 0.5,
        applied_count INTEGER NOT NULL DEFAULT 0,
        last_applied_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(task_category)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(lesson_type)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_pattern ON lessons(pattern)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_confidence ON lessons(confidence)
    `);
    }
    saveLesson(lesson) {
        this.db.prepare(`INSERT INTO lessons (session_id, task_category, lesson_type, pattern, description, outcome, model_used, agent_used, confidence, applied_count, created_at)
       VALUES ($sessionId, $taskCategory, $lessonType, $pattern, $description, $outcome, $modelUsed, $agentUsed, $confidence, $appliedCount, $createdAt)`).run({
            $sessionId: lesson.sessionId,
            $taskCategory: lesson.taskCategory,
            $lessonType: lesson.lessonType,
            $pattern: lesson.pattern,
            $description: lesson.description,
            $outcome: lesson.outcome,
            $modelUsed: lesson.modelUsed ?? null,
            $agentUsed: lesson.agentUsed ?? null,
            $confidence: lesson.confidence,
            $appliedCount: 0,
            $createdAt: Date.now(),
        });
        log('[learning-engine] lesson saved', {
            category: lesson.taskCategory,
            type: lesson.lessonType,
            outcome: lesson.outcome,
        });
    }
    findRelevantLessons(taskCategory, query) {
        const lessons = this.db
            .prepare(`SELECT * FROM lessons WHERE task_category = $category AND confidence > 0.3 ORDER BY confidence DESC, applied_count DESC LIMIT 20`)
            .all({ $category: taskCategory });
        const matches = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        for (const lesson of lessons) {
            let similarity = 0;
            const reasons = [];
            // Pattern matching
            const patternLower = lesson.pattern.toLowerCase();
            if (patternLower.includes(queryLower)) {
                similarity += 0.5;
                reasons.push('exact pattern match');
            }
            // Word overlap
            const patternWords = patternLower.split(/\s+/);
            let wordMatches = 0;
            for (const word of queryWords) {
                if (patternWords.some(pw => pw.includes(word) || word.includes(pw))) {
                    wordMatches++;
                }
            }
            if (queryWords.length > 0) {
                const wordSimilarity = wordMatches / queryWords.length;
                similarity += wordSimilarity * 0.3;
                if (wordMatches > 0)
                    reasons.push(`${wordMatches} word matches`);
            }
            // Description matching
            const descLower = lesson.description.toLowerCase();
            if (descLower.includes(queryLower)) {
                similarity += 0.2;
                reasons.push('description match');
            }
            if (similarity > 0.2) {
                matches.push({
                    lesson,
                    similarity: Math.min(similarity, 1.0),
                    reason: reasons.join(', '),
                });
            }
        }
        return matches.sort((a, b) => b.similarity - a.similarity);
    }
    recordLessonApplied(lessonId) {
        this.db.prepare(`UPDATE lessons SET applied_count = applied_count + 1, last_applied_at = $now WHERE id = $id`).run({ $id: lessonId, $now: Date.now() });
    }
    updateLessonConfidence(lessonId, delta) {
        this.db.prepare(`UPDATE lessons SET confidence = MAX(0, MIN(1, confidence + $delta)) WHERE id = $id`).run({ $id: lessonId, $delta: delta });
    }
    getStats() {
        const totalRow = this.db
            .prepare('SELECT COUNT(*) as total FROM lessons')
            .get();
        const byTypeRows = this.db
            .prepare('SELECT lesson_type, COUNT(*) as count FROM lessons GROUP BY lesson_type')
            .all();
        const byCategoryRows = this.db
            .prepare('SELECT task_category, COUNT(*) as count FROM lessons GROUP BY task_category')
            .all();
        const byOutcomeRows = this.db
            .prepare('SELECT outcome, COUNT(*) as count FROM lessons GROUP BY outcome')
            .all();
        const avgConfRow = this.db
            .prepare('SELECT AVG(confidence) as avg FROM lessons')
            .get();
        const totalAppsRow = this.db
            .prepare('SELECT SUM(applied_count) as total FROM lessons')
            .get();
        const byType = {};
        for (const row of byTypeRows) {
            byType[row.lesson_type] = row.count;
        }
        const byCategory = {};
        for (const row of byCategoryRows) {
            byCategory[row.task_category] = row.count;
        }
        const byOutcome = {};
        for (const row of byOutcomeRows) {
            byOutcome[row.outcome] = row.count;
        }
        return {
            totalLessons: totalRow?.total ?? 0,
            byType,
            byCategory,
            byOutcome,
            avgConfidence: avgConfRow?.avg ?? 0,
            totalApplications: totalAppsRow?.total ?? 0,
        };
    }
    getLessonsByCategory(category) {
        return this.db
            .prepare('SELECT * FROM lessons WHERE task_category = $category ORDER BY confidence DESC')
            .all({ $category: category });
    }
    getTopLessons(limit = 10) {
        return this.db
            .prepare('SELECT * FROM lessons ORDER BY confidence DESC, applied_count DESC LIMIT $limit')
            .all({ $limit: limit });
    }
    pruneLowConfidence(threshold = 0.1) {
        const result = this.db
            .prepare('DELETE FROM lessons WHERE confidence < $threshold')
            .run({ $threshold: threshold });
        return result.changes;
    }
    close() {
        this.db.close();
    }
}
export function createLearningEngine(dbPath) {
    return new LearningEngine(dbPath);
}
//# sourceMappingURL=index.js.map