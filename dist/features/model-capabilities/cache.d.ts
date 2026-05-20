/**
 * Capabilities that a model may support.
 */
export interface ModelCapabilities {
    /** Supports vision/image input */
    vision: boolean;
    /** Supports thinking/reasoning mode */
    thinking: boolean;
    /** Supports extended context window (>128K tokens) */
    longContext: boolean;
    /** Supports function calling / tool use */
    toolUse: boolean;
    /** Supports structured output / JSON mode */
    structuredOutput: boolean;
    /** Max output tokens the model supports */
    maxOutputTokens: number;
    /** Context window size in tokens */
    contextWindow: number;
    /** Model family for routing decisions */
    family: string;
    /** Whether the model is a reasoning model (o1, o3, etc.) */
    reasoning: boolean;
}
/**
 * Model capabilities cache — tracks which models support which features
 * for intelligent routing decisions.
 *
 * Combines static defaults with runtime discovery (capabilities learned
 * from actual model responses).
 */
export declare class ModelCapabilitiesCache {
    private cache;
    private discovered;
    constructor();
    /** Get capabilities for a model ID (e.g., "anthropic/claude-sonnet-4-20250514") */
    get(modelId: string): ModelCapabilities;
    /** Update capabilities for a model (runtime discovery) */
    update(modelId: string, capabilities: Partial<ModelCapabilities>): void;
    /** Find models that support a specific capability */
    findByCapability<K extends keyof ModelCapabilities>(capability: K, value: ModelCapabilities[K]): string[];
    /** Get all discovered (runtime-learned) model IDs */
    getDiscoveredModels(): string[];
    /** Export the full cache as JSON for persistence */
    toJSON(): Record<string, ModelCapabilities>;
    /** Import capabilities from JSON */
    fromJSON(data: Record<string, ModelCapabilities>): void;
}
/**
 * Find the best model for a given task based on capabilities.
 */
export declare function selectModelForTask(cache: ModelCapabilitiesCache, availableModels: string[], requirements: Partial<ModelCapabilities>): string | null;
//# sourceMappingURL=cache.d.ts.map