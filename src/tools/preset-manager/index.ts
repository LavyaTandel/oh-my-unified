export interface ModelPreset {
  name: string
  description: string
  tier: 'free' | 'cheap' | 'balanced' | 'premium'
  models: Record<string, string>  // agent → model ID
}

export const PRESETS: Record<string, ModelPreset> = {
  free: {
    name: 'Free Models',
    description: 'Uses only free OpenCode models — zero cost, good for exploration',
    tier: 'free',
    models: {
      odin: 'opencode/ring-2.6-1t-free',
      njord: 'opencode/deepseek-v4-flash-free',
      mimir: 'opencode/nemotron-3-super-free',
      thor: 'opencode/deepseek-v4-flash-free',
      sif: 'opencode/big-pickle',
      eir: 'opencode/minimax-m2.5-free',
      freyr: 'opencode/minimax-m2.5-free',
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Mix of free and paid — reasoning on important agents, speed on others',
    tier: 'balanced',
    models: {
      odin: 'openai/gpt-5.5',
      njord: 'openai/gpt-5.5',
      mimir: 'openai/gpt-5.5',
      thor: 'openai/gpt-5.4-mini',
      sif: 'openai/gpt-5.4-mini',
      eir: 'openai/gpt-5.4-mini',
    },
  },
  premium: {
    name: 'Premium',
    description: 'Best models for every agent — highest quality, highest cost',
    tier: 'premium',
    models: {
      odin: 'openai/gpt-5.5-codex',
      njord: 'openai/gpt-5.5-codex',
      mimir: 'openai/gpt-5.5-codex',
      thor: 'openai/gpt-5.5',
      sif: 'openai/gpt-5.5',
      eir: 'openai/gpt-5.5',
    },
  },
}

export class PresetManager {
  private activePreset: string = 'free'

  listPresets(): string[] {
    return Object.keys(PRESETS)
  }

  getPreset(name: string): ModelPreset | undefined {
    return PRESETS[name]
  }

  getActivePreset(): ModelPreset {
    return PRESETS[this.activePreset]
  }

  setActivePreset(name: string): boolean {
    if (PRESETS[name]) {
      this.activePreset = name
      return true
    }
    return false
  }

  getModelForAgent(agentName: string): string | undefined {
    return PRESETS[this.activePreset]?.models[agentName]
  }
}
