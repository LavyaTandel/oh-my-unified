import { describe, expect, test, vi, beforeEach, afterEach } from 'bun:test'
import { DivoomManager } from './manager'

describe('DivoomManager', () => {
  let manager: DivoomManager

  beforeEach(() => {
    manager = new DivoomManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Connect ─────────────────────────────────────────────────────

  test('connect returns device info and sets connected state', async () => {
    const info = await manager.connect()

    expect(info).toEqual({
      model: 'Pixoo-64',
      firmware: '2.4.0',
      mac: 'AA:BB:CC:DD:EE:FF',
    })
    expect(manager.isConnected()).toBe(true)
    expect(manager.connectionState).toBe('connected')
  })

  test('connect is idempotent when already connected', async () => {
    await manager.connect()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const info = await manager.connect()
    expect(info.model).toBe('Pixoo-64')
    expect(logSpy).toHaveBeenCalledWith('[Divoom] Already connected')

    logSpy.mockRestore()
  })

  // ── Disconnect ──────────────────────────────────────────────────

  test('disconnect transitions to disconnected state', async () => {
    await manager.connect()
    expect(manager.isConnected()).toBe(true)

    await manager.disconnect()
    expect(manager.isConnected()).toBe(false)
    expect(manager.connectionState).toBe('disconnected')
    expect(manager.deviceInfo).toBeNull()
  })

  test('disconnect is safe when already disconnected', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await manager.disconnect()
    expect(logSpy).toHaveBeenCalledWith('[Divoom] Already disconnected')

    logSpy.mockRestore()
  })

  // ── updateStatus with agent names ───────────────────────────────

  test('updateStatus logs agent name and progress bar', async () => {
    await manager.connect()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'mimir',
      taskCount: 3,
      progress: 40,
    })

    const firstCall = logSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const output = firstCall[0] as string
    expect(output).toContain('mimir')
    expect(output).toContain('40%')
    expect(output).toContain('████░░░░░░')

    logSpy.mockRestore()
  })

  // ── updateStatus with task count ────────────────────────────────

  test('updateStatus displays task count', async () => {
    await manager.connect()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'eir',
      taskCount: 7,
      progress: 50,
    })

    const firstCall = logSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const output = firstCall[0] as string
    expect(output).toContain('eir')
    expect(output).toContain('Tasks')
    expect(output).toContain('█████░░░░░')

    logSpy.mockRestore()
  })

  // ── updateStatus with custom message ────────────────────────────

  test('updateStatus displays custom message', async () => {
    await manager.connect()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'thor',
      taskCount: 1,
      progress: 100,
      message: 'Build complete',
    })

    const firstCall = logSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const output = firstCall[0] as string
    expect(output).toContain('thor')
    expect(output).toContain('██████████')
    expect(output).toContain('Build complete')

    logSpy.mockRestore()
  })

  // ── updateStatus when disconnected ──────────────────────────────

  test('updateStatus does not print when disconnected', async () => {
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'sif',
      taskCount: 2,
      progress: 20,
    })

    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
