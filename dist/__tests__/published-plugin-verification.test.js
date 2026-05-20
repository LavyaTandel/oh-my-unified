import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
const INSTALLED_PATH = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified';
const PKG_PATH = path.join(INSTALLED_PATH, 'package.json');
const DIST_PATH = path.join(INSTALLED_PATH, 'dist/index.js');
describe('Published Plugin Verification — oh-my-unified', () => {
    test('npm package is installed and accessible', () => {
        const pkg = require(PKG_PATH);
        expect(pkg.name).toBe('oh-my-unified');
        expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(pkg.license).toBe('MIT');
    });
    test('dist/index.js exists and is non-empty', () => {
        expect(fs.existsSync(DIST_PATH)).toBe(true);
        const stats = fs.statSync(DIST_PATH);
        expect(stats.size).toBeGreaterThan(300000); // >300KB
    });
    test('dist/tui.js exists and is non-empty', () => {
        const tuiPath = path.join(INSTALLED_PATH, 'dist/tui.js');
        expect(fs.existsSync(tuiPath)).toBe(true);
        const stats = fs.statSync(tuiPath);
        expect(stats.size).toBeGreaterThan(10000); // >10KB
    });
    test('README.md exists and contains key features', () => {
        const readmePath = path.join(INSTALLED_PATH, 'README.md');
        expect(fs.existsSync(readmePath)).toBe(true);
        const content = fs.readFileSync(readmePath, 'utf-8');
        expect(content).toContain('Transparency Log');
        expect(content).toContain('Improvisation Loop');
        expect(content).toContain('Assess');
        expect(content).toContain('Assemble');
        expect(content).toContain('Act');
    });
    test('auto-slash-command hook is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('auto-slash-command');
        expect(content).toContain('OUR_COMMANDS');
        expect(content).toContain('AUTO_SLASH_COMMAND_TAG_OPEN');
    });
    test('command ownership guard is present', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('OUR_COMMANDS');
        expect(content).toContain('has(normalizedCommand)');
    });
    test('display_name is in agent file writer', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('display_name');
    });
    test('Transparency Log is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('transparency-log');
        expect(content).toContain('TransparencyLog');
        expect(content).toContain('/log');
    });
    test('Circuit Breakers are present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('circuit-breaker');
        expect(content).toContain('CircuitBreaker');
    });
    test('Learning Engine is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('learning-engine');
        expect(content).toContain('LearningEngine');
    });
    test('Model Predictor is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('model-predictor');
        expect(content).toContain('ModelPredictor');
    });
    test('Benchmark Tracker is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('benchmark-tracker');
        expect(content).toContain('BenchmarkTracker');
    });
    test('Plugin Registry is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('plugin-registry');
        expect(content).toContain('PluginRegistry');
    });
    test('Skill Codifier is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('skill-codifier');
        expect(content).toContain('SkillCodifier');
    });
    test('Session Router is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('session-router');
        expect(content).toContain('SessionRouter');
    });
    test('Integration Hub is present in bundle', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('integration-hub');
        expect(content).toContain('IntegrationHub');
    });
    test('Trust & Discovery commands are present', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('/diagnose');
        expect(content).toContain('/capabilities');
        expect(content).toContain('/onboarding');
        expect(content).toContain('/log');
    });
    test('Confidence scores are present in plan/audit outputs', () => {
        const content = fs.readFileSync(DIST_PATH, 'utf-8');
        expect(content).toContain('Confidence');
        expect(content).toContain('confidence');
    });
    test('opencode.json points to installed package', () => {
        const opencodeConfigPath = '/Users/lavyatandel/.config/opencode/opencode.json';
        expect(fs.existsSync(opencodeConfigPath)).toBe(true);
        const content = fs.readFileSync(opencodeConfigPath, 'utf-8');
        const config = JSON.parse(content);
        expect(config.plugin[0]).toContain('oh-my-unified');
    });
    test('package.json keywords are correct', () => {
        const pkg = require(PKG_PATH);
        expect(pkg.keywords).toContain('opencode');
        expect(pkg.keywords).toContain('opencode-plugin');
        expect(pkg.keywords).toContain('unified');
        expect(pkg.keywords).toContain('persistent-task-engine');
        expect(pkg.keywords).toContain('mcp-bus');
        expect(pkg.keywords).toContain('ai');
        expect(pkg.keywords).toContain('agents');
        expect(pkg.keywords).toContain('orchestration');
    });
    test('exports are correct', () => {
        const pkg = require(PKG_PATH);
        expect(pkg.exports['.'].import).toBe('./dist/index.js');
        expect(pkg.exports['./tui'].import).toBe('./dist/tui.js');
    });
});
//# sourceMappingURL=published-plugin-verification.test.js.map