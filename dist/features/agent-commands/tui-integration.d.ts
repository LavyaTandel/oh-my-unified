import type { AgentConfig } from './index';
export interface TuiAgentEntry {
    id: string;
    label: string;
    description: string;
    status: 'idle' | 'active' | 'busy' | 'error';
    model: string;
}
export declare function buildTuiAgentList(agents: AgentConfig[]): TuiAgentEntry[];
//# sourceMappingURL=tui-integration.d.ts.map