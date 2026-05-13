import type { Team, TeamMember } from './types'

export class TeamRegistry {
  private teams: Map<string, Team> = new Map()

  registerTeam(team: Team): void {
    if (this.teams.has(team.id)) {
      throw new Error(`Team with id "${team.id}" already exists`)
    }
    this.teams.set(team.id, { ...team, members: [...team.members] })
  }

  getTeam(id: string): Team | undefined {
    const team = this.teams.get(id)
    if (!team) return undefined
    return { ...team, members: [...team.members] }
  }

  listTeams(): Team[] {
    return Array.from(this.teams.values()).map(t => ({
      ...t,
      members: [...t.members],
    }))
  }

  addMember(teamId: string, member: TeamMember): void {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team with id "${teamId}" not found`)
    }
    if (team.members.some(m => m.agentName === member.agentName)) {
      throw new Error(`Member "${member.agentName}" already exists in team "${teamId}"`)
    }
    team.members.push({ ...member })
  }

  removeMember(teamId: string, agentName: string): void {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team with id "${teamId}" not found`)
    }
    const idx = team.members.findIndex(m => m.agentName === agentName)
    if (idx === -1) {
      throw new Error(`Member "${agentName}" not found in team "${teamId}"`)
    }
    team.members.splice(idx, 1)
  }
}
