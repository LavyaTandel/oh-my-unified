export interface UserSession {
    userId: string;
    sessionId: string;
    agentOrgId: string;
    role: 'owner' | 'collaborator' | 'viewer';
    joinedAt: number;
    lastActiveAt: number;
}
export interface AgentOrg {
    id: string;
    name: string;
    members: string[];
    sharedState: Map<string, unknown>;
    createdAt: number;
}
export interface SessionRouterStats {
    totalUsers: number;
    totalOrgs: number;
    activeSessions: number;
    usersPerOrg: Record<string, number>;
}
export declare class SessionRouter {
    private userSessions;
    private agentOrgs;
    createUserSession(userId: string, sessionId: string, agentOrgId: string, role?: UserSession['role']): UserSession;
    getUserSession(sessionId: string): UserSession | undefined;
    createAgentOrg(id: string, name: string, ownerUserId: string): AgentOrg;
    getAgentOrg(orgId: string): AgentOrg | undefined;
    setSharedState(orgId: string, key: string, value: unknown): boolean;
    getSharedState(orgId: string, key: string): unknown;
    getAllSharedState(orgId: string): Map<string, unknown>;
    removeUserSession(sessionId: string): boolean;
    updateLastActive(sessionId: string): void;
    getOrgSessions(orgId: string): UserSession[];
    getStats(): SessionRouterStats;
    clear(): void;
}
export declare function createSessionRouter(): SessionRouter;
//# sourceMappingURL=index.d.ts.map