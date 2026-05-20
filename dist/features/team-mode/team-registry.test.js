import { expect, describe, it } from 'bun:test';
import { TeamRegistry } from './team-registry';
describe('TeamRegistry', () => {
    it('registers a new team', () => {
        const registry = new TeamRegistry();
        const team = {
            id: 'team-1',
            name: 'Alpha',
            description: 'First team',
            members: [],
            createdAt: 1000,
        };
        registry.registerTeam(team);
        expect(registry.listTeams()).toHaveLength(1);
    });
    it('gets an existing team by id', () => {
        const registry = new TeamRegistry();
        const team = {
            id: 'team-1',
            name: 'Alpha',
            description: 'First team',
            members: [{ agentName: 'bot1', role: 'worker' }],
            createdAt: 1000,
        };
        registry.registerTeam(team);
        const got = registry.getTeam('team-1');
        expect(got).toBeDefined();
        expect(got.name).toBe('Alpha');
        expect(got.members).toHaveLength(1);
    });
    it('returns undefined for a nonexistent team', () => {
        const registry = new TeamRegistry();
        expect(registry.getTeam('nope')).toBeUndefined();
    });
    it('lists all teams', () => {
        const registry = new TeamRegistry();
        registry.registerTeam({ id: 'a', name: 'A', description: '', members: [], createdAt: 1 });
        registry.registerTeam({ id: 'b', name: 'B', description: '', members: [], createdAt: 2 });
        expect(registry.listTeams()).toHaveLength(2);
    });
    it('adds a member to a team', () => {
        const registry = new TeamRegistry();
        registry.registerTeam({ id: 't1', name: 'T1', description: '', members: [], createdAt: 0 });
        registry.addMember('t1', { agentName: 'alice', role: 'lead' });
        const team = registry.getTeam('t1');
        expect(team.members).toHaveLength(1);
        expect(team.members[0].agentName).toBe('alice');
    });
    it('throws when adding a duplicate member', () => {
        const registry = new TeamRegistry();
        registry.registerTeam({ id: 't1', name: 'T1', description: '', members: [], createdAt: 0 });
        registry.addMember('t1', { agentName: 'alice', role: 'lead' });
        expect(() => registry.addMember('t1', { agentName: 'alice', role: 'dev' })).toThrow();
    });
    it('removes a member from a team', () => {
        const registry = new TeamRegistry();
        registry.registerTeam({ id: 't1', name: 'T1', description: '', members: [{ agentName: 'bob', role: 'dev' }], createdAt: 0 });
        registry.removeMember('t1', 'bob');
        expect(registry.getTeam('t1').members).toHaveLength(0);
    });
    it('throws when removing a nonexistent member', () => {
        const registry = new TeamRegistry();
        registry.registerTeam({ id: 't1', name: 'T1', description: '', members: [], createdAt: 0 });
        expect(() => registry.removeMember('t1', 'nobody')).toThrow();
    });
});
//# sourceMappingURL=team-registry.test.js.map