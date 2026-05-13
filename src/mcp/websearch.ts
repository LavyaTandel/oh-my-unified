import type { McpConfig } from './types';

export interface WebsearchConfig {
  provider: 'exa' | 'tavily';
  apiKey?: string;
}

export function createWebsearchConfig(
  config?: WebsearchConfig,
): McpConfig {
  const provider = config?.provider ?? 'exa';

  if (provider === 'tavily') {
    return {
      name: 'websearch',
      type: 'mcp',
      command: 'npx',
      args: ['-y', '@anthropic-ai/tavily-mcp@latest'],
      env: config?.apiKey ? { TAVILY_API_KEY: config.apiKey } : {},
    };
  }

  return {
    name: 'websearch',
    type: 'mcp',
    command: 'npx',
    args: ['-y', '@anthropic-ai/exa-mcp@latest'],
    env: config?.apiKey ? { EXA_API_KEY: config.apiKey } : {},
  };
}

export const websearch: McpConfig = createWebsearchConfig();