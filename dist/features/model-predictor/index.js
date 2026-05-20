export class ModelPredictor {
    performanceData = new Map();
    recordOutcome(model, taskCategory, success, latency) {
        const key = `${model}:${taskCategory}`;
        const existing = this.performanceData.get(key) ?? {
            model,
            taskCategory,
            successCount: 0,
            failureCount: 0,
            totalAttempts: 0,
            successRate: 0,
        };
        if (success) {
            existing.successCount++;
        }
        else {
            existing.failureCount++;
        }
        existing.totalAttempts++;
        existing.successRate = existing.successCount / existing.totalAttempts;
        existing.lastUsedAt = Date.now();
        if (latency !== undefined) {
            existing.avgLatency = existing.avgLatency
                ? (existing.avgLatency + latency) / 2
                : latency;
        }
        this.performanceData.set(key, existing);
    }
    predictBestModel(taskCategory, availableModels) {
        const modelPerformances = availableModels
            .map(model => this.performanceData.get(`${model}:${taskCategory}`))
            .filter((p) => p !== undefined && p.totalAttempts >= 2);
        if (modelPerformances.length === 0) {
            return {
                recommendedModel: availableModels[0] ?? 'unknown',
                confidence: 0.5,
                alternatives: availableModels.slice(1).map(m => ({ model: m, confidence: 0.5 })),
                reasoning: 'No historical data, using default model',
            };
        }
        const sorted = modelPerformances.sort((a, b) => b.successRate - a.successRate);
        const best = sorted[0];
        const alternatives = sorted.slice(1, 4).map(p => ({
            model: p.model,
            confidence: p.successRate,
        }));
        const reasoning = `${best.model} has ${best.successRate.toFixed(2)} success rate across ${best.totalAttempts} attempts in ${taskCategory}`;
        return {
            recommendedModel: best.model,
            confidence: best.successRate,
            alternatives,
            reasoning,
        };
    }
    getModelPerformance(model, taskCategory) {
        if (taskCategory) {
            return this.performanceData.get(`${model}:${taskCategory}`);
        }
        // Aggregate across all categories
        let totalSuccess = 0;
        let totalFailure = 0;
        let totalAttempts = 0;
        for (const [key, perf] of this.performanceData) {
            if (key.startsWith(`${model}:`)) {
                totalSuccess += perf.successCount;
                totalFailure += perf.failureCount;
                totalAttempts += perf.totalAttempts;
            }
        }
        if (totalAttempts === 0)
            return undefined;
        return {
            model,
            taskCategory: 'all',
            successCount: totalSuccess,
            failureCount: totalFailure,
            totalAttempts,
            successRate: totalSuccess / totalAttempts,
        };
    }
    getAllPerformances() {
        return Array.from(this.performanceData.values());
    }
    getSummary() {
        const performances = this.getAllPerformances();
        const totalAttempts = performances.reduce((sum, p) => sum + p.totalAttempts, 0);
        const avgSuccessRate = performances.length > 0
            ? performances.reduce((sum, p) => sum + p.successRate, 0) / performances.length
            : 0;
        const topPerformers = performances
            .filter(p => p.totalAttempts >= 2)
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5)
            .map(p => ({ model: p.model, taskCategory: p.taskCategory, successRate: p.successRate }));
        const uniqueModels = new Set(performances.map(p => p.model));
        return {
            totalModels: uniqueModels.size,
            totalAttempts,
            avgSuccessRate,
            topPerformers,
        };
    }
}
export function createModelPredictor() {
    return new ModelPredictor();
}
//# sourceMappingURL=index.js.map