export interface TeamMember {
    agentName: string;
    role: string;
    model?: string;
}
export interface Team {
    id: string;
    name: string;
    description: string;
    members: TeamMember[];
    createdAt: number;
}
export interface TeamTask {
    id: string;
    teamId: string;
    title: string;
    description: string;
    assignedTo?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    dependsOn: string[];
    createdAt: number;
}
//# sourceMappingURL=types.d.ts.map