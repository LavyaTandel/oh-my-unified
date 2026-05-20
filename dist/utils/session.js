export const SESSION_ABORT_TIMEOUT_MS = 1_000;
export class OperationTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OperationTimeoutError';
    }
}
export async function withTimeout(operation, timeoutMs, message) {
    if (timeoutMs <= 0)
        return operation;
    let timer;
    try {
        return await Promise.race([
            operation,
            new Promise((_, reject) => {
                timer = setTimeout(() => {
                    reject(new OperationTimeoutError(message));
                }, timeoutMs);
            }),
        ]);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function abortSessionWithTimeout(client, sessionId, timeoutMs = SESSION_ABORT_TIMEOUT_MS) {
    await withTimeout(client.session.abort({ path: { id: sessionId } }), timeoutMs, `Session abort timed out after ${timeoutMs}ms`);
}
export function shortModelLabel(modelId) {
    const parts = modelId.split('/');
    return parts[parts.length - 1] || modelId;
}
//# sourceMappingURL=session.js.map