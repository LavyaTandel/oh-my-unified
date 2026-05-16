import { describe, it, expect } from 'bun:test';
import { ModelCapabilitiesCache, selectModelForTask } from './cache';

describe('ModelCapabilitiesCache', () => {
  it('pre-populates with known defaults', () => {
    const cache = new ModelCapabilitiesCache();
    const caps = cache.get('claude-sonnet');
    expect(caps.vision).toBe(true);
    expect(caps.thinking).toBe(true);
    expect(caps.toolUse).toBe(true);
    expect(caps.family).toBe('anthropic');
  });

  it('returns defaults for unknown model', () => {
    const cache = new ModelCapabilitiesCache();
    const caps = cache.get('unknown-model');
    expect(caps.vision).toBe(false);
    expect(caps.thinking).toBe(false);
    expect(caps.toolUse).toBe(true);
    expect(caps.family).toBe('unknown');
  });

  it('matches by substring in model ID', () => {
    const cache = new ModelCapabilitiesCache();
    const caps = cache.get('anthropic/claude-sonnet-4-20250514');
    expect(caps.family).toBe('anthropic');
    expect(caps.vision).toBe(true);
  });

  it('updates capabilities at runtime', () => {
    const cache = new ModelCapabilitiesCache();
    cache.update('custom-model', { vision: true, maxOutputTokens: 16384 });
    const caps = cache.get('custom-model');
    expect(caps.vision).toBe(true);
    expect(caps.maxOutputTokens).toBe(16384);
  });

  it('finds models by capability', () => {
    const cache = new ModelCapabilitiesCache();
    const visionModels = cache.findByCapability('vision', true);
    expect(visionModels.length).toBeGreaterThan(0);
    expect(visionModels.some((m) => m.includes('claude-sonnet'))).toBe(true);
  });

  it('exports and imports JSON', () => {
    const cache = new ModelCapabilitiesCache();
    const json = cache.toJSON();
    expect(Object.keys(json).length).toBeGreaterThan(0);

    const cache2 = new ModelCapabilitiesCache();
    cache2.fromJSON(json);
    expect(cache2.get('claude-sonnet').vision).toBe(true);
  });

  it('returns discovered models', () => {
    const cache = new ModelCapabilitiesCache();
    cache.update('runtime-discovered', { vision: true });
    const discovered = cache.getDiscoveredModels();
    expect(discovered).toContain('runtime-discovered');
  });
});

describe('selectModelForTask', () => {
  it('selects best model matching requirements', () => {
    const cache = new ModelCapabilitiesCache();
    const available = ['gpt-4o-mini', 'claude-haiku', 'deepseek-r1'];
    const best = selectModelForTask(cache, available, {
      vision: true,
      toolUse: true,
    });
    expect(best).toBeTruthy();
    expect(['gpt-4o-mini', 'claude-haiku']).toContain(best!);
  });

  it('returns null when no model matches', () => {
    const cache = new ModelCapabilitiesCache();
    const available = ['deepseek-r1'];
    const best = selectModelForTask(cache, available, {
      vision: true,
    });
    expect(best).toBeNull();
  });

  it('returns null for empty available models', () => {
    const cache = new ModelCapabilitiesCache();
    const best = selectModelForTask(cache, [], { vision: true });
    expect(best).toBeNull();
  });
});
