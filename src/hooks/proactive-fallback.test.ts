import { describe, it, expect } from 'bun:test';
import { createProactiveFallbackHook } from './proactive-fallback';

describe('createProactiveFallbackHook', () => {
  it('creates hook with required methods', () => {
    const hook = createProactiveFallbackHook({} as any, {} as any);
    expect(hook['chat.params']).toBeDefined();
    expect(hook.recordError).toBeDefined();
    expect(hook.recordSuccess).toBeDefined();
    expect(hook.getFallbackLogs).toBeDefined();
    expect(hook.getErrorRates).toBeDefined();
  });

  it('does nothing when disabled', async () => {
    const hook = createProactiveFallbackHook({} as any, {} as any, { enabled: false });
    const output: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output,
    );
    expect(output.options.fallbackModel).toBeUndefined();
  });

  it('records errors and calculates error rate', () => {
    const hook = createProactiveFallbackHook({} as any, {} as any);
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');
    hook.recordSuccess('openai/gpt-4o');

    const rates = hook.getErrorRates();
    expect(rates['openai/gpt-4o'].samples).toBe(3);
    expect(rates['openai/gpt-4o'].rate).toBeGreaterThan(0);
  });

  it('triggers fallback when error rate exceeds threshold', async () => {
    const hook = createProactiveFallbackHook({} as any, {} as any, {
      errorThreshold: 0.3,
      minSamples: 3,
      chains: { 'openai/gpt-4o': ['anthropic/claude-sonnet'] },
    });

    // Record errors to exceed threshold
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');

    const output: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output,
    );

    expect(output.options.fallbackModel).toBe('anthropic/claude-sonnet');
  });

  it('respects cooldown period', async () => {
    const hook = createProactiveFallbackHook({} as any, {} as any, {
      errorThreshold: 0.3,
      minSamples: 3,
      cooldownSeconds: 60,
      chains: { 'openai/gpt-4o': ['anthropic/claude-sonnet'] },
    });

    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');

    const output1: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output1,
    );
    expect(output1.options.fallbackModel).toBe('anthropic/claude-sonnet');

    // Second call within cooldown should not trigger
    const output2: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output2,
    );
    expect(output2.options.fallbackModel).toBeUndefined();
  });

  it('logs fallback events', async () => {
    const hook = createProactiveFallbackHook({} as any, {} as any, {
      errorThreshold: 0.3,
      minSamples: 3,
      chains: { 'openai/gpt-4o': ['anthropic/claude-sonnet'] },
    });

    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');

    const output: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output,
    );

    const logs = hook.getFallbackLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].from).toBe('openai/gpt-4o');
    expect(logs[0].to).toBe('anthropic/claude-sonnet');
  });

  it('does not fallback without chain', async () => {
    const hook = createProactiveFallbackHook({} as any, {} as any, {
      errorThreshold: 0.3,
      minSamples: 3,
      chains: {},
    });

    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');
    hook.recordError('openai/gpt-4o');

    const output: any = { temperature: 1, topP: 1, topK: 1, maxOutputTokens: undefined, options: {} };
    await hook['chat.params'](
      { sessionID: 's1', agent: 'odin', model: { id: 'openai/gpt-4o' } },
      output,
    );

    expect(output.options.fallbackModel).toBeUndefined();
  });
});
