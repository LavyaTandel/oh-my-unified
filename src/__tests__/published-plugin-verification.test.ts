import { describe, test, expect } from 'bun:test';

describe('Published Plugin Verification — oh-my-unified@1.0.4', () => {
  test('npm package is installed and accessible', () => {
    const pkg = require('/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/package.json');
    expect(pkg.name).toBe('oh-my-unified');
    expect(pkg.version).toBe('1.0.4');
    expect(pkg.license).toBe('MIT');
  });

  test('dist/index.js exists and is non-empty', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    expect(fs.existsSync(path)).toBe(true);
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(300000); // >300KB
  });

  test('dist/tui.js exists and is non-empty', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/tui.js';
    expect(fs.existsSync(path)).toBe(true);
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(10000); // >10KB
  });

  test('README.md exists and contains competitive comparison', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/README.md';
    expect(fs.existsSync(path)).toBe(true);
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('oh-my-openagent');
    expect(content).toContain('oh-my-agents-synthesis');
    expect(content).toContain('583 passing');
    expect(content).toContain('Transparency Log');
    expect(content).toContain('Nemotron 3 Super');
    expect(content).toContain('Qwen3.6 Plus');
    expect(content).toContain('DeepSeek V4 Flash');
    expect(content).toContain('MiniMax M2.5');
    expect(content).toContain('Big Pickle');
  });

  test('Qwen3.6 Plus Free routing is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('qwen3.6-plus-free');
    expect(content).toContain('njord');
    expect(content).toContain('frigg');
    expect(content).toContain('vidar');
  });

  test('Transparency Log is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('transparency-log');
    expect(content).toContain('TransparencyLog');
    expect(content).toContain('/log');
  });

  test('Circuit Breakers are present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('circuit-breaker');
    expect(content).toContain('CircuitBreaker');
  });

  test('Learning Engine is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('learning-engine');
    expect(content).toContain('LearningEngine');
  });

  test('Model Predictor is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('model-predictor');
    expect(content).toContain('ModelPredictor');
  });

  test('Benchmark Tracker is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('benchmark-tracker');
    expect(content).toContain('BenchmarkTracker');
  });

  test('Plugin Registry is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('plugin-registry');
    expect(content).toContain('PluginRegistry');
  });

  test('Skill Codifier is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('skill-codifier');
    expect(content).toContain('SkillCodifier');
  });

  test('Session Router is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('session-router');
    expect(content).toContain('SessionRouter');
  });

  test('Integration Hub is present in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('integration-hub');
    expect(content).toContain('IntegrationHub');
  });

  test('Trust & Discovery commands are present', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('/diagnose');
    expect(content).toContain('/capabilities');
    expect(content).toContain('/onboarding');
    expect(content).toContain('/log');
  });

  test('All 5 models are referenced in bundle', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('nemotron-3-super-free');
    expect(content).toContain('qwen3.6-plus-free');
    expect(content).toContain('deepseek-v4-flash-free');
    expect(content).toContain('minimax-m2.5-free');
    expect(content).toContain('big-pickle');
  });

  test('Confidence scores are present in plan/audit outputs', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/dist/index.js';
    const content = fs.readFileSync(path, 'utf-8');
    expect(content).toContain('Confidence');
    expect(content).toContain('confidence');
  });

  test('opencode.json points to installed package', () => {
    const fs = require('fs');
    const path = '/Users/lavyatandel/.config/opencode/opencode.json';
    const content = fs.readFileSync(path, 'utf-8');
    const config = JSON.parse(content);
    expect(config.plugin[0]).toContain('oh-my-unified');
  });

  test('package.json keywords are correct', () => {
    const pkg = require('/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/package.json');
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
    const pkg = require('/Users/lavyatandel/.config/opencode/node_modules/oh-my-unified/package.json');
    expect(pkg.exports['.'].import).toBe('./dist/index.js');
    expect(pkg.exports['./tui'].import).toBe('./dist/tui.js');
  });
});
