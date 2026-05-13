import type { PluginConfig } from '../config/schema';

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  orchestrator: 'Orchestrator',
  oracle: 'Oracle',
  librarian: 'Librarian',
  explorer: 'Explorer',
  designer: 'Designer',
  fixer: 'Fixer',
  observer: 'Observer',
  council: 'Council',
  councillor: 'Councillor',
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