import { describe, it, expect } from 'bun:test';
import { SecurityResearchManager } from './index';
describe('SecurityResearchManager', () => {
    it('starts research', () => {
        const manager = new SecurityResearchManager();
        const report = manager.startResearch('s1', 'Auth system');
        expect(report.sessionId).toBe('s1');
        expect(report.topic).toBe('Auth system');
        expect(report.findings).toHaveLength(0);
        expect(report.overallRisk).toBe('NONE');
    });
    it('generates research prompt', () => {
        const manager = new SecurityResearchManager();
        const report = manager.startResearch('s1', 'Test');
        const prompt = manager.getResearchPrompt(report);
        expect(prompt).toContain('Test');
        expect(prompt).toContain('OWASP');
        expect(prompt).toContain('STRIDE');
    });
    it('adds findings and calculates risk', () => {
        const manager = new SecurityResearchManager();
        manager.startResearch('s1', 'Test');
        manager.addFinding('s1', {
            category: 'Injection',
            severity: 'CRITICAL',
            title: 'SQL injection',
            description: 'User input not sanitized',
            remediation: 'Use parameterized queries',
            cwe: '89',
        });
        const report = manager.getState('s1');
        expect(report?.overallRisk).toBe('CRITICAL');
        expect(report?.findings).toHaveLength(1);
    });
    it('calculates overall risk correctly', () => {
        const manager = new SecurityResearchManager();
        expect(manager.calculateOverallRisk([])).toBe('NONE');
        expect(manager.calculateOverallRisk([{ category: 'X', severity: 'LOW', title: 't', description: 'd', remediation: 'r' }])).toBe('LOW');
        expect(manager.calculateOverallRisk([{ category: 'X', severity: 'MEDIUM', title: 't', description: 'd', remediation: 'r' }])).toBe('MEDIUM');
        expect(manager.calculateOverallRisk([{ category: 'X', severity: 'HIGH', title: 't', description: 'd', remediation: 'r' }])).toBe('HIGH');
        expect(manager.calculateOverallRisk([{ category: 'X', severity: 'CRITICAL', title: 't', description: 'd', remediation: 'r' }])).toBe('CRITICAL');
    });
    it('generates report', () => {
        const manager = new SecurityResearchManager();
        manager.startResearch('s1', 'Test');
        manager.addFinding('s1', {
            category: 'Auth',
            severity: 'HIGH',
            title: 'Weak tokens',
            description: 'JWT secret too short',
            remediation: 'Use 256-bit secret',
        });
        manager.completeResearch('s1');
        const report = manager.getReport('s1');
        expect(report).not.toBeNull();
        expect(report).toContain('HIGH');
        expect(report).toContain('Weak tokens');
    });
    it('returns null for incomplete research', () => {
        const manager = new SecurityResearchManager();
        manager.startResearch('s1', 'Test');
        expect(manager.getReport('s1')).toBeNull();
    });
    it('disposes cleanly', () => {
        const manager = new SecurityResearchManager();
        manager.startResearch('s1', 'Test');
        manager.dispose();
        expect(manager.getState('s1')).toBeUndefined();
    });
});
//# sourceMappingURL=index.test.js.map