// Lazy loading system — agents, MCPs, and skills are REGISTERED at startup
// (zero token cost) but only LOADED when actually needed.

export interface LoadableComponent {
  id: string
  type: 'agent' | 'mcp' | 'skill'
  name: string
  description: string
  loaded: boolean
  disabled: boolean  // user can disable per session/project
}

export class LazyLoader {
  private registry: Map<string, LoadableComponent> = new Map()
  private disabledList: Set<string> = new Set()

  // Register a component (name only — zero token cost)
  register(id: string, type: LoadableComponent['type'], name: string, desc: string): void {
    this.registry.set(id, {
      id, type, name, description: desc,
      loaded: false,
      disabled: this.disabledList.has(id),
    })
  }

  // Load a component on demand (when actually needed)
  load(id: string): LoadableComponent | null {
    const component = this.registry.get(id)
    if (!component || component.disabled) return null
    component.loaded = true
    return component
  }

  // List what's available (no loading)
  listAvailable(): LoadableComponent[] {
    return Array.from(this.registry.values()).filter(c => !c.disabled)
  }

  // User control: disable per session/project
  disable(id: string): void {
    const component = this.registry.get(id)
    if (component) component.disabled = true
    this.disabledList.add(id)
  }

  enable(id: string): void {
    const component = this.registry.get(id)
    if (component) component.disabled = false
    this.disabledList.delete(id)
  }

  // Load all agents on demand when a task needs them
  loadAgentsForTask(taskType: string): string[] {
    const loaded: string[] = []
    // Logic: based on task type, load relevant agents
    if (taskType.includes('plan') || taskType.includes('interview')) {
      const o = this.load('odin'); if (o) loaded.push(o.name)
    }
    if (taskType.includes('search') || taskType.includes('find')) {
      const s = this.load('sif'); if (s) loaded.push(s.name)
    }
    return loaded
  }
}
