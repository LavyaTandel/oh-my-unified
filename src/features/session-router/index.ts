import { log } from '../../utils/logger';

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
  members: string[]; // userIds
  sharedState: Map<string, unknown>;
  createdAt: number;
}

export interface SessionRouterStats {
  totalUsers: number;
  totalOrgs: number;
  activeSessions: number;
  usersPerOrg: Record<string, number>;
}

export class SessionRouter {
  private userSessions: Map<string, UserSession> = new Map();
  private agentOrgs: Map<string, AgentOrg> = new Map();

  createUserSession(userId: string, sessionId: string, agentOrgId: string, role: UserSession['role'] = 'collaborator'): UserSession {
    const session: UserSession = {
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

  getUserSession(sessionId: string): UserSession | undefined {
    return this.userSessions.get(sessionId);
  }

  createAgentOrg(id: string, name: string, ownerUserId: string): AgentOrg {
    const org: AgentOrg = {
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

  getAgentOrg(orgId: string): AgentOrg | undefined {
    return this.agentOrgs.get(orgId);
  }

  setSharedState(orgId: string, key: string, value: unknown): boolean {
    const org = this.agentOrgs.get(orgId);
    if (!org) return false;

    org.sharedState.set(key, value);
    return true;
  }

  getSharedState(orgId: string, key: string): unknown {
    const org = this.agentOrgs.get(orgId);
    if (!org) return undefined;
    return org.sharedState.get(key);
  }

  getAllSharedState(orgId: string): Map<string, unknown> {
    const org = this.agentOrgs.get(orgId);
    return org?.sharedState ?? new Map();
  }

  removeUserSession(sessionId: string): boolean {
    const session = this.userSessions.get(sessionId);
    if (!session) return false;

    this.userSessions.delete(sessionId);

    log('[session-router] user session removed', {
      userId: session.userId,
      sessionId,
    });

    return true;
  }

  updateLastActive(sessionId: string): void {
    const session = this.userSessions.get(sessionId);
    if (session) {
      session.lastActiveAt = Date.now();
    }
  }

  getOrgSessions(orgId: string): UserSession[] {
    return Array.from(this.userSessions.values()).filter(s => s.agentOrgId === orgId);
  }

  getStats(): SessionRouterStats {
    const usersPerOrg: Record<string, number> = {};
    for (const [orgId, org] of this.agentOrgs) {
      usersPerOrg[orgId] = org.members.length;
    }

    return {
      totalUsers: this.userSessions.size,
      totalOrgs: this.agentOrgs.size,
      activeSessions: Array.from(this.userSessions.values()).filter(
        s => Date.now() - s.lastActiveAt < 5 * 60 * 1000 // 5 min
      ).length,
      usersPerOrg,
    };
  }

  clear(): void {
    this.userSessions.clear();
    this.agentOrgs.clear();
  }
}

export function createSessionRouter(): SessionRouter {
  return new SessionRouter();
}
