import { describe, it, expect } from 'bun:test';
import { AuditOrchestrator } from './index';
describe('AuditOrchestrator', () => {
    it('starts an audit', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'src/auth.ts', 'security');
        expect(report.sessionId).toBe('s1');
        expect(report.target).toBe('src/auth.ts');
        expect(report.type).toBe('security');
        expect(report.status).toBe('active');
        expect(report.overallScore).toBe(100);
        expect(report.grade).toBe('A');
    });
    it('generates audit prompts', () => {
        const o = new AuditOrchestrator();
        for (const type of ['architecture', 'quality', 'security', 'ux']) {
            expect(o.getAuditPrompt(type).length).toBeGreaterThan(0);
        }
        const full = o.getAuditPrompt('full');
        expect(full.length).toBeGreaterThan(100);
    });
    it('adds findings and recalculates score', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'Test', 'security');
        o.addFindings(report.id, [
            { category: 'Auth', severity: 'HIGH', title: 'Weak tokens', description: 'd', remediation: 'r' },
            { category: 'Input', severity: 'MEDIUM', title: 'No validation', description: 'd', remediation: 'r' },
        ]);
        expect(report.findings).toHaveLength(2);
        expect(report.overallScore).toBeLessThan(100);
    });
    it('calculates correct score for no findings', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'Test', 'quality');
        expect(report.overallScore).toBe(100);
        expect(report.grade).toBe('A');
    });
    it('completes audit', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'Test', 'security');
        const completed = o.completeAudit(report.id);
        expect(completed).not.toBeNull();
        expect(completed?.status).toBe('completed');
        expect(completed?.completedAt).toBeDefined();
    });
    it('generates report', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'Test', 'quality');
        o.addFindings(report.id, [
            { category: 'Naming', severity: 'LOW', title: 'Inconsistent', description: 'd', remediation: 'r' },
        ]);
        o.completeAudit(report.id);
        const text = o.getReport(report.id);
        expect(text).not.toBeNull();
        expect(text).toContain('Test');
        expect(text).toContain('LOW');
        expect(text).toContain('Inconsistent');
    });
    it('handles full audit with weighted scores', () => {
        const o = new AuditOrchestrator();
        const report = o.startAudit('s1', 'Test', 'full');
        o.addFindings(report.id, [
            { category: 'architecture', severity: 'HIGH', title: 'Tight coupling', description: 'd', remediation: 'r' },
            { category: 'security', severity: 'CRITICAL', title: 'SQL injection', description: 'd', remediation: 'r' },
        ]);
        o.completeAudit(report.id);
        expect(report.scores.architecture).toBeDefined();
        expect(report.scores.security).toBeDefined();
        expect(report.overallScore).toBeLessThan(100);
    });
    it('gets active audit by session', () => {
        const o = new AuditOrchestrator();
        o.startAudit('s1', 'Test', 'security');
        expect(o.getActiveAudit('s1')).toBeDefined();
        expect(o.getActiveAudit('unknown')).toBeUndefined();
    });
    it('lists audits sorted by date', () => {
        const o = new AuditOrchestrator();
        o.startAudit('s1', 'First', 'security');
        const start = Date.now();
        while (Date.now() === start) { /* spin */ }
        o.startAudit('s2', 'Second', 'quality');
        const audits = o.listAudits();
        expect(audits).toHaveLength(2);
        expect(audits[0].target).toBe('Second');
    });
    it('disposes cleanly', () => {
        const o = new AuditOrchestrator();
        o.startAudit('s1', 'Test', 'security');
        o.dispose();
        expect(o.listAudits()).toHaveLength(0);
    });
});
//# sourceMappingURL=index.test.js.map