import { expect, describe, it, afterEach } from 'bun:test'
import { TeamTaskList } from './task-list'
import type { TeamTask } from './types'
import { unlinkSync, existsSync } from 'fs'

describe('TeamTaskList', () => {
  let taskList: TeamTaskList

  afterEach(() => {
    taskList.close()
  })

  const sampleTask = (overrides: Partial<TeamTask> = {}): TeamTask => ({
    id: 'task-1',
    teamId: 'team-1',
    title: 'Do something',
    description: 'Do something important',
    assignedTo: undefined,
    status: 'pending',
    dependsOn: [],
    createdAt: Date.now(),
    ...overrides,
  })

  it('creates a task', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask())
    const tasks = taskList.getTasksByTeam('team-1')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Do something')
  })

  it('assigns a task to an agent', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask())
    taskList.assignTask('task-1', 'alice')
    const tasks = taskList.getTasksByAgent('alice')
    expect(tasks).toHaveLength(1)
  })

  it('throws when assigning a nonexistent task', () => {
    taskList = new TeamTaskList()
    expect(() => taskList.assignTask('no-such-task', 'alice')).toThrow()
  })

  it('updates task status', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask())
    taskList.updateStatus('task-1', 'in_progress')
    const tasks = taskList.getTasksByTeam('team-1')
    expect(tasks[0].status).toBe('in_progress')
  })

  it('throws when updating status of a nonexistent task', () => {
    taskList = new TeamTaskList()
    expect(() => taskList.updateStatus('no-such-task', 'completed')).toThrow()
  })

  it('gets tasks by team', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask({ id: 't1', teamId: 'team-a' }))
    taskList.createTask(sampleTask({ id: 't2', teamId: 'team-b' }))
    expect(taskList.getTasksByTeam('team-a')).toHaveLength(1)
    expect(taskList.getTasksByTeam('team-b')).toHaveLength(1)
  })

  it('gets tasks by agent', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask({ id: 't1', assignedTo: 'bob' }))
    taskList.createTask(sampleTask({ id: 't2', assignedTo: 'alice' }))
    expect(taskList.getTasksByAgent('bob')).toHaveLength(1)
    expect(taskList.getTasksByAgent('alice')).toHaveLength(1)
  })

  it('returns blocked tasks', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask({ id: 't1', status: 'blocked' }))
    taskList.createTask(sampleTask({ id: 't2', status: 'pending' }))
    const blocked = taskList.getBlockedTasks()
    expect(blocked).toHaveLength(1)
    expect(blocked[0].id).toBe('t1')
  })

  it('persists tasks across instances (SQLite file)', () => {
    const dbPath = '/tmp/test-team-tasks.sqlite'
    if (existsSync(dbPath)) unlinkSync(dbPath)

    const list1 = new TeamTaskList(dbPath)
    list1.createTask(sampleTask({ id: 'persist-1' }))
    list1.close()

    const list2 = new TeamTaskList(dbPath)
    const tasks = list2.getTasksByTeam('team-1')
    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe('persist-1')
    list2.close()

    if (existsSync(dbPath)) unlinkSync(dbPath)
  })

  it('works with in-memory database', () => {
    taskList = new TeamTaskList()
    taskList.createTask(sampleTask())
    expect(taskList.getTasksByTeam('team-1')).toHaveLength(1)
  })
})
