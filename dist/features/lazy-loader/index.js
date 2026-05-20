// Lazy loading system — agents, MCPs, and skills are REGISTERED at startup
// (zero token cost) but only LOADED when actually needed.
export class LazyLoader {
    registry = new Map();
    disabledList = new Set();
    // Register a component (name only — zero token cost)
    register(id, type, name, desc) {
        this.registry.set(id, {
            id, type, name, description: desc,
            loaded: false,
            disabled: this.disabledList.has(id),
        });
    }
    // Load a component on demand (when actually needed)
    load(id) {
        const component = this.registry.get(id);
        if (!component || component.disabled)
            return null;
        component.loaded = true;
        return component;
    }
    // List what's available (no loading)
    listAvailable() {
        return Array.from(this.registry.values()).filter(c => !c.disabled);
    }
    // User control: disable per session/project
    disable(id) {
        const component = this.registry.get(id);
        if (component)
            component.disabled = true;
        this.disabledList.add(id);
    }
    enable(id) {
        const component = this.registry.get(id);
        if (component)
            component.disabled = false;
        this.disabledList.delete(id);
    }
    // Load all agents on demand when a task needs them
    loadAgentsForTask(taskType) {
        const loaded = [];
        // Logic: based on task type, load relevant agents
        if (taskType.includes('plan') || taskType.includes('interview')) {
            const o = this.load('odin');
            if (o)
                loaded.push(o.name);
        }
        if (taskType.includes('search') || taskType.includes('find')) {
            const s = this.load('sif');
            if (s)
                loaded.push(s.name);
        }
        return loaded;
    }
}
// Singleton instance for cross-module registration
export const lazyLoader = new LazyLoader();
//# sourceMappingURL=index.js.map