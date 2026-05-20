import { Database } from '../../utils/sqlite.js';
export class MetricsCollector {
    db;
    dailyBudget;
    costPerModel;
    constructor(dbPath = ':memory:', options) {
        this.db = new Database(dbPath);
        this.dailyBudget = options?.dailyBudget ?? 10.0; // $10 default daily budget
        this.costPerModel = options?.costPerModel ?? DEFAULT_COST_PER_MODEL;
        this.db.run('PRAGMA journal_mode=WAL');
        this.migrate();
    }
    migrate() {
        this.db.run(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        agent TEXT,
        model TEXT,
        feature TEXT,
        value REAL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      )
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(type)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_session ON metrics(session_id)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)
    `);
        this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_model ON metrics(model)
    `);
    }
    record(event) {
        const timestamp = event.timestamp ?? Date.now();
        this.db.prepare(`INSERT INTO metrics (type, session_id, agent, model, feature, value, metadata, timestamp)
       VALUES ($type, $sessionId, $agent, $model, $feature, $value, $metadata, $timestamp)`).run({
            $type: event.type,
            $sessionId: event.sessionId,
            $agent: event.agent ?? null,
            $model: event.model ?? null,
            $feature: event.feature ?? null,
            $value: event.value ?? null,
            $metadata: event.metadata ? JSON.stringify(event.metadata) : null,
            $timestamp: timestamp,
        });
    }
    query(query) {
        const conditions = [];
        const params = {};
        if (query.type) {
            conditions.push('type = $type');
            params.$type = query.type;
        }
        if (query.sessionId) {
            conditions.push('session_id = $sessionId');
            params.$sessionId = query.sessionId;
        }
        if (query.agent) {
            conditions.push('agent = $agent');
            params.$agent = query.agent;
        }
        if (query.model) {
            conditions.push('model = $model');
            params.$model = query.model;
        }
        if (query.feature) {
            conditions.push('feature = $feature');
            params.$feature = query.feature;
        }
        if (query.since) {
            conditions.push('timestamp >= $since');
            params.$since = query.since;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = query.limit ?? 100;
        const rows = this.db
            .prepare(`SELECT * FROM metrics ${whereClause} ORDER BY timestamp DESC LIMIT $limit`)
            .all({ ...params, $limit: limit });
        return rows.map((row) => ({
            id: row.id,
            type: row.type,
            sessionId: row.session_id,
            agent: row.agent ?? undefined,
            model: row.model ?? undefined,
            feature: row.feature ?? undefined,
            value: row.value ?? undefined,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            timestamp: row.timestamp,
        }));
    }
    getSummary(query = {}) {
        const conditions = [];
        const params = {};
        if (query.type) {
            conditions.push('type = $type');
            params.$type = query.type;
        }
        if (query.sessionId) {
            conditions.push('session_id = $sessionId');
            params.$sessionId = query.sessionId;
        }
        if (query.agent) {
            conditions.push('agent = $agent');
            params.$agent = query.agent;
        }
        if (query.model) {
            conditions.push('model = $model');
            params.$model = query.model;
        }
        if (query.feature) {
            conditions.push('feature = $feature');
            params.$feature = query.feature;
        }
        if (query.since) {
            conditions.push('timestamp >= $since');
            params.$since = query.since;
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const totalCount = this.db
            .prepare(`SELECT COUNT(*) as total FROM metrics ${whereClause}`)
            .get(params)?.total ?? 0;
        const byTypeRows = this.db
            .prepare(`SELECT type, COUNT(*) as count FROM metrics ${whereClause} GROUP BY type`)
            .all(params);
        const byModelRows = this.db
            .prepare(`SELECT model, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? 'AND' : 'WHERE'} model IS NOT NULL GROUP BY model`)
            .all(params);
        const byAgentRows = this.db
            .prepare(`SELECT agent, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? 'AND' : 'WHERE'} agent IS NOT NULL GROUP BY agent`)
            .all(params);
        const byFeatureRows = this.db
            .prepare(`SELECT feature, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? 'AND' : 'WHERE'} feature IS NOT NULL GROUP BY feature`)
            .all(params);
        const avgValueRow = this.db
            .prepare(`SELECT AVG(value) as avg FROM metrics ${whereClause} ${conditions.length > 0 ? 'AND' : 'WHERE'} value IS NOT NULL`)
            .get(params);
        const totalValueRow = this.db
            .prepare(`SELECT SUM(value) as total FROM metrics ${whereClause} ${conditions.length > 0 ? 'AND' : 'WHERE'} value IS NOT NULL`)
            .get(params);
        const byType = {};
        for (const row of byTypeRows) {
            byType[row.type] = row.count;
        }
        const byModel = {};
        for (const row of byModelRows) {
            byModel[row.model ?? 'unknown'] = row.count;
        }
        const byAgent = {};
        for (const row of byAgentRows) {
            byAgent[row.agent ?? 'unknown'] = row.count;
        }
        const byFeature = {};
        for (const row of byFeatureRows) {
            byFeature[row.feature ?? 'unknown'] = row.count;
        }
        return {
            totalCount,
            byType,
            byModel,
            byAgent,
            byFeature,
            avgValue: avgValueRow?.avg ?? undefined,
            totalValue: totalValueRow?.total ?? undefined,
        };
    }
    recordTokenUsage(sessionId, model, inputTokens, outputTokens, agent) {
        const totalTokens = inputTokens + outputTokens;
        const cost = this.calculateCost(model, inputTokens, outputTokens);
        this.record({
            type: 'token_usage',
            sessionId,
            model,
            agent,
            value: totalTokens,
            metadata: JSON.stringify({ inputTokens, outputTokens, cost }),
        });
        this.record({
            type: 'cost_tracking',
            sessionId,
            model,
            agent,
            value: cost,
            metadata: JSON.stringify({ inputTokens, outputTokens, totalTokens }),
        });
    }
    calculateCost(model, inputTokens, outputTokens) {
        const rates = this.costPerModel[model] ?? this.costPerModel['default'];
        if (!rates)
            return 0;
        return (inputTokens * rates.inputPerToken) + (outputTokens * rates.outputPerToken);
    }
    getCostSummary(since) {
        const sinceTimestamp = since ?? (Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        const tokenRows = this.query({ type: 'token_usage', since: sinceTimestamp });
        const costRows = this.query({ type: 'cost_tracking', since: sinceTimestamp });
        let totalTokens = 0;
        let totalCost = 0;
        const byModel = {};
        const bySession = {};
        for (const row of tokenRows) {
            const tokens = row.value ?? 0;
            totalTokens += tokens;
            const meta = row.metadata;
            const cost = meta?.cost ?? 0;
            totalCost += cost;
            if (row.model) {
                if (!byModel[row.model]) {
                    byModel[row.model] = { tokens: 0, cost: 0 };
                }
                byModel[row.model].tokens += tokens;
                byModel[row.model].cost += cost;
            }
            if (row.sessionId) {
                if (!bySession[row.sessionId]) {
                    bySession[row.sessionId] = { tokens: 0, cost: 0 };
                }
                bySession[row.sessionId].tokens += tokens;
                bySession[row.sessionId].cost += cost;
            }
        }
        // Also sum cost from cost_tracking events
        for (const row of costRows) {
            const cost = row.value ?? 0;
            totalCost += cost;
            if (row.model) {
                if (!byModel[row.model]) {
                    byModel[row.model] = { tokens: 0, cost: 0 };
                }
                byModel[row.model].cost += cost;
            }
            if (row.sessionId) {
                if (!bySession[row.sessionId]) {
                    bySession[row.sessionId] = { tokens: 0, cost: 0 };
                }
                bySession[row.sessionId].cost += cost;
            }
        }
        return {
            totalTokens,
            totalCost,
            byModel,
            bySession,
            budgetRemaining: Math.max(0, this.dailyBudget - totalCost),
            budgetExceeded: totalCost > this.dailyBudget,
        };
    }
    shouldRouteToCheaperModel(currentModel) {
        const summary = this.getCostSummary();
        return summary.budgetExceeded || summary.budgetRemaining < this.dailyBudget * 0.2;
    }
    getCheapModelAlternative(currentModel) {
        // Return cheaper alternative models
        const cheapModels = ['opencode/deepseek-v4-flash-free', 'opencode/big-pickle'];
        return cheapModels[0];
    }
    getDailyBudget() {
        return this.dailyBudget;
    }
    setDailyBudget(budget) {
        this.dailyBudget = budget;
    }
    getMetricsCount() {
        const row = this.db
            .prepare('SELECT COUNT(*) as total FROM metrics')
            .get();
        return row?.total ?? 0;
    }
    clearOlderThan(days) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        this.db.prepare('DELETE FROM metrics WHERE timestamp < $cutoff').run({ $cutoff: cutoff });
    }
    close() {
        this.db.close();
    }
}
// Default cost per 1M tokens (approximate pricing)
const DEFAULT_COST_PER_MODEL = {
    'opencode/nemotron-3-super-free': { inputPerToken: 0, outputPerToken: 0 }, // Free tier
    'opencode/minimax-m2.5-free': { inputPerToken: 0, outputPerToken: 0 }, // Free tier
    'opencode/deepseek-v4-flash-free': { inputPerToken: 0, outputPerToken: 0 }, // Free tier
    'opencode/big-pickle': { inputPerToken: 0, outputPerToken: 0 }, // Free tier
    'default': { inputPerToken: 0.000001, outputPerToken: 0.000002 }, // $1/$2 per 1M tokens
};
export function createMetricsCollector(dbPath, options) {
    return new MetricsCollector(dbPath, options);
}
//# sourceMappingURL=collector.js.map