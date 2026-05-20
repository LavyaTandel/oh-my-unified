const DISPLAY_NAME_OVERRIDES = {
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
export function createDisplayNameMentionRewriter(config) {
    const overrides = config?.agents ?? {};
    return {
        rewrite(displayName, agentName) {
            const override = overrides[agentName];
            if (override?.displayName) {
                return override.displayName;
            }
            return DISPLAY_NAME_OVERRIDES[agentName] || displayName;
        },
    };
}
//# sourceMappingURL=display-name.js.map