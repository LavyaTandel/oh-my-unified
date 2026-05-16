import type { McpName, McpConfig } from './types';
import type { McpServerConfig } from '../mcp-bus/types';
import { context7 } from './context7';
import { grep_app } from './grep-app';
import { createWebsearchConfig } from './websearch';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  websearch: createWebsearchConfig(),
  context7,
  grep_app,
  clawdi: { name: 'clawdi', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/clawdi-mcp'], env: {} },
  gbrain: { name: 'gbrain', type: 'stdio', command: 'npx', args: ['-y', 'gbrain-mcp'], env: {} },
  'context-mode': { name: 'context-mode', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/context-mode-mcp'], env: {} },
  'code-review-graph': { name: 'code-review-graph', type: 'stdio', command: 'npx', args: ['-y', 'code-review-graph-mcp'], env: {} },
  gitnexus: { name: 'gitnexus', type: 'stdio', command: 'npx', args: ['-y', 'gitnexus-mcp'], env: {} },
  'loom-mcp': { name: 'loom-mcp', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/loom-mcp'], env: {} },
  openspace: { name: 'openspace', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/openspace-mcp'], env: {} },
  exa: { name: 'exa', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/exa-mcp'], env: {} },
  gh_grep: { name: 'gh_grep', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/gh-grep-mcp'], env: {} },
  deepwiki: { name: 'deepwiki', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/deepwiki-mcp'], env: {} },
  'sequential-thinking': { name: 'sequential-thinking', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/sequential-thinking-mcp'], env: {} },
  'agent-browser': { name: 'agent-browser', type: 'stdio', command: 'npx', args: ['-y', '@opencode-ai/agent-browser-mcp'], env: {} },
};

function mcpServerToConfig(server: McpServerConfig): McpConfig {
  if (server.type === 'local' && server.command) {
    const [cmd, ...args] = server.command;
    return {
      name: server.name,
      type: 'stdio',
      command: cmd,
      args,
      env: {},
    };
  }
  if (server.type === 'remote' && server.url) {
    return {
      name: server.name,
      type: 'sse',
      url: server.url,
    };
  }
  return { name: server.name, type: 'stdio', command: 'npx', args: ['-y', server.name], env: {} };
}

export function createBuiltinMcps(
  disabledMcps: readonly McpName[] = [],
  websearchConfig?: { provider: 'exa' | 'tavily'; apiKey?: string },
  mergedMcpServers?: McpServerConfig[],
): Record<string, McpConfig> {
  const mcps: Record<string, McpConfig> = {};

  // Start with built-in defaults
  for (const [name, config] of Object.entries(allBuiltinMcps)) {
    if (!disabledMcps.includes(name as McpName)) {
      mcps[name] = config;
    }
  }

  // Override with discovered/merged MCPs
  if (mergedMcpServers) {
    for (const server of mergedMcpServers) {
      if (!server.enabled) continue;
      if (disabledMcps.includes(server.name as McpName)) continue;
      mcps[server.name] = mcpServerToConfig(server);
    }
  }

  if (!disabledMcps.includes('websearch') && websearchConfig) {
    mcps.websearch = createWebsearchConfig(websearchConfig);
  }

  return mcps;
}