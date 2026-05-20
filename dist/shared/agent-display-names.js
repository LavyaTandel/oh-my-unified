const AGENT_DISPLAY_NAMES = {
    odin: '@Odin', njord: '@Njord', mimir: '@Mimir',
    vidar: '@Vidar', thor: '@Thor', forseti: '@Forseti',
    frigg: '@Frigg', tyr: '@Tyr', sif: '@Sif',
    eir: '@Eir', freyr: '@Freyr', hermod: '@Hermod',
    heimdall: '@Heimdall', magni: '@Magni', hod: '@Hod',
};
export function getAgentDisplayName(name) {
    return AGENT_DISPLAY_NAMES[name] || `@${name}`;
}
//# sourceMappingURL=agent-display-names.js.map