import type { PluginConfig } from '../config/schema';

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  orchestrator: 'Orchestrator',
  odin: 'Odin',
  njord: 'Njord',
  mimir: 'Mimir',
  vidar: 'Vidar',
  thor: 'Thor',
  forseti: 'Forseti',
  frigg: 'Frigg',
  tyr: 'Tyr',
  sif: 'Sif',
  eir: 'Eir',
  freyr: 'Freyr',
  hermod: 'Hermod',
  heimdall: 'Heimdall',
  magni: 'Magni',
  hod: 'Hod',
};

export function createDisplayNameMentionRewriter(
  config: PluginConfig | undefined,
) {
  const overrides = config?.agents ?? {};

  return {
    rewrite(displayName: string, agentName: string): string {
      const override = overrides[agentName];
      if (override?.displayName) {
        return override.displayName;
      }
      return DISPLAY_NAME_OVERRIDES[agentName] || displayName;
    },
  };
}
