import { readFileSync, existsSync } from 'node:fs'
import type { McpServerConfig } from '../mcp-bus/types.js'

export interface DiscoveredMcp {
  name: string
  type: 'local' | 'remote'
  command?: string[]
  url?: string
  enabled: boolean
  source: 'discovered' | 'default'
}

function homeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '/tmp'
}

const DEFAULT_OPENCODE_CONFIG = `${homeDir()}/.config/opencode/opencode.json`

/**
 * Read MCP servers from the user's opencode.json.
 * Returns discovered MCP configs or empty array if file doesn't exist.
 */
export function discoverUserMcps(configPath?: string): DiscoveredMcp[] {
  const path = configPath || DEFAULT_OPENCODE_CONFIG
  try {
    if (!existsSync(path)) return []
    const raw = readFileSync(path, 'utf-8')
    const config = JSON.parse(raw) as { mcp?: Record<string, unknown> }
    const mcpSection = config.mcp
    if (!mcpSection || typeof mcpSection !== 'object') return []

    const results: DiscoveredMcp[] = []
    for (const [name, cfg] of Object.entries(mcpSection)) {
      if (typeof cfg !== 'object' || cfg === null) continue
      if ((cfg as any).enabled === false) continue

      const mcpType = (cfg as any).type || 'stdio'
      if (mcpType === 'stdio' || mcpType === 'local') {
        const cmd = (cfg as any).command
        const args = (cfg as any).args || []
        results.push({
          name,
          type: 'local',
          command: cmd ? [cmd, ...args] : ['npx', '-y', name],
          enabled: true,
          source: 'discovered',
        })
      } else if (mcpType === 'sse' || mcpType === 'http' || mcpType === 'remote') {
        results.push({
          name,
          type: 'remote',
          url: (cfg as any).url || (cfg as any).endpoint,
          enabled: true,
          source: 'discovered',
        })
      }
    }
    return results
  } catch {
    return []
  }
}

/**
 * Merge discovered MCPs with default servers.
 * Discovered MCPs override defaults with the same name.
 * Defaults are kept as fallback for MCPs not in user config.
 */
export function mergeMcpConfigs(
  discovered: DiscoveredMcp[],
  defaults: McpServerConfig[],
): McpServerConfig[] {
  const discoveredMap = new Map(discovered.map(d => [d.name, d]))
  const result: McpServerConfig[] = []

  // Start with defaults, override with discovered
  for (const def of defaults) {
    const disc = discoveredMap.get(def.name)
    if (disc) {
      result.push({ ...def, command: disc.command, url: disc.url, type: disc.type })
    } else {
      result.push(def)
    }
  }

  // Add discovered MCPs that aren't in defaults
  for (const [name, disc] of discoveredMap) {
    if (!defaults.some(d => d.name === name)) {
      result.push({
        name: disc.name,
        type: disc.type,
        command: disc.command,
        url: disc.url,
        enabled: disc.enabled,
      })
    }
  }

  return result
}
