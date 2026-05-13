import type { ModelInfo, ModelRoute, AgentModelRequirements } from './types'
import { AGENT_REQUIREMENTS } from './requirements'

export class ModelRouter {
  private availableModels: ModelInfo[] = []
  private modelFallbacks: Map<string, string[]> = new Map()

  // Register available models (from user's connected providers)
  registerModels(models: ModelInfo[]): void {
    this.availableModels = models
  }

  // Register fallback chains for specific models
  registerFallback(modelId: string, fallbacks: string[]): void {
    this.modelFallbacks.set(modelId, fallbacks)
  }

  // Find the best model for an agent based on requirements
  routeForAgent(agentName: string): ModelRoute {
    const reqs = AGENT_REQUIREMENTS[agentName]
    if (!reqs) {
      return { agentName, assignedModel: 'default', fallbackUsed: false, reason: 'No requirements defined' }
    }

    // Score each available model against this agent's requirements
    const scored = this.availableModels
      .filter(m => m.available)
      .map(m => ({
        model: m,
        score: this.calculateMatchScore(reqs, m)
      }))
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      return { agentName, assignedModel: 'none', fallbackUsed: false, reason: 'No models available' }
    }

    const best = scored[0]
    return {
      agentName,
      assignedModel: best.model.id,
      fallbackUsed: false,
      reason: `Best match (score: ${best.score.toFixed(1)}) — reasoning:${reqs.reasoning} speed:${reqs.speed} creativity:${reqs.creativity}`
    }
  }

  // Calculate how well a model matches an agent's requirements
  private calculateMatchScore(reqs: AgentModelRequirements, model: ModelInfo): number {
    const reasonScore = 10 - Math.abs(model.capabilities.reasoning - reqs.reasoning)
    const speedScore = 10 - Math.abs(model.capabilities.speed - reqs.speed)
    const creativeScore = 10 - Math.abs(model.capabilities.creativity - reqs.creativity)
    
    // Weighted: reasoning matters most for strategic agents
    const weights = reqs.reasoning > 7 ? { reasoning: 0.5, speed: 0.2, creativity: 0.3 }
                    : reqs.speed > 7 ? { reasoning: 0.2, speed: 0.6, creativity: 0.2 }
                    : { reasoning: 0.3, speed: 0.3, creativity: 0.4 }

    return (reasonScore * weights.reasoning) + (speedScore * weights.speed) + (creativeScore * weights.creativity)
  }

  // Get the fallback chain for an agent's model
  getFallbackChain(agentName: string): string[] {
    const route = this.routeForAgent(agentName)
    return this.modelFallbacks.get(route.assignedModel) || []
  }
}
