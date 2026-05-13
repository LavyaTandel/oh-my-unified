import type { McpName, McpConfig } from './types';
import { context7 } from './context7';
import { grep_app } from './grep-app';
import { createWebsearchConfig } from './websearch';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  websearch: createWebsearchConfig(),
  context7,
  grep_app,
};

export function createBuiltinMcps(
  disabledMcps: readonly McpName[] = [],
  websearchConfig?: { provider: 'exa' | 'tavily'; apiKey?: string },
): Record<string, McpConfig> {
  const mcps: Record<string, McpConfig> = {};

  for (const [name, config] of Object.entries(allBuiltinMcps)) {
    if (!disabledMcps.includes(name as McpName)) {
      mcps[name] = config;
    }
  }

  // Override websearch with user-configured provider
  if (!disabledMcps.includes('websearch') && websearchConfig) {
    mcps.websearch = createWebsearchConfig(websearchConfig);
  }

  return mcps;
}