export interface ModelPreset {
    name: string;
    description: string;
    tier: 'free' | 'cheap' | 'balanced' | 'premium';
    models: Record<string, string>;
}
export declare const PRESETS: Record<string, ModelPreset>;
export declare class PresetManager {
    private activePreset;
    listPresets(): string[];
    getPreset(name: string): ModelPreset | undefined;
    getActivePreset(): ModelPreset;
    setActivePreset(name: string): boolean;
    getModelForAgent(agentName: string): string | undefined;
}
//# sourceMappingURL=index.d.ts.map