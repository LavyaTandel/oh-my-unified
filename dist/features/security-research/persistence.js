import { Database } from '../../utils/sqlite.js';
export class SecurityResearchStore {
    db;
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.run('PRAGMA journal_mode=WAL');
        this.migrate();
    }
    migrate() {
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
    saveReport(report) {
        this.db.prepare(`INSERT OR REPLACE INTO security_reports (id, session_id, topic, overall_risk, completed, started_at, completed_at, finding_count, created_at)
       VALUES ($id, $sessionId, $topic, $overallRisk, $completed, $startedAt, $completedAt, $findingCount, $createdAt)`).run({
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
    saveFinding(finding, reportId, filePath) {
        this.db.prepare(`INSERT INTO security_findings (report_id, category, severity, title, description, remediation, cwe, file_path, created_at)
       VALUES ($reportId, $category, $severity, $title, $description, $remediation, $cwe, $filePath, $createdAt)`).run({
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
    getReport(sessionId) {
        const row = this.db
            .prepare('SELECT * FROM security_reports WHERE session_id = $sessionId LIMIT 1')
            .get({ $sessionId: sessionId });
        if (!row)
            return null;
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
    listReports(limit = 20) {
        const rows = this.db
            .prepare('SELECT * FROM security_reports ORDER BY created_at DESC LIMIT $limit')
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
    getFindingsBySeverity(severity) {
        const rows = this.db
            .prepare('SELECT * FROM security_findings WHERE severity = $severity ORDER BY created_at DESC')
            .all({ $severity: severity });
        return rows.map((row) => ({
            id: row.id,
            reportId: row.report_id,
            category: row.category,
            severity: row.severity,
            title: row.title,
            description: row.description ?? '',
            remediation: row.remediation ?? '',
            cwe: row.cwe ?? undefined,
            filePath: row.file_path ?? undefined,
            createdAt: row.created_at,
            remediationStatus: row.remediation_status,
        }));
    }
    getFindingsByFile(filePath) {
        const rows = this.db
            .prepare("SELECT * FROM security_findings WHERE file_path LIKE $filePath ORDER BY created_at DESC")
            .all({ $filePath: `%${filePath}%` });
        return rows.map((row) => ({
            id: row.id,
            reportId: row.report_id,
            category: row.category,
            severity: row.severity,
            title: row.title,
            description: row.description ?? '',
            remediation: row.remediation ?? '',
            cwe: row.cwe ?? undefined,
            filePath: row.file_path ?? undefined,
            createdAt: row.created_at,
            remediationStatus: row.remediation_status,
        }));
    }
    getStats() {
        const totalRow = this.db
            .prepare('SELECT COUNT(*) as total FROM security_findings')
            .get();
        const severityRows = this.db
            .prepare('SELECT severity, COUNT(*) as count FROM security_findings GROUP BY severity')
            .all();
        const reportsRow = this.db
            .prepare('SELECT COUNT(*) as total FROM security_reports')
            .get();
        const openRow = this.db
            .prepare("SELECT COUNT(*) as total FROM security_findings WHERE remediation_status = 'open'")
            .get();
        const bySeverity = {};
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
    close() {
        this.db.close();
    }
}
//# sourceMappingURL=persistence.js.map