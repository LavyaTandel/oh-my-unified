import type { PluginInput } from '@opencode-ai/plugin';
import type { PluginConfig } from '../../config';
import { log } from '../../utils/logger';
import type { TransparencyLog } from '../transparency-log';

export type AuditType = 'architecture' | 'quality' | 'security' | 'ux' | 'full';
export type AuditStatus = 'active' | 'completed' | 'cancelled';

export interface AuditFinding {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  remediation: string;
  file?: string;
  line?: number;
}

export interface AuditReport {
  id: string;
  sessionId: string;
  target: string;
  type: AuditType;
  findings: AuditFinding[];
  scores: Record<string, number>;
  overallScore: number;
  grade: string;
  status: AuditStatus;
  startedAt: number;
  completedAt?: number;
}

const AUDIT_PROMPTS: Record<string, string> = {
  architecture: `# Architecture Audit

Evaluate the system's structural integrity:

## Module Boundaries
- Are modules clearly separated by responsibility?
- Is coupling between modules minimized?
- Do modules follow single responsibility principle?

## Design Patterns
- Are appropriate design patterns used consistently?
- Are anti-patterns present (god objects, spaghetti code)?
- Is the architecture scalable for future growth?

## API Contracts
- Are API endpoints well-designed and consistent?
- Is there proper versioning strategy?
- Are error responses standardized?

## Data Flow
- Is data flow unidirectional where appropriate?
- Are state management patterns consistent?
- Is there proper separation of concerns?

Output findings with severity labels: CRITICAL, HIGH, MEDIUM, LOW, INFO.`,

  quality: `# Code Quality Audit

Evaluate code readability, maintainability, and best practices:

## Readability
- Are names descriptive and consistent?
- Is code self-documenting or over-commented?
- Are functions/methods appropriately sized?

## Error Handling
- Are errors caught and handled gracefully?
- Are error messages informative?
- Is there proper logging?

## Type Safety
- Are types used effectively (not just \`any\`)?
- Are null/undefined cases handled?
- Are interfaces/contracts well-defined?

## Testing
- Is there adequate test coverage?
- Are tests meaningful (not just coverage metrics)?
- Are edge cases tested?

## Performance
- Are there obvious bottlenecks (N+1 queries, unnecessary re-renders)?
- Is caching used appropriately?
- Are resources cleaned up properly?

Output findings with severity labels and specific code references.`,

  security: `# Security Audit

Evaluate vulnerability exposure and threat surface:

## Input Validation
- Is all user input validated and sanitized?
- Are injection attacks prevented (SQL, XSS, command)?
- Are file uploads validated?

## Authentication & Authorization
- Is authentication properly implemented?
- Are authorization checks on every protected route?
- Are tokens/secrets stored securely?

## Dependencies
- Are dependencies up to date?
- Are there known vulnerabilities (check lockfiles)?
- Is the dependency tree minimal?

## Data Exposure
- Is sensitive data logged or exposed in responses?
- Are secrets in environment variables (not code)?
- Is PII handled according to regulations?

## Cryptography
- Are appropriate algorithms used (not MD5, SHA1)?
- Are keys of sufficient length?
- Is TLS used for all network communication?

Output findings with severity labels, CWE IDs where applicable, and specific remediation steps.`,

  ux: `# User Experience Audit

Evaluate user-facing quality:

## User Flow
- Is the primary user journey clear and intuitive?
- Are there unnecessary steps or friction points?
- Is there proper feedback for user actions?

## Accessibility
- Are ARIA labels present?
- Is color contrast sufficient?
- Is keyboard navigation supported?
- Are forms properly labeled?

## Visual Hierarchy
- Is important information prominent?
- Are related elements grouped logically?
- Is there consistent spacing and alignment?

## Responsive Design
- Does the layout work on mobile/tablet/desktop?
- Are touch targets appropriately sized?
- Does content reflow properly?

## Interaction Feedback
- Are loading states present?
- Are error states informative?
- Are success confirmations clear?

Output findings with severity labels and specific UI references.`,
};

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0,
};

const PERSPECTIVE_WEIGHTS: Record<string, number> = {
  architecture: 0.30,
  quality: 0.30,
  security: 0.25,
  ux: 0.15,
};

function calculateScore(findings: AuditFinding[]): number {
  let deduction = 0;
  for (const f of findings) {
    deduction += SEVERITY_WEIGHTS[f.severity] ?? 0;
  }
  return Math.max(0, Math.min(100, 100 - deduction));
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export class AuditOrchestrator {
  private audits = new Map<string, AuditReport>();

  startAudit(sessionId: string, target: string, type: AuditType): AuditReport {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const report: AuditReport = {
      id,
      sessionId,
      target,
      type,
      findings: [],
      scores: {},
      overallScore: 100,
      grade: 'A',
      status: 'active',
      startedAt: Date.now(),
    };
    this.audits.set(id, report);
    log('[om-audit] started', { id, sessionId, type, target: target.slice(0, 100) });
    return report;
  }

  getAuditPrompt(type: AuditType): string {
    if (type === 'full') {
      return Object.entries(AUDIT_PROMPTS)
        .map(([perspective, prompt]) => `## ${perspective.toUpperCase()}\n\n${prompt}`)
        .join('\n\n---\n\n');
    }
    return AUDIT_PROMPTS[type] ?? '';
  }

  addFindings(reportId: string, findings: AuditFinding[]): void {
    const report = this.audits.get(reportId);
    if (!report) return;
    report.findings.push(...findings);
    this.recalculateScores(report);
  }

  completeAudit(reportId: string): AuditReport | null {
    const report = this.audits.get(reportId);
    if (!report) return null;
    report.status = 'completed';
    report.completedAt = Date.now();
    this.recalculateScores(report);
    log('[om-audit] completed', { id: reportId, score: report.overallScore, grade: report.grade });
    return report;
  }

  private recalculateScores(report: AuditReport): void {
    if (report.type === 'full') {
      const byCategory: Record<string, AuditFinding[]> = {};
      for (const f of report.findings) {
        if (!byCategory[f.category]) byCategory[f.category] = [];
        byCategory[f.category].push(f);
      }

      for (const [perspective, findings] of Object.entries(byCategory)) {
        report.scores[perspective] = calculateScore(findings);
      }

      let weighted = 0;
      for (const [perspective, weight] of Object.entries(PERSPECTIVE_WEIGHTS)) {
        weighted += (report.scores[perspective] ?? 100) * weight;
      }
      report.overallScore = Math.round(weighted);
    } else {
      report.scores[report.type] = calculateScore(report.findings);
      report.overallScore = report.scores[report.type];
    }

    report.grade = getGrade(report.overallScore);
  }

  getReport(reportId: string): string | null {
    const report = this.audits.get(reportId);
    if (!report) return null;

    const bySeverity: Record<string, AuditFinding[]> = {};
    for (const f of report.findings) {
      if (!bySeverity[f.severity]) bySeverity[f.severity] = [];
      bySeverity[f.severity].push(f);
    }

    const findingsList = Object.entries(bySeverity)
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        return (order[a[0] as keyof typeof order] ?? 5) - (order[b[0] as keyof typeof order] ?? 5);
      })
      .flatMap(([severity, findings]) =>
        findings.map(f => `- [${severity}] **${f.category}**: ${f.title}\n  ${f.description}\n  Fix: ${f.remediation}`),
      )
      .join('\n');

    const scoreBreakdown = Object.entries(report.scores)
      .map(([k, v]) => `- ${k}: ${v}/100`)
      .join('\n');

    return `# Audit Report — ${report.target}

## Overall: ${report.grade} (${report.overallScore}/100)
**Type**: ${report.type}
**Findings**: ${report.findings.length}

## Score Breakdown
${scoreBreakdown}

## Findings
${findingsList || 'No findings — surface appears clean.'}

## Summary
${report.overallScore >= 80 ? 'Good quality. Address remaining findings before release.' : 'Significant issues found. Address CRITICAL and HIGH findings before release.'}`;
  }

  getActiveAudit(sessionId: string): AuditReport | undefined {
    for (const audit of this.audits.values()) {
      if (audit.sessionId === sessionId && audit.status === 'active') return audit;
    }
    return undefined;
  }

  listAudits(): AuditReport[] {
    return Array.from(this.audits.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  dispose(): void {
    this.audits.clear();
  }
}

export function createOmAuditHook(
  _ctx: PluginInput,
  _config: PluginConfig,
  opts?: { transparencyLog?: TransparencyLog },
) {
  const orchestrator = new AuditOrchestrator();
  const tlog = opts?.transparencyLog;

  return {
    orchestrator,

    handleCommandExecuteBefore: async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Array<{ type: string; text?: string }> },
    ): Promise<void> => {
      const arg = input.arguments.trim().toLowerCase();

      if (!arg) {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: '**om-audit** — Multi-Perspective Code Audit\n\n' +
            'Usage: `/om-audit <check>`\n\n' +
            'Checks:\n' +
            '  - **architecture** — System structure & patterns\n' +
            '  - **quality** — Code quality & best practices\n' +
            '  - **security** — Vulnerability & threat analysis\n' +
            '  - **ux** — User experience & interaction patterns\n' +
            '  - **full** — All checks (runs all perspectives)\n\n' +
            'No active audit. Run `/om-audit <check>` to start.',
        });
        return;
      }

      const check = arg as AuditType;
      const validChecks: AuditType[] = ['architecture', 'quality', 'security', 'ux', 'full'];
      if (!validChecks.includes(check)) {
        output.parts.length = 0;
        output.parts.push({
          type: 'text',
          text: `Unknown check: "${arg}". Available: ${validChecks.join(', ')}`,
        });
        return;
      }

      let report = orchestrator.getActiveAudit(input.sessionID);
      if (!report) {
        report = orchestrator.startAudit(input.sessionID, 'current codebase', check);
      }

      const prompt = orchestrator.getAuditPrompt(check);
      const confidence = check === 'security' ? 0.85 : check === 'architecture' ? 0.80 : check === 'quality' ? 0.90 : check === 'ux' ? 0.75 : 0.70;

      output.parts.length = 0;
      output.parts.push({
        type: 'text',
        text: `**Audit: ${check.toUpperCase()}**\nConfidence: ${(confidence * 100).toFixed(0)}%\n\n${prompt}`,
      });

      log('[om-audit] check injected', { sessionId: input.sessionID, type: check, confidence });

      // Transparency: log audit result
      if (tlog) {
        tlog.record({
          type: 'audit_result',
          sessionId: input.sessionID,
          message: `Audit ${check} started with confidence ${(confidence * 100).toFixed(0)}%`,
          details: { type: check, confidence },
          confidence,
        });
      }
    },
  };
}
