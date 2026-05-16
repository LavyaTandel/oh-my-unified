import { log } from '../../utils/logger';

export interface SecurityFinding {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  remediation: string;
  cwe?: string;
}

export interface SecurityReport {
  sessionId: string;
  topic: string;
  findings: SecurityFinding[];
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  completed: boolean;
  startedAt: number;
}

const OWASP_TOP_10 = [
  'A01: Broken Access Control',
  'A02: Cryptographic Failures',
  'A03: Injection',
  'A04: Insecure Design',
  'A05: Security Misconfiguration',
  'A06: Vulnerable Components',
  'A07: Auth Failures',
  'A08: Data Integrity',
  'A09: Logging Failures',
  'A010: SSRF',
];

const STRIDE_CATEGORIES = [
  'Spoofing', 'Tampering', 'Repudiation',
  'Information Disclosure', 'Denial of Service', 'Elevation of Privilege',
];

export class SecurityResearchManager {
  private reports = new Map<string, SecurityReport>();

  startResearch(sessionId: string, topic: string): SecurityReport {
    const report: SecurityReport = {
      sessionId,
      topic,
      findings: [],
      overallRisk: 'NONE',
      completed: false,
      startedAt: Date.now(),
    };
    this.reports.set(sessionId, report);
    log('[security-research] started', { sessionId, topic: topic.slice(0, 100) });
    return report;
  }

  getResearchPrompt(report: SecurityReport): string {
    return `# Security Research — ${report.topic}

Conduct a comprehensive security analysis covering:

## OWASP Top 10 (2021)
${OWASP_TOP_10.map((c) => `- ${c}`).join('\n')}

## STRIDE Threat Model
${STRIDE_CATEGORIES.map((c) => `- ${c}`).join('\n')}

## Additional Checks
- Supply chain security (dependencies, lockfiles)
- Secrets management (hardcoded credentials, env vars)
- API security (rate limiting, CORS, auth tokens)
- Infrastructure security (TLS, certificates, network)
- Data privacy (PII, GDPR, data retention)

For each finding:
1. Category (OWASP/STRIDE/Other)
2. Severity (CRITICAL/HIGH/MEDIUM/LOW)
3. Title and description
4. Specific code/config reference
5. Remediation steps
6. CWE ID if applicable

OUTPUT FORMAT:
<overall_risk>CRITICAL|HIGH|MEDIUM|LOW|NONE</overall_risk>
<findings>
- [SEVERITY] Category: Title
  Description: ...
  Remediation: ...
  CWE: ...
</findings>`;
  }

  addFinding(sessionId: string, finding: SecurityFinding): void {
    const report = this.reports.get(sessionId);
    if (!report) return;
    report.findings.push(finding);
    report.overallRisk = this.calculateOverallRisk(report.findings);
  }

  completeResearch(sessionId: string): SecurityReport | null {
    const report = this.reports.get(sessionId);
    if (!report) return null;
    report.completed = true;
    log('[security-research] completed', {
      sessionId,
      findingCount: report.findings.length,
      overallRisk: report.overallRisk,
    });
    return report;
  }

  calculateOverallRisk(findings: SecurityFinding[]): SecurityReport['overallRisk'] {
    if (findings.some((f) => f.severity === 'CRITICAL')) return 'CRITICAL';
    if (findings.some((f) => f.severity === 'HIGH')) return 'HIGH';
    if (findings.some((f) => f.severity === 'MEDIUM')) return 'MEDIUM';
    if (findings.length > 0) return 'LOW';
    return 'NONE';
  }

  getReport(sessionId: string): string | null {
    const report = this.reports.get(sessionId);
    if (!report || !report.completed) return null;

    const bySeverity: Record<string, SecurityFinding[]> = {};
    for (const f of report.findings) {
      if (!bySeverity[f.severity]) bySeverity[f.severity] = [];
      bySeverity[f.severity].push(f);
    }

    const findingsList = Object.entries(bySeverity)
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a[0] as keyof typeof order] ?? 4) - (order[b[0] as keyof typeof order] ?? 4);
      })
      .flatMap(([severity, findings]) =>
        findings.map(
          (f) =>
            `- [${f.severity}] **${f.category}**: ${f.title}\n  ${f.description}\n  Fix: ${f.remediation}${f.cwe ? ` (CWE-${f.cwe})` : ''}`,
        ),
      )
      .join('\n');

    return `# Security Research Report — ${report.topic}

## Overall Risk: ${report.overallRisk}

## Findings (${report.findings.length} total)
${findingsList || 'No findings — surface appears clean.'}

## Coverage
- OWASP Top 10: ${OWASP_TOP_10.length} categories checked
- STRIDE: ${STRIDE_CATEGORIES.length} threat categories checked

## Recommendations
${report.overallRisk === 'NONE' ? 'No immediate action required. Maintain current security posture.' : `Address CRITICAL and HIGH findings before release.`}`;
  }

  getState(sessionId: string): SecurityReport | undefined {
    return this.reports.get(sessionId);
  }

  dispose(): void {
    this.reports.clear();
  }
}
