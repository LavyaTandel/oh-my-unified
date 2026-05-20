import { describe, it, expect, beforeEach } from 'bun:test';
import { PresetManager, PRESETS } from './index';
describe('PresetManager', () => {
    let manager;
    beforeEach(() => {
        manager = new PresetManager();
    });
    // ── 1. Starts with 'free' as the active preset ─────────────────────────
    it('starts with free as the active preset', () => {
        const active = manager.getActivePreset();
        expect(active.name).toBe('Free Models');
        expect(active.tier).toBe('free');
    });
    // ── 2. listPresets returns all preset keys ─────────────────────────────
    it('lists all available presets', () => {
        const presets = manager.listPresets();
        expect(presets).toEqual(['free', 'balanced', 'premium']);
    });
    // ── 3. getPreset returns the correct preset by name ────────────────────
    it('returns a preset by name', () => {
        const preset = manager.getPreset('balanced');
        expect(preset).toBeDefined();
        expect(preset.name).toBe('Balanced');
        expect(preset.tier).toBe('balanced');
        expect(preset.models.odin).toBe('openai/gpt-5.5');
    });
    // ── 4. getPreset returns undefined for unknown names ───────────────────
    it('returns undefined for an unknown preset name', () => {
        const preset = manager.getPreset('nonexistent');
        expect(preset).toBeUndefined();
    });
    // ── 5. setActivePreset switches the active preset ──────────────────────
    it('switches the active preset', () => {
        const result = manager.setActivePreset('premium');
        expect(result).toBe(true);
        const active = manager.getActivePreset();
        expect(active.name).toBe('Premium');
        expect(active.tier).toBe('premium');
        expect(active.models.odin).toBe('openai/gpt-5.5-codex');
    });
    // ── 6. setActivePreset returns false for invalid names ─────────────────
    it('returns false when setting an invalid preset name', () => {
        const result = manager.setActivePreset('ultra-cheap');
        expect(result).toBe(false);
        // Active preset should remain unchanged
        const active = manager.getActivePreset();
        expect(active.tier).toBe('free');
    });
    // ── 7. getModelForAgent returns the model for the active preset ────────
    it('returns the model for a given agent from the active preset', () => {
        const model = manager.getModelForAgent('odin');
        expect(model).toBe('opencode/nemotron-3-super-free');
    });
    // ── 8. getModelForAgent reflects preset changes ────────────────────────
    it('reflects model changes after switching presets', () => {
        manager.setActivePreset('premium');
        const model = manager.getModelForAgent('thor');
        expect(model).toBe('openai/gpt-5.5');
    });
    // ── 9. getModelForAgent returns undefined for unknown agents ───────────
    it('returns undefined for an unknown agent name', () => {
        const model = manager.getModelForAgent('nonexistent-agent');
        expect(model).toBeUndefined();
    });
    // ── 10. PRESETS constant has all required presets ──────────────────────
    it('PRESETS constant contains all three presets with correct tiers', () => {
        expect(Object.keys(PRESETS)).toEqual(['free', 'balanced', 'premium']);
        expect(PRESETS.free.tier).toBe('free');
        expect(PRESETS.balanced.tier).toBe('balanced');
        expect(PRESETS.premium.tier).toBe('premium');
    });
});
//# sourceMappingURL=index.test.js.map