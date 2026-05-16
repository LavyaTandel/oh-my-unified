import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { RuntimeFallbackManager, isRateLimitError, createModelFallbackHook } from './model-fallback';

type RuntimeFallbackClient = ConstructorParameters<
  typeof RuntimeFallbackManager
>[0];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockClient(overrides?: {
  promptAsyncImpl?: (args: unknown) => Promise<unknown>;
  abortImpl?: () => Promise<unknown>;
  includePromptAsync?: boolean;
  messagesData?: Array<{ info: { role: string }; parts: unknown[] }>;
}) {
  const promptAsync = mock(async (args: unknown) => {
    if (overrides?.promptAsyncImpl) return overrides.promptAsyncImpl(args);
    return {};
  });
  const abort = mock(async () => {
    if (overrides?.abortImpl) return overrides.abortImpl();
    return {};
  });
  const messages = mock(async () => ({
    data: overrides?.messagesData ?? [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'hello' }] },
    ],
  }));
  const session: Record<string, unknown> = {
    abort,
    messages,
  };
  if (overrides?.includePromptAsync !== false) {
    session.promptAsync = promptAsync;
  }

  return {
    client: {
      session,
    } as unknown as RuntimeFallbackClient,
    mocks: { promptAsync, abort, messages },
  };
}

function makeChains(
  overrides?: Record<string, string[]>,
): Record<string, string[]> {
  return {
    orchestrator: [
      'anthropic/claude-opus-4-5',
      'openai/gpt-4o',
      'google/gemini-2.5-pro',
    ],
    explorer: ['openai/gpt-4o-mini', 'anthropic/claude-haiku'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isRateLimitError
// ---------------------------------------------------------------------------

describe('isRateLimitError', () => {
  test('returns true for 429 status code', () => {
    expect(isRateLimitError({ data: { statusCode: 429 } })).toBe(true);
  });

  test('returns true for "rate limit" in message', () => {
    expect(isRateLimitError({ message: 'Rate limit exceeded' })).toBe(true);
  });

  test('returns true for "quota exceeded" in responseBody', () => {
    expect(isRateLimitError({ data: { responseBody: 'quota exceeded' } })).toBe(
      true,
    );
  });

  test('returns true for "usage exceeded"', () => {
    expect(isRateLimitError({ message: 'usage exceeded' })).toBe(true);
  });

  test('returns true for "overloaded"', () => {
    expect(isRateLimitError({ message: 'overloaded_error' })).toBe(true);
  });

  test('returns false for non-rate-limit error', () => {
    expect(isRateLimitError({ message: 'invalid API key' })).toBe(false);
  });

  test('returns false for null', () => {
    expect(isRateLimitError(null)).toBe(false);
  });

  test('returns false for non-object', () => {
    expect(isRateLimitError('string error')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — disabled
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager (disabled)', () => {
  test('does nothing when enabled=false', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), false, 3);

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-1',
        error: { message: 'rate limit exceeded' },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — session.error
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager session.error', () => {
  let client: ReturnType<typeof createMockClient>['client'];
  let mocks: ReturnType<typeof createMockClient>['mocks'];
  let mgr: RuntimeFallbackManager;

  beforeEach(() => {
    ({ client, mocks } = createMockClient());
    mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);
  });

  test('triggers fallback on rate-limit session.error', async () => {
    // First teach the manager which model is in use for this session
    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-1',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
          role: 'assistant',
        },
      },
    });

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-1',
        error: { message: 'Rate limit exceeded' },
      },
    });

    expect(mocks.abort).toHaveBeenCalledTimes(1);
    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);

    const call = mocks.promptAsync.mock.calls[0] as [
      {
        path: { id: string };
        body: { model: { providerID: string; modelID: string } };
      },
    ];
    expect(call[0].path.id).toBe('sess-1');
    expect(call[0].body.model.providerID).toBe('openai');
    expect(call[0].body.model.modelID).toBe('gpt-4o');
  });

  test('does nothing when error is not a rate limit', async () => {
    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-1',
        error: { message: 'invalid request' },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });

  test('does nothing when no chain configured for session', async () => {
    const emptyMgr = new RuntimeFallbackManager(client, {}, true, 3);
    await emptyMgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-1',
        error: { message: 'rate limit exceeded' },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });

  test('does not abort when promptAsync is unavailable', async () => {
    const { client, mocks } = createMockClient({ includePromptAsync: false });
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-no-prompt-async',
        error: { message: 'Rate limit exceeded' },
      },
    });

    expect(mocks.abort).not.toHaveBeenCalled();
    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });

  test('continues fallback when abort rejects', async () => {
    const { client, mocks } = createMockClient({
      abortImpl: async () => {
        throw new Error('abort failed');
      },
    });
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-abort-rejects',
        error: { message: 'Rate limit exceeded' },
      },
    });

    expect(mocks.abort).toHaveBeenCalledTimes(1);
    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — message.updated
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager message.updated', () => {
  test('tracks model from message.updated and falls back on error', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-2',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      {
        body: { model: { providerID: string; modelID: string } };
      },
    ];
    expect(call[0].body.model.providerID).toBe('openai');
    expect(call[0].body.model.modelID).toBe('gpt-4o');
  });

  test('uses agent name from message.updated to select correct chain', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-3',
          agent: 'explorer',
          providerID: 'openai',
          modelID: 'gpt-4o-mini',
          error: { message: 'quota exceeded' },
        },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      {
        body: { model: { providerID: string; modelID: string } };
      },
    ];
    expect(call[0].body.model.providerID).toBe('anthropic');
    expect(call[0].body.model.modelID).toBe('claude-haiku');
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — session.status retry
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager session.status', () => {
  test('triggers fallback on retry status with rate limit message', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-4',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
        },
      },
    });

    await mgr.handleEvent({
      type: 'session.status',
      properties: {
        sessionID: 'sess-4',
        status: { type: 'retry', message: 'usage limit reached, retrying...' },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
  });

  test('ignores session.status with non-rate-limit retry message', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'session.status',
      properties: {
        sessionID: 'sess-4',
        status: { type: 'retry', message: 'connection timeout, retrying...' },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — chain exhaustion
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager chain exhaustion', () => {
  test('does not call promptAsync when all chain models have been tried', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(
      client,
      { orchestrator: ['openai/model-y'] },
      true,
      3,
    );

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-exhaust-2',
          agent: 'orchestrator',
          providerID: 'openai',
          modelID: 'model-y',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — deduplication
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager deduplication', () => {
  test('ignores a second trigger within dedup window for same session', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    const event = {
      type: 'session.error',
      properties: {
        sessionID: 'sess-dup',
        error: { message: 'rate limit exceeded' },
      },
    };

    await mgr.handleEvent(event);
    await mgr.handleEvent(event);

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
  });

  test('different sessions are not deduplicated against each other', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'session.error',
      properties: { sessionID: 'sess-A', error: { message: 'rate limit' } },
    });
    await mgr.handleEvent({
      type: 'session.error',
      properties: { sessionID: 'sess-B', error: { message: 'rate limit' } },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — subagent.session.created
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager subagent.session.created', () => {
  test('records agent name from subagent.session.created when agentName provided', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'subagent.session.created',
      properties: { sessionID: 'sub-1', agentName: 'explorer' },
    });

    await mgr.handleEvent({
      type: 'session.error',
      properties: { sessionID: 'sub-1', error: { message: 'rate limit' } },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      {
        body: { model: { providerID: string; modelID: string } };
      },
    ];
    expect(call[0].body.model.providerID).toBe('openai');
    expect(call[0].body.model.modelID).toBe('gpt-4o-mini');
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — session.deleted cleanup
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager session.deleted', () => {
  test('cleans up session state on session.deleted preventing memory leaks', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-del',
          agent: 'orchestrator',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
        },
      },
    });

    await mgr.handleEvent({
      type: 'session.deleted',
      properties: { sessionID: 'sess-del' },
    });

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-del',
        error: { message: 'rate limit exceeded' },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      { body: { model: { providerID: string; modelID: string } } },
    ];
    expect(call[0].body.model.providerID).toBe('anthropic');
    expect(call[0].body.model.modelID).toBe('claude-opus-4-5');
  });

  test('ignores session.deleted with no sessionID', async () => {
    const { client } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);
    await expect(
      mgr.handleEvent({ type: 'session.deleted', properties: {} }),
    ).resolves.toBeUndefined();
  });

  test('cleans up state using info.id shape (top-level session deletion)', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(client, makeChains(), true, 3);

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-info-del',
          agent: 'orchestrator',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
        },
      },
    });

    await mgr.handleEvent({
      type: 'session.deleted',
      properties: { info: { id: 'sess-info-del' } },
    });

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'sess-info-del',
        error: { message: 'rate limit exceeded' },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — resolveChain cross-agent isolation
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager resolveChain cross-agent isolation', () => {
  test('does not use another agent chain when known agent has no configured chain', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(
      client,
      {
        orchestrator: ['openai/gpt-4o', 'google/gemini-2.5-pro'],
      },
      true,
      3,
    );

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'oracle-sess',
          agent: 'oracle',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });

  test('uses cross-agent last-resort only when agent name is unknown', async () => {
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(
      client,
      { orchestrator: ['openai/gpt-4o'] },
      true,
      3,
    );

    await mgr.handleEvent({
      type: 'session.error',
      properties: {
        sessionID: 'unknown-agent-sess',
        error: { message: 'rate limit exceeded' },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      { body: { model: { providerID: string; modelID: string } } },
    ];
    expect(call[0].body.model.providerID).toBe('openai');
    expect(call[0].body.model.modelID).toBe('gpt-4o');
  });
});

// ---------------------------------------------------------------------------
// RuntimeFallbackManager — maxAttempts
// ---------------------------------------------------------------------------

describe('RuntimeFallbackManager maxAttempts', () => {
  test('respects maxAttempts limit', async () => {
    // Scenario: chain = ['openai/model-b', 'openai/model-c'], current = model-b, maxAttempts=1
    // tried gets model-b (current) → tried.add(model-c) → tried.size=2 > maxAttempts=1 → blocked
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(
      client,
      { orchestrator: ['openai/model-b', 'openai/model-c'] },
      true,
      1, // max 1 attempt total
    );

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-max',
          agent: 'orchestrator',
          providerID: 'openai',
          modelID: 'model-b',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    // Should NOT call promptAsync because tried.size (2) > maxAttempts (1)
    expect(mocks.promptAsync).not.toHaveBeenCalled();
  });

  test('allows fallback when within maxAttempts', async () => {
    // Scenario: chain = ['openai/model-a', 'openai/model-b', 'openai/model-c'],
    // current = model-a, maxAttempts=2
    // tried gets model-a → tried.add(model-b) → tried.size=2, NOT > maxAttempts(2) → allowed
    const { client, mocks } = createMockClient();
    const mgr = new RuntimeFallbackManager(
      client,
      { orchestrator: ['openai/model-a', 'openai/model-b', 'openai/model-c'] },
      true,
      2,
    );

    await mgr.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-max-ok',
          agent: 'orchestrator',
          providerID: 'openai',
          modelID: 'model-a',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    expect(mocks.promptAsync).toHaveBeenCalledTimes(1);
    const call = mocks.promptAsync.mock.calls[0] as [
      { body: { model: { providerID: string; modelID: string } } },
    ];
    expect(call[0].body.model.providerID).toBe('openai');
    expect(call[0].body.model.modelID).toBe('model-b');
  });
});

// ---------------------------------------------------------------------------
// createModelFallbackHook factory
// ---------------------------------------------------------------------------

describe('createModelFallbackHook', () => {
  test('returns handleEvent and getFallbackLogs', () => {
    const { client } = createMockClient();
    const hook = createModelFallbackHook(
      { client, directory: '/tmp' } as any,
      {},
      { enabled: true, chains: { orchestrator: ['openai/gpt-4o'] }, maxAttempts: 3 },
    );

    expect(typeof hook.handleEvent).toBe('function');
    expect(typeof hook.getFallbackLogs).toBe('function');
    expect(hook.getFallbackLogs()).toEqual([]);
  });

  test('getFallbackLogs returns logs after fallback', async () => {
    const { client } = createMockClient();
    const hook = createModelFallbackHook(
      { client, directory: '/tmp' } as any,
      {},
      { enabled: true, chains: { orchestrator: ['openai/gpt-4o'] }, maxAttempts: 3 },
    );

    await hook.handleEvent({
      type: 'message.updated',
      properties: {
        info: {
          sessionID: 'sess-logs',
          agent: 'orchestrator',
          providerID: 'anthropic',
          modelID: 'claude-opus-4-5',
          error: { message: 'rate limit exceeded' },
        },
      },
    });

    const logs = hook.getFallbackLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].agent).toBe('orchestrator');
    expect(logs[0].from).toBe('anthropic/claude-opus-4-5');
    expect(logs[0].to).toBe('openai/gpt-4o');
  });
});
