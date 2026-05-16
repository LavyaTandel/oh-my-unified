import type { PluginInput } from '@opencode-ai/plugin';

type OpencodeClient = PluginInput['client'];

export const SESSION_ABORT_TIMEOUT_MS = 1_000;

export class OperationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationTimeoutError';
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  if (timeoutMs <= 0) return operation;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new OperationTimeoutError(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function abortSessionWithTimeout(
  client: OpencodeClient,
  sessionId: string,
  timeoutMs = SESSION_ABORT_TIMEOUT_MS,
): Promise<void> {
  await withTimeout(
    client.session.abort({ path: { id: sessionId } }),
    timeoutMs,
    `Session abort timed out after ${timeoutMs}ms`,
  );
}

export function shortModelLabel(modelId: string): string {
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
}
