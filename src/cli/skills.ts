import type { PluginConfig } from '../config/schema';

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