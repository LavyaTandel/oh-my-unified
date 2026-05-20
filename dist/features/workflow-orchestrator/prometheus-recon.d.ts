import type { KnowledgeArea } from './types';
export interface ReconTask {
    target: string;
    tool: 'mcp' | 'subagent' | 'skill' | 'user-question';
    /** Generic purpose — McpSkillCatalog resolves to actual MCP at runtime */
    purpose?: string;
    subagentName?: string;
    skillName?: string;
    question?: string;
    priority: 'high' | 'medium' | 'low';
}
export declare function getPhaseExecutionPlan(phase: string): {
    description: string;
    parallel?: Array<{
        tool: string;
        purpose?: string;
        target?: string;
        action: string;
    }>;
    sequential?: Array<{
        tool: string;
        purpose?: string;
        target?: string;
        action: string;
    }>;
    conditionalDelegation?: Array<{
        if: string;
        then: string;
    }>;
    confidenceGate?: number;
    userSatisfactionGate?: boolean;
};
export declare class PrometheusRecon {
    private tasks;
    private gatheredKnowledge;
    planRecon(knownAreas: KnowledgeArea[], _projectHint?: string): ReconTask[];
    /**
     * Generate targeted questions for the user when knowledge gaps remain.
     * @param gathered  - knowledge gathered so far (area → info[])
     * @param knownAreas - area names the system is confident about
     * @returns an array of question strings to ask the user
     */
    generateQuestions(gathered: Map<string, string[]>, knownAreas: string[]): string[];
    executeRecon(tasks: ReconTask[]): Promise<Map<string, string[]>>;
    private needsMoreInfo;
    private addTask;
}
//# sourceMappingURL=prometheus-recon.d.ts.map