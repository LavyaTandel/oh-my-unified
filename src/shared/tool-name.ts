const TOOL_NAMES = new Set([
  'bash', 'read', 'write', 'edit', 'grep', 'glob',
  'webfetch', 'websearch', 'task', 'session_read',
  'session_info', 'session_search',
])

export function isPrimitiveTool(name: string): boolean {
  return TOOL_NAMES.has(name) || ['ls', 'cat', 'head', 'tail', 'echo', 'find'].some(p => name.startsWith(p))
}

export function isBuiltinTool(name: string): boolean {
  return ['task', 'delegate_task', 'session_read', 'session_info', 'session_search', 'council'].includes(name)
}
