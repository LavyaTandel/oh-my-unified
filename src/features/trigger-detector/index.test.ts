import { describe, it, expect } from 'bun:test';
import { TriggerDetector, createDefaultTriggerDetector } from './index';

describe('TriggerDetector', () => {
  describe('includes mode', () => {
    it('matches keyword in input', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hello world'], mode: 'includes' });
      expect(d.detect('can you hello world please')).not.toBeNull();
    });

    it('is case insensitive', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['HELLO'], mode: 'includes' });
      expect(d.detect('say hello there')).not.toBeNull();
    });

    it('returns null when no match', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['xyz'], mode: 'includes' });
      expect(d.detect('nothing here')).toBeNull();
    });
  });

  describe('exact mode', () => {
    it('matches only exact input', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hello'], mode: 'exact' });
      expect(d.detect('hello')).not.toBeNull();
      expect(d.detect('hello world')).toBeNull();
    });
  });

  describe('regex mode', () => {
    it('matches regex pattern', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['sec(urity|ret)'], mode: 'regex' });
      expect(d.detect('security check')).not.toBeNull();
      expect(d.detect('secret found')).not.toBeNull();
    });

    it('returns false on invalid regex', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['[invalid'], mode: 'regex' });
      expect(d.detect('test')).toBeNull();
    });
  });

  describe('fuzzy mode', () => {
    it('matches subsequence', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hw'], mode: 'fuzzy' });
      expect(d.detect('hello world')).not.toBeNull();
    });

    it('falls back to includes when fuzzy fails', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['security'], mode: 'fuzzy' });
      expect(d.detect('run security audit')).not.toBeNull();
    });
  });

  describe('priority ordering', () => {
    it('returns highest priority match', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'low', keywords: ['test'], priority: 10 });
      d.register({ feature: 'high', keywords: ['test'], priority: 90 });
      const result = d.detect('run test now');
      expect(result?.feature).toBe('high');
    });
  });

  describe('detectAll', () => {
    it('returns all matches sorted by priority', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'a', keywords: ['run'], priority: 50 });
      d.register({ feature: 'b', keywords: ['run'], priority: 80 });
      d.register({ feature: 'c', keywords: ['run'], priority: 30 });
      const results = d.detectAll('run this');
      expect(results).toHaveLength(3);
      expect(results[0].feature).toBe('b');
      expect(results[1].feature).toBe('a');
      expect(results[2].feature).toBe('c');
    });
  });

  describe('enable/disable', () => {
    it('skips disabled rules', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hello'], enabled: false });
      expect(d.detect('hello')).toBeNull();
    });

    it('toggles enable state', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hello'] });
      expect(d.isEnabled('test')).toBe(true);
      d.setEnabled('test', false);
      expect(d.isEnabled('test')).toBe(false);
      expect(d.detect('hello')).toBeNull();
    });
  });

  describe('getRules and clear', () => {
    it('returns copy of rules', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'test', keywords: ['hello'] });
      expect(d.getRules()).toHaveLength(1);
    });

    it('clears all rules', () => {
      const d = new TriggerDetector();
      d.register({ feature: 'a', keywords: ['x'] });
      d.register({ feature: 'b', keywords: ['y'] });
      d.clear();
      expect(d.getRules()).toHaveLength(0);
    });
  });
});

describe('createDefaultTriggerDetector', () => {
  it('has all 4 features registered', () => {
    const d = createDefaultTriggerDetector();
    expect(d.isEnabled('security-research')).toBe(true);
    expect(d.isEnabled('review-work')).toBe(true);
    expect(d.isEnabled('hyperplan')).toBe(true);
    expect(d.isEnabled('ralph-loop')).toBe(true);
  });

  it('detects security keywords', () => {
    const d = createDefaultTriggerDetector();
    expect(d.detect('run a security audit')?.feature).toBe('security-research');
    expect(d.detect('do a threat model')?.feature).toBe('security-research');
    expect(d.detect('check OWASP compliance')?.feature).toBe('security-research');
  });

  it('detects review keywords', () => {
    const d = createDefaultTriggerDetector();
    expect(d.detect('review my work')?.feature).toBe('review-work');
    expect(d.detect('quality check please')?.feature).toBe('review-work');
  });

  it('detects hyperplan keywords', () => {
    const d = createDefaultTriggerDetector();
    expect(d.detect('do a hyperplan')?.feature).toBe('hyperplan');
    expect(d.detect('red team this plan')?.feature).toBe('hyperplan');
  });

  it('detects ralph loop keywords', () => {
    const d = createDefaultTriggerDetector();
    expect(d.detect('ralph loop on this')?.feature).toBe('ralph-loop');
    expect(d.detect('refine this code')?.feature).toBe('ralph-loop');
  });

  it('respects priority ordering', () => {
    const d = createDefaultTriggerDetector();
    const result = d.detect('security review and code review');
    expect(result?.feature).toBe('security-research');
  });
});
