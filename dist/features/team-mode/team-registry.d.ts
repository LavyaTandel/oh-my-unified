import type { Team, TeamMember } from './types';
export declare class TeamRegistry {
    private teams;
    registerTeam(team: Team): void;
    getTeam(id: string): Team | undefined;
    listTeams(): Team[];
    addMember(teamId: string, member: TeamMember): void;
    removeMember(teamId: string, agentName: string): void;
}
//# sourceMappingURL=team-registry.d.ts.map