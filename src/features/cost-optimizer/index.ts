import type { MetricsCollector } from '../metrics/collector.js';

export interface ModelCapability {
  reasoning: number; // 0 to 100
  speed: number;     // 0 to 100
  creativity: number;// 0 to 100
  coding: number;    // 0 to 100
  documents: number; // 0 to 100
}

export interface ModelDefinition {
  id: string;
  name: string;
  capabilities: ModelCapability;
  contextSize: number; // in tokens
  costPerMillionInput: number; // in USD
  costPerMillionOutput: number; // in USD
  isFree?: boolean;
}

export interface OptimizationResult {
  modelId: string;
  reason: string;
  expectedCostPerMillion: number;
}

export const DEFAULT_MODELS: ModelDefinition[] = [
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    name: 'Nemotron',
    capabilities: { reasoning: 95, speed: 60, creativity: 80, coding: 85, documents: 80 },
    contextSize: 128000,
    costPerMillionInput: 15.0,
    costPerMillionOutput: 15.0,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek',
    capabilities: { reasoning: 85, speed: 95, creativity: 75, coding: 90, documents: 75 },
    contextSize: 64000,
    costPerMillionInput: 2.0,
    costPerMillionOutput: 2.0,
  },
  {
    id: 'minimax/minimax-text-01',
    name: 'MiniMax',
    capabilities: { reasoning: 80, speed: 70, creativity: 85, coding: 70, documents: 95 },
    contextSize: 200000,
    costPerMillionInput: 4.0,
    costPerMillionOutput: 4.0,
  },
  {
    id: 'big-pickle/big-pickle-free',
    name: 'big-pickle',
    capabilities: { reasoning: 40, speed: 50, creativity: 50, coding: 30, documents: 50 },
    contextSize: 8000,
    costPerMillionInput: 0.0,
    costPerMillionOutput: 0.0,
    isFree: true,
  },
];

const WEIGHTS: Record<string, Record<string, number>> = {
  reasoning: { reasoning: 1.0, speed: 0.1, creativity: 0.2, coding: 0.2, documents: 0.2 },
  speed:     { reasoning: 0.1, speed: 1.0, creativity: 0.2, coding: 0.2, documents: 0.1 },
  docs:      { reasoning: 0.3, speed: 0.2, creativity: 0.2, coding: 0.1, documents: 1.0 },
  coding:    { reasoning: 0.4, speed: 0.3, creativity: 0.2, coding: 1.0, documents: 0.1 },
  creative:  { reasoning: 0.2, speed: 0.2, creativity: 1.0, coding: 0.1, documents: 0.2 },
  default:   { reasoning: 0.5, speed: 0.5, creativity: 0.5, coding: 0.5, documents: 0.5 },
};

export class CostOptimizer {
  private models: ModelDefinition[];
  private metricsCollector: MetricsCollector | null;
  private disabledModels: Set<string>;

  constructor(metricsCollector?: MetricsCollector | null, options?: { models?: ModelDefinition[] }) {
    this.metricsCollector = metricsCollector ?? null;
    this.models = options?.models ?? DEFAULT_MODELS;
    this.disabledModels = new Set<string>();
  }

  disableModel(id: string): void {
    this.disabledModels.add(id);
  }

  enableModel(id: string): void {
    this.disabledModels.delete(id);
  }

  optimize(
    taskCategory: string,
    options?: { minReasoning?: number; contextTokens?: number; sessionId?: string },
  ): OptimizationResult {
    const category = taskCategory.toLowerCase();
    const contextTokens = options?.contextTokens ?? 0;
    const minReasoning = options?.minReasoning ?? 0;

    // 1. Check budget via MetricsCollector
    let budgetExceeded = false;
    let budgetNearExhausted = false;

    if (this.metricsCollector) {
      const summary = this.metricsCollector.getCostSummary();
      const budget = this.metricsCollector.getDailyBudget();
      budgetExceeded = summary.budgetExceeded;
      budgetNearExhausted = summary.budgetRemaining < budget * 0.2;
    }

    // 2. Filter available, enabled, and context/reasoning satisfying models
    let candidates = this.models.filter(m => !this.disabledModels.has(m.id));

    // If budget is completely exceeded, we restrict strictly to free models
    if (budgetExceeded) {
      candidates = candidates.filter(m => m.isFree || m.costPerMillionInput === 0);
    } else if (budgetNearExhausted) {
      // If budget is near-exhausted, restrict to models costing <= $2.0 per million tokens
      candidates = candidates.filter(m => m.costPerMillionInput <= 2.0);
    }

    // Filter by context size constraint
    if (contextTokens > 0) {
      candidates = candidates.filter(m => m.contextSize >= contextTokens);
    }

    // Filter by minimum reasoning requirement
    if (minReasoning > 0) {
      candidates = candidates.filter(m => m.capabilities.reasoning >= minReasoning);
    }

    // If no candidates are available, fallback to the absolute cheapest/free enabled model
    if (candidates.length === 0) {
      const remainingEnabled = this.models.filter(m => !this.disabledModels.has(m.id));
      if (remainingEnabled.length > 0) {
        // Sort by input cost ascending
        remainingEnabled.sort((a, b) => a.costPerMillionInput - b.costPerMillionInput);
        const fallback = remainingEnabled[0];
        return {
          modelId: fallback.id,
          reason: `Budget/constraints exceeded and no matching models found. Routed to cheapest fallback: ${fallback.name}.`,
          expectedCostPerMillion: fallback.costPerMillionInput,
        };
      }
      // If all models are disabled, route to the absolute cheapest model from all models
      const sortedAll = [...this.models].sort((a, b) => a.costPerMillionInput - b.costPerMillionInput);
      const absoluteFallback = sortedAll[0];
      return {
        modelId: absoluteFallback.id,
        reason: `All models disabled. Routed to absolute cheapest fallback: ${absoluteFallback.name}.`,
        expectedCostPerMillion: absoluteFallback.costPerMillionInput,
      };
    }

    // 3. Dynamic capability scoring based on task category weights
    const w = WEIGHTS[category] || WEIGHTS['default'];
    
    let bestModel = candidates[0];
    let bestScore = -1;

    for (const model of candidates) {
      let score = 0;
      score += model.capabilities.reasoning * (w.reasoning ?? 0.2);
      score += model.capabilities.speed * (w.speed ?? 0.2);
      score += model.capabilities.creativity * (w.creativity ?? 0.2);
      score += model.capabilities.coding * (w.coding ?? 0.2);
      score += model.capabilities.documents * (w.documents ?? 0.2);

      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    let budgetReason = '';
    if (budgetExceeded) {
      budgetReason = ' [Budget Exceeded - Forced Free Tier]';
    } else if (budgetNearExhausted) {
      budgetReason = ' [Budget Low - Restricted to Cost-Efficient Tier]';
    }

    return {
      modelId: bestModel.id,
      reason: `Selected ${bestModel.name} for task '${taskCategory}' based on dynamic capability score ${bestScore.toFixed(1)}/100.${budgetReason}`,
      expectedCostPerMillion: bestModel.costPerMillionInput,
    };
  }
}

export function createCostOptimizer(
  metricsCollector?: MetricsCollector | null,
  options?: { models?: ModelDefinition[] },
): CostOptimizer {
  return new CostOptimizer(metricsCollector, options);
}
