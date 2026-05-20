import { log } from '../../utils/logger';
export class TransparencyLog {
    entries = [];
    nextId = 1;
    maxEntries = 1000;
    record(entry) {
        const fullEntry = {
            ...entry,
            id: this.nextId++,
            timestamp: entry.timestamp ?? Date.now(),
        };
        this.entries.push(fullEntry);
        // Trim old entries if exceeding max
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
        log('[transparency-log] recorded', {
            type: entry.type,
            sessionId: entry.sessionId,
            message: entry.message.slice(0, 50),
        });
    }
    query(query = {}) {
        let filtered = [...this.entries];
        if (query.type) {
            filtered = filtered.filter(e => e.type === query.type);
        }
        if (query.sessionId) {
            filtered = filtered.filter(e => e.sessionId === query.sessionId);
        }
        if (query.since) {
            filtered = filtered.filter(e => e.timestamp >= query.since);
        }
        const limit = query.limit ?? 50;
        return filtered.slice(-limit);
    }
    getRecent(limit = 20) {
        return this.entries.slice(-limit);
    }
    getBySession(sessionId) {
        return this.entries.filter(e => e.sessionId === sessionId);
    }
    getByType(type) {
        return this.entries.filter(e => e.type === type);
    }
    getStats() {
        const byType = {};
        const bySession = {};
        for (const entry of this.entries) {
            byType[entry.type] = (byType[entry.type] ?? 0) + 1;
            bySession[entry.sessionId] = (bySession[entry.sessionId] ?? 0) + 1;
        }
        return {
            totalEntries: this.entries.length,
            byType,
            bySession,
            oldestEntry: this.entries[0]?.timestamp ?? 0,
            newestEntry: this.entries[this.entries.length - 1]?.timestamp ?? 0,
        };
    }
    formatLog(entries) {
        if (entries.length === 0) {
            return '📋 Transparency Log\n\nNo entries found.';
        }
        const lines = [];
        lines.push('📋 Transparency Log');
        lines.push('═'.repeat(40));
        lines.push('');
        const typeIcons = {
            model_routing: '🧠',
            agent_selection: '🤖',
            circuit_breaker: '🛡️',
            feature_trigger: '⚡',
            error: '❌',
            warning: '⚠️',
            decision: '🎯',
            plan_phase: '📋',
            audit_result: '🔍',
            review_verdict: '✅',
            security_finding: '🔒',
            learning_applied: '💡',
            prediction_made: '🔮',
            benchmark_recorded: '📊',
        };
        for (const entry of entries) {
            const icon = typeIcons[entry.type] ?? '📝';
            const time = new Date(entry.timestamp).toLocaleTimeString();
            lines.push(`${icon} [${time}] ${entry.message}`);
            if (entry.details && Object.keys(entry.details).length > 0) {
                const detailsStr = Object.entries(entry.details)
                    .map(([k, v]) => `   ${k}: ${v}`)
                    .join('\n');
                lines.push(detailsStr);
            }
            if (entry.confidence !== undefined) {
                lines.push(`   Confidence: ${(entry.confidence * 100).toFixed(0)}%`);
            }
            lines.push('');
        }
        const stats = this.getStats();
        lines.push(`📊 ${stats.totalEntries} total entries across ${Object.keys(stats.bySession).length} sessions`);
        return lines.join('\n');
    }
    clear() {
        this.entries = [];
        this.nextId = 1;
    }
}
export function createTransparencyLog() {
    return new TransparencyLog();
}
//# sourceMappingURL=index.js.map