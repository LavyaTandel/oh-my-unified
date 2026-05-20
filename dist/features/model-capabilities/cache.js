import { log } from '../../utils/logger';
/**
 * Default capabilities for known model families.
 * Updated as new models are released.
 */
const DEFAULT_CAPABILITIES = {
    // Anthropic
    'claude-opus': { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 200000, family: 'anthropic', reasoning: false },
    'claude-sonnet': { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 200000, family: 'anthropic', reasoning: false },
    'claude-haiku': { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 4096, contextWindow: 200000, family: 'anthropic', reasoning: false },
    // OpenAI
    'gpt-4o': { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 128000, family: 'openai', reasoning: false },
    'gpt-4o-mini': { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 128000, family: 'openai', reasoning: false },
    'o1': { vision: false, thinking: true, longContext: true, toolUse: false, structuredOutput: false, maxOutputTokens: 100000, contextWindow: 200000, family: 'openai', reasoning: true },
    'o3': { vision: false, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 100000, contextWindow: 200000, family: 'openai', reasoning: true },
    // Google
    'gemini-2.5-pro': { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 65536, contextWindow: 1000000, family: 'google', reasoning: false },
    'gemini-2.5-flash': { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 65536, contextWindow: 1000000, family: 'google', reasoning: false },
    // DeepSeek
    'deepseek-v3': { vision: false, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: 'deepseek', reasoning: false },
    'deepseek-r1': { vision: false, thinking: true, longContext: true, toolUse: false, structuredOutput: false, maxOutputTokens: 8192, contextWindow: 128000, family: 'deepseek', reasoning: true },
    // Meta
    'llama-3': { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: 'meta', reasoning: false },
    // Minimax
    'minimax': { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 245760, family: 'minimax', reasoning: false },
    // Mistral
    'mistral': { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: 'mistral', reasoning: false },
};
const DEFAULT_MODEL = {
    vision: false,
    thinking: false,
    longContext: false,
    toolUse: true,
    structuredOutput: false,
    maxOutputTokens: 4096,
    contextWindow: 32000,
    family: 'unknown',
    reasoning: false,
};
/**
 * Model capabilities cache — tracks which models support which features
 * for intelligent routing decisions.
 *
 * Combines static defaults with runtime discovery (capabilities learned
 * from actual model responses).
 */
export class ModelCapabilitiesCache {
    cache = new Map();
    discovered = new Set();
    constructor() {
        // Pre-populate with known defaults
        for (const [key, caps] of Object.entries(DEFAULT_CAPABILITIES)) {
            this.cache.set(key, { ...DEFAULT_MODEL, ...caps });
        }
    }
    /** Get capabilities for a model ID (e.g., "anthropic/claude-sonnet-4-20250514") */
    get(modelId) {
        // Check exact match first
        const exact = this.cache.get(modelId);
        if (exact)
            return exact;
        // Try substring match against known model names
        for (const [key, caps] of this.cache) {
            if (modelId.toLowerCase().includes(key.toLowerCase())) {
                return caps;
            }
        }
        // Return defaults
        return { ...DEFAULT_MODEL };
    }
    /** Update capabilities for a model (runtime discovery) */
    update(modelId, capabilities) {
        const existing = this.cache.get(modelId) ?? { ...DEFAULT_MODEL };
        this.cache.set(modelId, { ...existing, ...capabilities });
        this.discovered.add(modelId);
        log('[model-capabilities] updated capabilities', {
            modelId,
            capabilities,
        });
    }
    /** Find models that support a specific capability */
    findByCapability(capability, value) {
        const results = [];
        for (const [modelId, caps] of this.cache) {
            if (caps[capability] === value) {
                results.push(modelId);
            }
        }
        return results;
    }
    /** Get all discovered (runtime-learned) model IDs */
    getDiscoveredModels() {
        return [...this.discovered];
    }
    /** Export the full cache as JSON for persistence */
    toJSON() {
        const result = {};
        for (const [key, caps] of this.cache) {
            result[key] = caps;
        }
        return result;
    }
    /** Import capabilities from JSON */
    fromJSON(data) {
        for (const [key, caps] of Object.entries(data)) {
            this.cache.set(key, caps);
        }
    }
}
/**
 * Find the best model for a given task based on capabilities.
 */
export function selectModelForTask(cache, availableModels, requirements) {
    let best = null;
    let bestScore = -1;
    for (const modelId of availableModels) {
        const caps = cache.get(modelId);
        let score = 0;
        let disqualified = false;
        for (const [key, value] of Object.entries(requirements)) {
            const capKey = key;
            if (caps[capKey] !== value) {
                disqualified = true;
                break;
            }
            score++;
        }
        if (!disqualified && score > bestScore) {
            bestScore = score;
            best = modelId;
        }
    }
    return best;
}
//# sourceMappingURL=cache.js.map