import { describe, expect, test, vi, beforeEach } from 'bun:test'
import { DivoomManager } from './manager'

describe('DivoomManager', () => {
  let manager: DivoomManager

  beforeEach(() => {
    manager = new DivoomManager()
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
      agentName: 'oracle',
      taskCount: 3,
      progress: 40,
    })

    const output = logSpy.mock.calls[0][0]
    expect(output).toContain('oracle')
    expect(output).toContain('40%')
    expect(output).toContain('████░░░░░░')

    logSpy.mockRestore()
  })

  // ── updateStatus with task count ────────────────────────────────

  test('updateStatus displays task count', async () => {
    await manager.connect()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'librarian',
      taskCount: 7,
      progress: 100,
    })

    const output = logSpy.mock.calls[0][0]
    expect(output).toContain('librarian')
    expect(output).toContain('Tasks  : 7')
    expect(output).toContain('██████████')
    expect(output).toContain('100%')

    logSpy.mockRestore()
  })

  // ── isConnected true/false ──────────────────────────────────────

  test('isConnected returns false before connect', () => {
    expect(manager.isConnected()).toBe(false)
  })

  test('isConnected returns true after connect', async () => {
    await manager.connect()
    expect(manager.isConnected()).toBe(true)

    await manager.disconnect()
    expect(manager.isConnected()).toBe(false)
  })

  // ── Reconnect ───────────────────────────────────────────────────

  test('reconnect succeeds within max attempts', async () => {
    // Force disconnect first
    await manager.connect()
    await manager.disconnect()

    const info = await manager.reconnect()
    expect(info.model).toBe('Pixoo-64')
    expect(manager.isConnected()).toBe(true)
  })

  test('reconnect throws when max attempts exceeded', async () => {
    // Create a manager with 0 max attempts so the first reconnect fails
    const limited = new DivoomManager({ maxReconnectAttempts: 0 })

    await expect(limited.reconnect()).rejects.toThrow(
      'Max reconnection attempts',
    )
    expect(limited.connectionState).toBe('error')
  })

  // ── Handle errors ───────────────────────────────────────────────

  test('updateStatus warns when not connected', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await manager.updateStatus({
      agentName: 'test',
      taskCount: 0,
      progress: 0,
    })

    expect(warnSpy).toHaveBeenCalledWith(
      '[Divoom] Cannot update status — not connected',
    )

    warnSpy.mockRestore()
  })

  test('scheduleReconnect schedules a timer', async () => {
    vi.useFakeTimers()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mgr = new DivoomManager({ reconnectDelayMs: 100 })
    mgr.scheduleReconnect()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Scheduling reconnect'),
    )

    vi.useRealTimers()
    logSpy.mockRestore()
  })

  // ── Display flow: connect → update → disconnect ────────────────

  test('full display flow: connect → update → disconnect', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 1. Connect
    const info = await manager.connect()
    expect(info.model).toBe('Pixoo-64')
    expect(logSpy.mock.calls.some(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('Connected')),
    )).toBe(true)

    // 2. Update status repeatedly
    await manager.updateStatus({
      agentName: 'hephaestus',
      taskCount: 5,
      progress: 60,
      message: 'Building artifacts',
    })

    await manager.updateStatus({
      agentName: 'hephaestus',
      taskCount: 5,
      progress: 100,
    })

    // 3. Disconnect
    await manager.disconnect()
    expect(manager.isConnected()).toBe(false)
    expect(logSpy.mock.calls.some(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('Disconnected')),
    )).toBe(true)

    logSpy.mockRestore()
  })
})
