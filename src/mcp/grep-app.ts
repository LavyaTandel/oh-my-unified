import type { McpConfig } from './types';

export const grep_app: McpConfig = {
  name: 'grep_app',
  type: 'mcp',
  command: 'npx',
  args: ['-y', '@anthropic-ai/grep-mcp@latest'],
  env: {},
};