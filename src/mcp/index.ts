import type { McpName, McpConfig } from './types';
import type { McpServerConfig } from '../mcp-bus/types';
import { context7 } from './context7';
import { grep_app } from './grep-app';
import { websearch } from './websearch';

function localMcp(pkg: string): McpConfig {
  return {
    type: 'local',
    command: ['npx', '-y', pkg],
    enabled: true,
  };
}

const allBuiltinMcps: Record<McpName, McpConfig> = {
  websearch,
  context7,
  grep_app,
  clawdi:          localMcp('@opencode-ai/clawdi-mcp'),
  gbrain:          localMcp('gbrain-mcp'),
  'context-mode': localMcp('@opencode-ai/context-mode-mcp'),
  'code-review-graph': localMcp('code-review-graph-mcp'),
  gitnexus:        localMcp('gitnexus-mcp'),
  'loom-mcp':      localMcp('@opencode-ai/loom-mcp'),
  openspace:       localMcp('@opencode-ai/openspace-mcp'),
  exa:             { type: 'remote' as const, url: 'https://mcp.exa.ai/mcp', enabled: true },
  gh_grep:         { type: 'remote' as const, url: 'https://mcp.grep.app', enabled: true },
  deepwiki:        localMcp('@opencode-ai/deepwiki-mcp'),
  'sequential-thinking': localMcp('@opencode-ai/sequential-thinking-mcp'),
  'agent-browser': localMcp('@opencode-ai/agent-browser-mcp'),
};

export function createBuiltinMcps(
  disabledMcps: readonly McpName[] = [],
  mergedMcpServers?: McpServerConfig[],
): Record<string, McpConfig> {
  const mcps: Record<string, McpConfig> = {};

  if (mergedMcpServers && mergedMcpServers.length > 0) {
    for (const server of mergedMcpServers) {
      if (disabledMcps.includes(server.name as McpName)) continue;
      if (server.enabled === false) continue;

      if (server.type === 'remote') {
        mcps[server.name] = {
          type: 'remote',
          url: server.url || '',
          enabled: true,
        };
      } else {
        mcps[server.name] = {
          type: 'local',
          command: server.command || ['npx', '-y', server.name],
          enabled: true,
        };
      }
    }
  } else {
    for (const [name, config] of Object.entries(allBuiltinMcps)) {
      if (!disabledMcps.includes(name as McpName)) {
        mcps[name] = config;
      }
    }
  }

  return mcps;
}