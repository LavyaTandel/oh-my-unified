/**
 * System prompt collapse utilities — deduplicate and compress system prompt
 * content across agent turns to save context.
 */
export declare function collapseSystemInPlace(messages: Array<{
    role: string;
    content: string;
}>, maxLength?: number): void;
//# sourceMappingURL=system-collapse.d.ts.map