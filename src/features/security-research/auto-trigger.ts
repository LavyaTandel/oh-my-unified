import { log } from '../../utils/logger';

export interface SecurityTriggerResult {
  triggered: boolean;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; reason: string; severity: 'high' | 'medium' | 'low' }> = [
  { pattern: /\.(env|config|secrets)\.(js|ts|json|yaml|yml)$/i, reason: 'Configuration/secrets file modified', severity: 'high' },
  { pattern: /password|passwd|credential|secret|token|api_key|apikey/i, reason: 'Authentication/credential code detected', severity: 'high' },
  { pattern: /encrypt|decrypt|cipher|hash|bcrypt|argon|sha256|sha512/i, reason: 'Cryptographic operation detected', severity: 'high' },
  { pattern: /fetch\(|axios\.|http\.|request\(|\.get\(|\.post\(/i, reason: 'Network request code detected', severity: 'medium' },
  { pattern: /query\(|execute\(|insert\s+into|update\s+.*set|delete\s+from/i, reason: 'Database operation detected', severity: 'medium' },
  { pattern: /fs\.(write|append|create)|writeFile|appendFile/i, reason: 'File write operation detected', severity: 'medium' },
  { pattern: /eval\(|Function\(|new\s+Function|setTimeout\(.*string/i, reason: 'Dynamic code execution detected', severity: 'high' },
  { pattern: /innerHTML|outerHTML|document\.write|\.insertAdjacentHTML/i, reason: 'DOM injection detected (XSS risk)', severity: 'high' },
  { pattern: /cors|origin|header.*access-control|\.setHeader/i, reason: 'CORS/header configuration detected', severity: 'low' },
  { pattern: /middleware|auth.*guard|protect.*route|require.*auth/i, reason: 'Auth middleware/guard detected', severity: 'medium' },
];

export class SecurityAutoTrigger {
  detectSensitiveWrite(filePath: string, content?: string): SecurityTriggerResult | null {
    for (const { pattern, reason, severity } of SENSITIVE_PATTERNS) {
      if (pattern.test(filePath)) {
        return { triggered: true, reason, severity, suggestedAction: 'Run security research on this file' };
      }
      if (content && pattern.test(content)) {
        return { triggered: true, reason, severity, suggestedAction: 'Run security research on recent changes' };
      }
    }
    return null;
  }

  shouldTrigger(filePath: string, content?: string): boolean {
    return this.detectSensitiveWrite(filePath, content) !== null;
  }

  queueResearch(sessionId: string, reason: string): void {
    log('[security-auto-trigger] queued research', { sessionId, reason });
  }

  getTriggerStats(): { patterns: number; severity: Record<string, number> } {
    const bySeverity: Record<string, number> = { high: 0, medium: 0, low: 0 };
    for (const { severity } of SENSITIVE_PATTERNS) {
      bySeverity[severity]++;
    }
    return { patterns: SENSITIVE_PATTERNS.length, severity: bySeverity };
  }
}

export function createSecurityAutoTrigger(): SecurityAutoTrigger {
  return new SecurityAutoTrigger();
}
