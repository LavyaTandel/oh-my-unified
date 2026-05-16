import { Database } from '../../utils/sqlite.js';
import { log } from '../../utils/logger';

export interface BenchmarkResult {
  id?: number;
  model: string;
  taskCategory: string;
  sessionId: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  qualityScore: number; // 0-10
  timestamp: number;
}

export interface RegressionAlert {
  model: string;
  taskCategory: string;
  metric: 'latency' | 'cost' | 'quality';
  previousValue: number;
  currentValue: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: number;
}

export interface BenchmarkSummary {
  model: string;
  taskCategory: string;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  avgCost: number;
  avgQuality: number;
  totalRuns: number;
  lastRunAt: number;
}

export class BenchmarkTracker {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.db.run('PRAGMA journal_mode=WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        task_category TEXT NOT NULL,
        session_id TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost REAL NOT NULL,
        quality_score REAL NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_model ON benchmarks(model)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks(task_category)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_timestamp ON benchmarks(timestamp)
    `);
  }

  record(result: Omit<BenchmarkResult, 'id'>): void {
    this.db.prepare(
      `INSERT INTO benchmarks (model, task_category, session_id, latency_ms, input_tokens, output_tokens, cost, quality_score, timestamp)
       VALUES ($model, $taskCategory, $sessionId, $latencyMs, $inputTokens, $outputTokens, $cost, $qualityScore, $timestamp)`,
    ).run({
      $model: result.model,
      $taskCategory: result.taskCategory,
      $sessionId: result.sessionId,
      $latencyMs: result.latencyMs,
      $inputTokens: result.inputTokens,
      $outputTokens: result.outputTokens,
      $cost: result.cost,
      $qualityScore: result.qualityScore,
      $timestamp: result.timestamp,
    });

    log('[benchmark] recorded', {
      model: result.model,
      category: result.taskCategory,
      latency: result.latencyMs,
      quality: result.qualityScore,
    });
  }

  getSummary(model: string, taskCategory?: string): BenchmarkSummary | null {
    const conditions = ['model = $model'];
    const params: Record<string, string | number> = { $model: model };

    if (taskCategory) {
      conditions.push('task_category = $taskCategory');
      params.$taskCategory = taskCategory;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const rows = this.db
      .prepare(
        `SELECT * FROM benchmarks ${whereClause} ORDER BY timestamp DESC`,
      )
      .all(params) as Array<{
        id: number;
        model: string;
        task_category: string;
        session_id: string;
        latency_ms: number;
        input_tokens: number;
        output_tokens: number;
        cost: number;
        quality_score: number;
        timestamp: number;
      }>;

    if (rows.length === 0) return null;

    const latencies = rows.map(r => r.latency_ms).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
    const p50Latency = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const avgCost = rows.reduce((sum, r) => sum + r.cost, 0) / rows.length;
    const avgQuality = rows.reduce((sum, r) => sum + r.quality_score, 0) / rows.length;

    return {
      model,
      taskCategory: taskCategory ?? 'all',
      avgLatency,
      p50Latency,
      p95Latency,
      avgCost,
      avgQuality,
      totalRuns: rows.length,
      lastRunAt: rows[0].timestamp,
    };
  }

  detectRegressions(model: string, taskCategory: string, threshold = 0.2): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    const rows = this.db
      .prepare(
        `SELECT * FROM benchmarks WHERE model = $model AND task_category = $category ORDER BY timestamp DESC LIMIT 50`,
      )
      .all({ $model: model, $category: taskCategory }) as Array<{
        id: number;
        model: string;
        task_category: string;
        session_id: string;
        latency_ms: number;
        input_tokens: number;
        output_tokens: number;
        cost: number;
        quality_score: number;
        timestamp: number;
      }>;

    if (rows.length < 10) return alerts;

    const recent = rows.slice(0, 5);
    const previous = rows.slice(5, 25);

    const recentAvgLatency = recent.reduce((sum, r) => sum + r.latency_ms, 0) / recent.length;
    const previousAvgLatency = previous.reduce((sum, r) => sum + r.latency_ms, 0) / previous.length;

    const recentAvgCost = recent.reduce((sum, r) => sum + r.cost, 0) / recent.length;
    const previousAvgCost = previous.reduce((sum, r) => sum + r.cost, 0) / previous.length;

    const recentAvgQuality = recent.reduce((sum, r) => sum + r.quality_score, 0) / recent.length;
    const previousAvgQuality = previous.reduce((sum, r) => sum + r.quality_score, 0) / previous.length;

    // Latency regression
    if (previousAvgLatency > 0) {
      const latencyChange = (recentAvgLatency - previousAvgLatency) / previousAvgLatency;
      if (latencyChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: 'latency',
          previousValue: previousAvgLatency,
          currentValue: recentAvgLatency,
          changePercent: latencyChange * 100,
          severity: latencyChange > 0.5 ? 'high' : latencyChange > 0.3 ? 'medium' : 'low',
          detectedAt: Date.now(),
        });
      }
    }

    // Cost regression
    if (previousAvgCost > 0) {
      const costChange = (recentAvgCost - previousAvgCost) / previousAvgCost;
      if (costChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: 'cost',
          previousValue: previousAvgCost,
          currentValue: recentAvgCost,
          changePercent: costChange * 100,
          severity: costChange > 0.5 ? 'high' : costChange > 0.3 ? 'medium' : 'low',
          detectedAt: Date.now(),
        });
      }
    }

    // Quality regression
    if (previousAvgQuality > 0) {
      const qualityChange = (previousAvgQuality - recentAvgQuality) / previousAvgQuality;
      if (qualityChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: 'quality',
          previousValue: previousAvgQuality,
          currentValue: recentAvgQuality,
          changePercent: qualityChange * 100,
          severity: qualityChange > 0.5 ? 'high' : qualityChange > 0.3 ? 'medium' : 'low',
          detectedAt: Date.now(),
        });
      }
    }

    return alerts;
  }

  getAllSummaries(): BenchmarkSummary[] {
    const modelCategoryPairs = this.db
      .prepare<{ model: string; task_category: string }>(
        'SELECT DISTINCT model, task_category FROM benchmarks',
      )
      .all();

    const summaries: BenchmarkSummary[] = [];
    for (const pair of modelCategoryPairs) {
      const summary = this.getSummary(pair.model, pair.task_category);
      if (summary) summaries.push(summary);
    }

    return summaries;
  }

  clearOlderThan(days: number): void {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    this.db.prepare('DELETE FROM benchmarks WHERE timestamp < $cutoff').run({ $cutoff: cutoff });
  }

  close(): void {
    this.db.close();
  }
}

export function createBenchmarkTracker(dbPath?: string): BenchmarkTracker {
  return new BenchmarkTracker(dbPath);
}
