import React from 'react';
import type { TuiAgent } from '../state';
interface AgentListProps {
    agents: TuiAgent[];
    activeAgent?: string;
    onSelect?: (name: string) => void;
}
export declare const AgentList: React.FC<AgentListProps>;
export {};
//# sourceMappingURL=agent-list.d.ts.map