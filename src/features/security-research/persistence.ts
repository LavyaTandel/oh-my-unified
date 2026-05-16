import { Database } from '../../utils/sqlite.js';
import { log } from '../../utils/logger';
import type { SecurityFinding, SecurityReport } from './index';

export interface SecurityFindingRecord extends SecurityFinding {
  id: number;
  reportId: string;
  filePath?: string;
  createdAt: number;
  remediationStatus: 'open' | 'fixed' | 'accepted-risk';
}

export interface SecurityReportRecord {
  id: string;
  sessionId: string;
  topic: string;
  overallRisk: string;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
  findingCount: number;
  createdAt: number;
}

export class SecurityResearchStore {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.run('PRAGMA journal_mode=WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS security_reports (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic TEXT,
        overall_risk TEXT DEFAULT 'NONE',
        completed INTEGER DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        finding_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS security_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL REFERENCES security_reports(id),
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        remediation TEXT,
        cwe TEXT,
        file_path TEXT,
        created_at INTEGER NOT NULL,
        remediation_status TEXT DEFAULT 'open'
      )
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_severity ON security_findings(severity)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_report ON security_findings(report_id)
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_file ON security_findings(file_path)
    `);
  }

  saveReport(report: SecurityReport): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO security_reports (id, session_id, topic, overall_risk, completed, started_at, completed_at, finding_count, created_at)
       VALUES ($id, $sessionId, $topic, $overallRisk, $completed, $startedAt, $completedAt, $findingCount, $createdAt)`,
    ).run({
      $id: report.sessionId,
      $sessionId: report.sessionId,
      $topic: report.topic,
      $overallRisk: report.overallRisk,
      $completed: report.completed ? 1 : 0,
      $startedAt: report.startedAt,
      $completedAt: report.completed ? Date.now() : null,
      $findingCount: report.findings.length,
      $createdAt: report.startedAt,
    });
  }

  saveFinding(finding: SecurityFinding, reportId: string, filePath?: string): void {
    this.db.prepare(
      `INSERT INTO security_findings (report_id, category, severity, title, description, remediation, cwe, file_path, created_at)
       VALUES ($reportId, $category, $severity, $title, $description, $remediation, $cwe, $filePath, $createdAt)`,
    ).run({
      $reportId: reportId,
      $category: finding.category,
      $severity: finding.severity,
      $title: finding.title,
      $description: finding.description,
      $remediation: finding.remediation,
      $cwe: finding.cwe ?? null,
      $filePath: filePath ?? null,
      $createdAt: Date.now(),
    });
  }

  getReport(sessionId: string): SecurityReportRecord | null {
    const row = this.db
      .prepare<{
        id: string; session_id: string; topic: string; overall_risk: string;
        completed: number; started_at: number; completed_at: number | null;
        finding_count: number; created_at: number;
      }>(
        'SELECT * FROM security_reports WHERE session_id = $sessionId LIMIT 1',
      )
      .get({ $sessionId: sessionId });

    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.session_id,
      topic: row.topic ?? '',
      overallRisk: row.overall_risk,
      completed: row.completed === 1,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      findingCount: row.finding_count,
      createdAt: row.created_at,
    };
  }

  listReports(limit = 20): SecurityReportRecord[] {
    const rows = this.db
      .prepare<{
        id: string; session_id: string; topic: string; overall_risk: string;
        completed: number; started_at: number; completed_at: number | null;
        finding_count: number; created_at: number;
      }>(
        'SELECT * FROM security_reports ORDER BY created_at DESC LIMIT $limit',
      )
      .all({ $limit: limit });

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      topic: row.topic ?? '',
      overallRisk: row.overall_risk,
      completed: row.completed === 1,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      findingCount: row.finding_count,
      createdAt: row.created_at,
    }));
  }

  getFindingsBySeverity(severity: string): SecurityFindingRecord[] {
    const rows = this.db
      .prepare<{
        id: number; report_id: string; category: string; severity: string;
        title: string; description: string | null; remediation: string | null;
        cwe: string | null; file_path: string | null; created_at: number;
        remediation_status: string;
      }>(
        'SELECT * FROM security_findings WHERE severity = $severity ORDER BY created_at DESC',
      )
      .all({ $severity: severity });

    return rows.map((row) => ({
      id: row.id,
      reportId: row.report_id,
      category: row.category,
      severity: row.severity as SecurityFinding['severity'],
      title: row.title,
      description: row.description ?? '',
      remediation: row.remediation ?? '',
      cwe: row.cwe ?? undefined,
      filePath: row.file_path ?? undefined,
      createdAt: row.created_at,
      remediationStatus: row.remediation_status as SecurityFindingRecord['remediationStatus'],
    }));
  }

  getFindingsByFile(filePath: string): SecurityFindingRecord[] {
    const rows = this.db
      .prepare<{
        id: number; report_id: string; category: string; severity: string;
        title: string; description: string | null; remediation: string | null;
        cwe: string | null; file_path: string | null; created_at: number;
        remediation_status: string;
      }>(
        "SELECT * FROM security_findings WHERE file_path LIKE $filePath ORDER BY created_at DESC",
      )
      .all({ $filePath: `%${filePath}%` });

    return rows.map((row) => ({
      id: row.id,
      reportId: row.report_id,
      category: row.category,
      severity: row.severity as SecurityFinding['severity'],
      title: row.title,
      description: row.description ?? '',
      remediation: row.remediation ?? '',
      cwe: row.cwe ?? undefined,
      filePath: row.file_path ?? undefined,
      createdAt: row.created_at,
      remediationStatus: row.remediation_status as SecurityFindingRecord['remediationStatus'],
    }));
  }

  getStats(): {
    totalFindings: number;
    bySeverity: Record<string, number>;
    totalReports: number;
    openFindings: number;
  } {
    const totalRow = this.db
      .prepare<{ total: number }>('SELECT COUNT(*) as total FROM security_findings')
      .get();

    const severityRows = this.db
      .prepare<{ severity: string; count: number }>(
        'SELECT severity, COUNT(*) as count FROM security_findings GROUP BY severity',
      )
      .all();

    const reportsRow = this.db
      .prepare<{ total: number }>('SELECT COUNT(*) as total FROM security_reports')
      .get();

    const openRow = this.db
      .prepare<{ total: number }>(
        "SELECT COUNT(*) as total FROM security_findings WHERE remediation_status = 'open'",
      )
      .get();

    const bySeverity: Record<string, number> = {};
    for (const row of severityRows) {
      bySeverity[row.severity] = row.count;
    }

    return {
      totalFindings: totalRow?.total ?? 0,
      bySeverity,
      totalReports: reportsRow?.total ?? 0,
      openFindings: openRow?.total ?? 0,
    };
  }

  close(): void {
    this.db.close();
  }
}
