export interface Capability {
    category: string;
    icon: string;
    name: string;
    command: string;
    description: string;
    example: string;
}
export interface CapabilityContext {
    agentCount: number;
    mcpCount: number;
    pluginCount: number;
    integrationCount: number;
    hasLearningEngine: boolean;
    hasModelPredictor: boolean;
    hasBenchmarkTracker: boolean;
    hasCircuitBreakers: boolean;
}
export declare class CapabilitiesExplorer {
    private ctx;
    constructor(ctx: CapabilityContext);
    getCapabilities(): Capability[];
    getTier2Capabilities(): Capability[];
    getTier3Capabilities(): Capability[];
    formatCapabilities(): string;
}
export declare function createCapabilitiesExplorer(ctx: CapabilityContext): CapabilitiesExplorer;
//# sourceMappingURL=index.d.ts.map