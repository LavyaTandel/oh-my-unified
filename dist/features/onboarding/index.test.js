import { describe, test, expect, beforeEach } from 'bun:test';
import { createOnboardingGuide } from './index';
describe('OnboardingGuide', () => {
    let ctx;
    beforeEach(() => {
        ctx = {
            agentCount: 15,
            mcpCount: 13,
            userName: 'TestUser',
            isFirstRun: true,
        };
    });
    test('returns 6 onboarding options', () => {
        const guide = createOnboardingGuide(ctx);
        const options = guide.getOptions();
        expect(options.length).toBe(6);
        expect(options[0].label).toBe('Plan a project');
        expect(options[1].label).toBe('Review my code');
        expect(options[2].label).toBe('Security audit');
        expect(options[3].label).toBe('See available agents');
        expect(options[4].label).toBe('Check system health');
        expect(options[5].label).toBe('Quick demo');
    });
    test('generates welcome message for first run', () => {
        const guide = createOnboardingGuide({ ...ctx, isFirstRun: true });
        const message = guide.getWelcomeMessage();
        expect(message).toContain('Welcome to oh-my-unified, TestUser');
        expect(message).toContain('15 specialized agents');
        expect(message).toContain('13 MCP integrations');
        expect(message).toContain('1. 📋 Plan a project');
        expect(message).toContain('/capabilities');
        expect(message).toContain('/diagnose');
    });
    test('generates welcome message for returning user', () => {
        const guide = createOnboardingGuide({ ...ctx, isFirstRun: false });
        const message = guide.getWelcomeMessage();
        expect(message).toContain('Welcome back, TestUser');
        expect(message).toContain('15 agents');
        expect(message).toContain('13 MCPs');
    });
    test('handles valid option selection', () => {
        const guide = createOnboardingGuide(ctx);
        for (let i = 1; i <= 6; i++) {
            const response = guide.handleOption(i);
            expect(response.length).toBeGreaterThan(0);
        }
    });
    test('handles invalid option selection', () => {
        const guide = createOnboardingGuide(ctx);
        const response = guide.handleOption(99);
        expect(response).toContain('Invalid option');
    });
    test('option 1 includes pipeline details', () => {
        const guide = createOnboardingGuide(ctx);
        const response = guide.handleOption(1);
        expect(response).toContain('Assess');
        expect(response).toContain('Assemble');
        expect(response).toContain('Improvise');
        expect(response).toContain('Act');
        expect(response).toContain('Odin');
        expect(response).toContain('Thor');
    });
    test('option 2 includes review panel details', () => {
        const guide = createOnboardingGuide(ctx);
        const response = guide.handleOption(2);
        expect(response).toContain('Tyr');
        expect(response).toContain('Heimdall');
        expect(response).toContain('Mimir');
        expect(response).toContain('Frigg');
        expect(response).toContain('Forseti');
    });
    test('option 3 includes security analysis details', () => {
        const guide = createOnboardingGuide(ctx);
        const response = guide.handleOption(3);
        expect(response).toContain('Authentication');
        expect(response).toContain('Cryptography');
        expect(response).toContain('Network');
        expect(response).toContain('Data');
    });
    test('option 5 includes diagnostic checks', () => {
        const guide = createOnboardingGuide(ctx);
        const response = guide.handleOption(5);
        expect(response).toContain('MCP connectivity');
        expect(response).toContain('Agent registration');
        expect(response).toContain('SQLite persistence');
        expect(response).toContain('Circuit breakers');
    });
    test('each option has required fields', () => {
        const guide = createOnboardingGuide(ctx);
        const options = guide.getOptions();
        for (const option of options) {
            expect(option.number).toBeDefined();
            expect(option.icon).toBeDefined();
            expect(option.label).toBeDefined();
            expect(option.description).toBeDefined();
            expect(option.action).toBeDefined();
        }
    });
});
//# sourceMappingURL=index.test.js.map