const AGENT_DISPLAY_NAMES: Record<string, string> = {
  odin: '@Odin', njord: '@Njord', mimir: '@Mimir',
  vidar: '@Vidar', thor: '@Thor', forseti: '@Forseti',
  frigg: '@Frigg', tyr: '@Tyr', sif: '@Sif',
  eir: '@Eir', freyr: '@Freyr', hermod: '@Hermod',
  heimdall: '@Heimdall', magni: '@Magni', hod: '@Hod',
}
export function getAgentDisplayName(name: string): string {
  return AGENT_DISPLAY_NAMES[name] || `@${name}`
}
