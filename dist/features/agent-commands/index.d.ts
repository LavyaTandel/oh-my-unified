export interface AgentConfig {
    name: string;
    displayName: string;
    primaryName?: string;
    description: string;
    role: string;
    model: string;
    fallbackModels: string[];
    template: string;
    isPrimary: boolean;
    canDelegate: boolean;
    delegatableAgents?: string[];
    skills: string[];
}
export declare const AGENTS: AgentConfig[];
export declare const PRIMARY_AGENTS: AgentConfig[];
export declare const SUB_AGENTS: AgentConfig[];
export declare function getAgent(nameOrMention: string): AgentConfig | undefined;
//# sourceMappingURL=index.d.ts.map