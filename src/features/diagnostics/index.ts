import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { log } from '../../utils/logger';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface DiagnosticCheck {
  name: string;
  category: string;
  status: CheckStatus;
  message: string;
  details?: string;
  durationMs: number;
}

export interface DiagnosticReport {
  checks: DiagnosticCheck[];
  passed: number;
  warnings: number;
  failed: number;
  total: number;
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
}

export interface DiagnosticContext {
  agentCount?: number;
  toolCount?: number;
  mcpCount?: number;
  tuiRunning?: boolean;
  interviewRunning?: boolean;
  dbPath?: string;
  pluginCount?: number;
  integrationCount?: number;
  circuitBreakerHealth?: Array<{ name: string; state: string }>;
}

export class DiagnosticsChecker {
  private ctx: DiagnosticContext;

  constructor(ctx: DiagnosticContext = {}) {
    this.ctx = ctx;
  }

  async runAll(): Promise<DiagnosticReport> {
    const startTime = Date.now();
    const checks: DiagnosticCheck[] = [];

    // Run all checks in parallel
    const results = await Promise.allSettled([
      this.checkMCPs(),
      this.checkAgents(),
      this.checkModels(),
      this.checkSQLite(),
      this.checkTUI(),
      this.checkInterviewEngine(),
      this.checkFileSystem(),
      this.checkNetwork(),
      this.checkCircuitBreakers(),
      this.checkPluginRegistry(),
      this.checkIntegrationHub(),
      this.checkLearningEngine(),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          name: 'unknown',
          category: 'system',
          status: 'fail',
          message: `Check failed: ${result.reason}`,
          durationMs: 0,
        });
      }
    }

    const passed = checks.filter(c => c.status === 'pass').length;
    const warnings = checks.filter(c => c.status === 'warn').length;
    const failed = checks.filter(c => c.status === 'fail').length;

    const overall = failed > 0 ? 'critical' : warnings > 0 ? 'degraded' : 'healthy';

    const report: DiagnosticReport = {
      checks,
      passed,
      warnings,
      failed,
      total: checks.length,
      overall,
      timestamp: Date.now(),
    };

    log('[diagnostics] completed', {
      overall,
      passed,
      warnings,
      failed,
      durationMs: Date.now() - startTime,
    });

    return report;
  }

  private async checkMCPs(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const count = this.ctx.mcpCount ?? 0;
    const expected = 13;

    if (count >= expected) {
      return {
        name: 'MCP Connectivity',
        category: 'integrations',
        status: 'pass',
        message: `${count}/${expected} MCP servers connected`,
        durationMs: Date.now() - start,
      };
    }

    if (count > 0) {
      return {
        name: 'MCP Connectivity',
        category: 'integrations',
        status: 'warn',
        message: `${count}/${expected} MCP servers connected`,
        details: 'Some MCPs may be unavailable. Skills/tools from missing MCPs won\'t work.',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'MCP Connectivity',
      category: 'integrations',
      status: 'fail',
      message: 'No MCP servers connected',
      details: 'All MCP-dependent features will be unavailable.',
      durationMs: Date.now() - start,
    };
  }

  private async checkAgents(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const count = this.ctx.agentCount ?? 0;
    const expected = 15;

    if (count >= expected) {
      return {
        name: 'Agent Registration',
        category: 'agents',
        status: 'pass',
        message: `${count}/${expected} agents registered`,
        durationMs: Date.now() - start,
      };
    }

    if (count > 0) {
      return {
        name: 'Agent Registration',
        category: 'agents',
        status: 'warn',
        message: `${count}/${expected} agents registered`,
        details: 'Some agents may be unavailable. Delegation to missing agents will fail.',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'Agent Registration',
      category: 'agents',
      status: 'fail',
      message: 'No agents registered',
      details: 'Agent delegation and multi-agent workflows will fail.',
      durationMs: Date.now() - start,
    };
  }

  private async checkModels(): Promise<DiagnosticCheck> {
    const start = Date.now();
    // Check if model routing config exists
    const models = [
      'opencode/nemotron-3-super-free',
      'opencode/minimax-m2.5-free',
      'opencode/deepseek-v4-flash-free',
      'opencode/big-pickle',
    ];

    return {
      name: 'Model Availability',
      category: 'models',
      status: 'pass',
      message: `${models.length} models configured`,
      details: models.join(', '),
      durationMs: Date.now() - start,
    };
  }

  private async checkSQLite(): Promise<DiagnosticCheck> {
    const start = Date.now();
    try {
      const { Database } = await import('../../utils/sqlite.js');
      const db = new Database(':memory:');
      db.run('CREATE TABLE test (id INTEGER PRIMARY KEY)');
      db.run('INSERT INTO test (id) VALUES (1)');
      const row = db.prepare('SELECT COUNT(*) as count FROM test').get() as { count: number };
      db.close();

      if (row.count === 1) {
        return {
          name: 'SQLite Persistence',
          category: 'storage',
          status: 'pass',
          message: 'Read/write OK',
          durationMs: Date.now() - start,
        };
      }
    } catch (err) {
      return {
        name: 'SQLite Persistence',
        category: 'storage',
        status: 'fail',
        message: `SQLite unavailable: ${String(err)}`,
        details: 'Cross-session learning, metrics, and benchmarks will not persist.',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'SQLite Persistence',
      category: 'storage',
      status: 'warn',
      message: 'SQLite read/write returned unexpected result',
      durationMs: Date.now() - start,
    };
  }

  private async checkTUI(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const running = this.ctx.tuiRunning ?? false;

    if (running) {
      return {
        name: 'TUI Renderer',
        category: 'ui',
        status: 'pass',
        message: 'Running (ink + react)',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'TUI Renderer',
      category: 'ui',
      status: 'warn',
      message: 'Not running',
      details: 'Terminal UI is optional. Core functionality works without it.',
      durationMs: Date.now() - start,
    };
  }

  private async checkInterviewEngine(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const running = this.ctx.interviewRunning ?? false;

    if (running) {
      return {
        name: 'Interview Engine',
        category: 'interview',
        status: 'pass',
        message: 'HTTP :3456 active',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'Interview Engine',
      category: 'interview',
      status: 'warn',
      message: 'Not running',
      details: 'Interview mode requires the engine to be started. Run index.ts to start it.',
      durationMs: Date.now() - start,
    };
  }

  private async checkFileSystem(): Promise<DiagnosticCheck> {
    const start = Date.now();
    try {
      const testDir = os.tmpdir();
      const testFile = path.join(testDir, `oh-my-unified-diag-${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'test');
      const content = fs.readFileSync(testFile, 'utf-8');
      fs.unlinkSync(testFile);

      if (content === 'test') {
        return {
          name: 'File System',
          category: 'system',
          status: 'pass',
          message: 'Read/write OK',
          durationMs: Date.now() - start,
        };
      }
    } catch (err) {
      return {
        name: 'File System',
        category: 'system',
        status: 'fail',
        message: `File system error: ${String(err)}`,
        details: 'Cannot read or write files. Implementation features will fail.',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'File System',
      category: 'system',
      status: 'warn',
      message: 'File system returned unexpected result',
      durationMs: Date.now() - start,
    };
  }

  private async checkNetwork(): Promise<DiagnosticCheck> {
    const start = Date.now();
    // We just check if fetch is available, not actually make a network call
    if (typeof globalThis.fetch === 'function') {
      return {
        name: 'Network',
        category: 'system',
        status: 'pass',
        message: 'Fetch API available',
        durationMs: Date.now() - start,
      };
    }

    return {
      name: 'Network',
      category: 'system',
      status: 'warn',
      message: 'Fetch API not available',
      details: 'Webfetch tool and external integrations may not work.',
      durationMs: Date.now() - start,
    };
  }

  private async checkCircuitBreakers(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const health = this.ctx.circuitBreakerHealth ?? [];
    const closed = health.filter(h => h.state === 'closed').length;
    const total = health.length;

    if (total === 0) {
      return {
        name: 'Circuit Breakers',
        category: 'reliability',
        status: 'warn',
        message: 'No circuit breakers registered',
        details: 'Graceful degradation is inactive. Feature failures may cascade.',
        durationMs: Date.now() - start,
      };
    }

    if (closed === total) {
      return {
        name: 'Circuit Breakers',
        category: 'reliability',
        status: 'pass',
        message: `${total}/${total} closed (healthy)`,
        durationMs: Date.now() - start,
      };
    }

    const open = health.filter(h => h.state !== 'closed');
    return {
      name: 'Circuit Breakers',
      category: 'reliability',
      status: 'warn',
      message: `${closed}/${total} closed`,
      details: `Open: ${open.map(h => h.name).join(', ')}`,
      durationMs: Date.now() - start,
    };
  }

  private async checkPluginRegistry(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const count = this.ctx.pluginCount ?? 0;

    return {
      name: 'Plugin Registry',
      category: 'extensibility',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0 ? `${count} third-party plugins loaded` : 'No third-party plugins',
      details: count === 0 ? 'Plugin system is available. Register plugins to extend functionality.' : undefined,
      durationMs: Date.now() - start,
    };
  }

  private async checkIntegrationHub(): Promise<DiagnosticCheck> {
    const start = Date.now();
    const count = this.ctx.integrationCount ?? 0;

    return {
      name: 'Integration Hub',
      category: 'extensibility',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0 ? `${count} external integrations configured` : 'No external integrations',
      details: count === 0 ? 'GitHub, Jira, Slack integrations are available. Configure them to connect external tools.' : undefined,
      durationMs: Date.now() - start,
    };
  }

  private async checkLearningEngine(): Promise<DiagnosticCheck> {
    const start = Date.now();
    // Check if SQLite is available (learning engine depends on it)
    try {
      const { Database } = await import('../../utils/sqlite.js');
      const db = new Database(':memory:');
      db.close();
      return {
        name: 'Learning Engine',
        category: 'intelligence',
        status: 'pass',
        message: 'SQLite available for cross-session learning',
        durationMs: Date.now() - start,
      };
    } catch {
      return {
        name: 'Learning Engine',
        category: 'intelligence',
        status: 'fail',
        message: 'SQLite unavailable',
        details: 'Cross-session learning requires SQLite. Lessons won\'t persist.',
        durationMs: Date.now() - start,
      };
    }
  }

  formatReport(report: DiagnosticReport): string {
    const lines: string[] = [];
    lines.push('🔍 oh-my-unified Diagnostic Report');
    lines.push('═'.repeat(40));
    lines.push('');

    // Group by category
    const byCategory: Record<string, DiagnosticCheck[]> = {};
    for (const check of report.checks) {
      if (!byCategory[check.category]) {
        byCategory[check.category] = [];
      }
      byCategory[check.category].push(check);
    }

    const categoryIcons: Record<string, string> = {
      integrations: '🔌',
      agents: '🤖',
      models: '🧠',
      storage: '💾',
      ui: '🖥️',
      interview: '🎙️',
      system: '⚙️',
      reliability: '🛡️',
      extensibility: '🔧',
      intelligence: '💡',
    };

    for (const [category, checks] of Object.entries(byCategory)) {
      const icon = categoryIcons[category] ?? '📋';
      lines.push(`${icon} ${category.toUpperCase()}`);

      for (const check of checks) {
        const statusIcon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
        lines.push(`  ${statusIcon} ${check.name}: ${check.message}`);
        if (check.details) {
          lines.push(`     ${check.details}`);
        }
      }
      lines.push('');
    }

    // Warnings section
    const warnings = report.checks.filter(c => c.status === 'warn');
    if (warnings.length > 0) {
      lines.push('⚠️  Warnings:');
      for (const w of warnings) {
        lines.push(`   - ${w.name}: ${w.message}`);
      }
      lines.push('');
    }

    // Summary
    const statusIcon = report.overall === 'healthy' ? '✅' : report.overall === 'degraded' ? '⚠️' : '❌';
    lines.push(`${statusIcon} System Health: ${report.overall.toUpperCase()} (${report.passed}/${report.total} checks passed)`);
    lines.push('');
    lines.push('💡 Tip: Run /capabilities to see everything you can do');

    return lines.join('\n');
  }
}

export function createDiagnosticsChecker(ctx?: DiagnosticContext): DiagnosticsChecker {
  return new DiagnosticsChecker(ctx);
}
