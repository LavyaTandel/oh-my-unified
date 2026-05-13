/**
 * System prompt collapse utilities — deduplicate and compress system prompt
 * content across agent turns to save context.
 */
export function collapseSystemInPlace(
  messages: Array<{ role: string; content: string }>,
  maxLength: number = 4000,
): void {
  if (messages.length <= 2) return;

  // Find the system message (usually first)
  const systemIndex = messages.findIndex((m) => m.role === 'system');
  if (systemIndex === -1) return;

  const systemMsg = messages[systemIndex];
  if (systemMsg.content.length <= maxLength) return;

  // Collapse: keep first 500 chars + last 500 chars
  const collapsed =
    systemMsg.content.slice(0, 500) +
    '\n\n[...system prompt truncated for context efficiency...]\n\n' +
    systemMsg.content.slice(-500);

  messages[systemIndex] = { ...systemMsg, content: collapsed };
}