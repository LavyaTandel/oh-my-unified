import { log } from '../../utils/logger';
export class SessionRouter {
    userSessions = new Map();
    agentOrgs = new Map();
    createUserSession(userId, sessionId, agentOrgId, role = 'collaborator') {
        const session = {
            userId,
            sessionId,
            agentOrgId,
            role,
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
        };
        this.userSessions.set(sessionId, session);
        // Add user to org if not already member
        const org = this.agentOrgs.get(agentOrgId);
        if (org && !org.members.includes(userId)) {
            org.members.push(userId);
        }
        log('[session-router] user session created', {
            userId,
            sessionId,
            agentOrgId,
            role,
        });
        return session;
    }
    getUserSession(sessionId) {
        return this.userSessions.get(sessionId);
    }
    createAgentOrg(id, name, ownerUserId) {
        const org = {
            id,
            name,
            members: [ownerUserId],
            sharedState: new Map(),
            createdAt: Date.now(),
        };
        this.agentOrgs.set(id, org);
        log('[session-router] agent org created', { id, name, owner: ownerUserId });
        return org;
    }
    getAgentOrg(orgId) {
        return this.agentOrgs.get(orgId);
    }
    setSharedState(orgId, key, value) {
        const org = this.agentOrgs.get(orgId);
        if (!org)
            return false;
        org.sharedState.set(key, value);
        return true;
    }
    getSharedState(orgId, key) {
        const org = this.agentOrgs.get(orgId);
        if (!org)
            return undefined;
        return org.sharedState.get(key);
    }
    getAllSharedState(orgId) {
        const org = this.agentOrgs.get(orgId);
        return org?.sharedState ?? new Map();
    }
    removeUserSession(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (!session)
            return false;
        this.userSessions.delete(sessionId);
        log('[session-router] user session removed', {
            userId: session.userId,
            sessionId,
        });
        return true;
    }
    updateLastActive(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (session) {
            session.lastActiveAt = Date.now();
        }
    }
    getOrgSessions(orgId) {
        return Array.from(this.userSessions.values()).filter(s => s.agentOrgId === orgId);
    }
    getStats() {
        const usersPerOrg = {};
        for (const [orgId, org] of this.agentOrgs) {
            usersPerOrg[orgId] = org.members.length;
        }
        return {
            totalUsers: this.userSessions.size,
            totalOrgs: this.agentOrgs.size,
            activeSessions: Array.from(this.userSessions.values()).filter(s => Date.now() - s.lastActiveAt < 5 * 60 * 1000 // 5 min
            ).length,
            usersPerOrg,
        };
    }
    clear() {
        this.userSessions.clear();
        this.agentOrgs.clear();
    }
}
export function createSessionRouter() {
    return new SessionRouter();
}
//# sourceMappingURL=index.js.map