export class AgentContextEnricher {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    generateMcpContextBlock() {
        return this.catalog.toMarkdown();
    }
    generateToolSuggestions(taskDescription) {
        return this.catalog.generateTaskSuggestions(taskDescription);
    }
}
//# sourceMappingURL=agent-context-enricher.js.map