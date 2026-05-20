import type { ModelInfo, ModelRoute } from './types';
export declare class ModelRouter {
    private availableModels;
    private modelFallbacks;
    registerModels(models: ModelInfo[]): void;
    registerFallback(modelId: string, fallbacks: string[]): void;
    routeForAgent(agentName: string): ModelRoute;
    private calculateMatchScore;
    getFallbackChain(agentName: string): string[];
}
//# sourceMappingURL=router.d.ts.map