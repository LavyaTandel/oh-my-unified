import { describe, test, expect, beforeEach } from 'bun:test';
import { SessionRouter, createSessionRouter } from './index';

describe('SessionRouter', () => {
  let router: SessionRouter;

  beforeEach(() => {
    router = createSessionRouter();
  });

  test('creates user session', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');

    const session = router.createUserSession('user1', 'session1', 'org1', 'owner');
    expect(session.userId).toBe('user1');
    expect(session.sessionId).toBe('session1');
    expect(session.agentOrgId).toBe('org1');
    expect(session.role).toBe('owner');
  });

  test('retrieves user session', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createUserSession('user1', 'session1', 'org1');

    const session = router.getUserSession('session1');
    expect(session).toBeDefined();
    expect(session?.userId).toBe('user1');
  });

  test('creates agent org', () => {
    const org = router.createAgentOrg('org1', 'Test Org', 'user1');
    expect(org.id).toBe('org1');
    expect(org.name).toBe('Test Org');
    expect(org.members).toContain('user1');
  });

  test('manages shared state', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');

    router.setSharedState('org1', 'key1', 'value1');
    expect(router.getSharedState('org1', 'key1')).toBe('value1');

    router.setSharedState('org1', 'key2', { nested: 'object' });
    expect(router.getSharedState('org1', 'key2')).toEqual({ nested: 'object' });
  });

  test('removes user session', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createUserSession('user1', 'session1', 'org1');

    const result = router.removeUserSession('session1');
    expect(result).toBe(true);
    expect(router.getUserSession('session1')).toBeUndefined();
  });

  test('updates last active timestamp', async () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createUserSession('user1', 'session1', 'org1');

    const before = router.getUserSession('session1')?.lastActiveAt;
    await new Promise(resolve => setTimeout(resolve, 10));
    router.updateLastActive('session1');
    const after = router.getUserSession('session1')?.lastActiveAt;

    expect(after).toBeGreaterThanOrEqual(before!);
  });

  test('gets org sessions', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createUserSession('user1', 'session1', 'org1');
    router.createUserSession('user2', 'session2', 'org1');

    const sessions = router.getOrgSessions('org1');
    expect(sessions.length).toBe(2);
  });

  test('generates stats', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createAgentOrg('org2', 'Test Org 2', 'user2');
    router.createUserSession('user1', 'session1', 'org1');
    router.createUserSession('user2', 'session2', 'org2');

    const stats = router.getStats();
    expect(stats.totalUsers).toBe(2);
    expect(stats.totalOrgs).toBe(2);
    expect(stats.usersPerOrg['org1']).toBe(1);
    expect(stats.usersPerOrg['org2']).toBe(1);
  });

  test('clears all data', () => {
    router.createAgentOrg('org1', 'Test Org', 'user1');
    router.createUserSession('user1', 'session1', 'org1');

    router.clear();
    const stats = router.getStats();
    expect(stats.totalUsers).toBe(0);
    expect(stats.totalOrgs).toBe(0);
  });
});
