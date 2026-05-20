export interface ModelPerformance {
    model: string;
    taskCategory: string;
    successCount: number;
    failureCount: number;
    totalAttempts: number;
    successRate: number;
    avgLatency?: number;
    lastUsedAt?: number;
}
export interface ModelPrediction {
    recommendedModel: string;
    confidence: number;
    alternatives: Array<{
        model: string;
        confidence: number;
    }>;
    reasoning: string;
}
export declare class ModelPredictor {
    private performanceData;
    recordOutcome(model: string, taskCategory: string, success: boolean, latency?: number): void;
    predictBestModel(taskCategory: string, availableModels: string[]): ModelPrediction;
    getModelPerformance(model: string, taskCategory?: string): ModelPerformance | undefined;
    getAllPerformances(): ModelPerformance[];
    getSummary(): {
        totalModels: number;
        totalAttempts: number;
        avgSuccessRate: number;
        topPerformers: Array<{
            model: string;
            taskCategory: string;
            successRate: number;
        }>;
    };
}
export declare function createModelPredictor(): ModelPredictor;
//# sourceMappingURL=index.d.ts.map