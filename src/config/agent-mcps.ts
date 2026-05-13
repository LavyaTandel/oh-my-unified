import type { PluginConfig } from '../config/schema';

export function getAgentMcpList(
  agentName: string,
  config: Record<string, any> | undefined,
): string[] | undefined {
  const override = config?.agents?.[agentName];
  if (override && Array.isArray(override.mcps)) {
    return override.mcps;
  }
  return undefined;
}

export function getSkillPermissionsForAgent(
  agentName: string,
  config: PluginConfig | undefined,
): string[] | undefined {
  const override = config?.agents?.[agentName];
  if (override?.skills) {
    return override.skills;
  }
  return undefined;
}