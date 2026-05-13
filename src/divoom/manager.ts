import type { DivoomStatus, ConnectionState, DeviceInfo, DivoomConfig } from './types'

const DEFAULT_CONFIG: Required<Omit<DivoomConfig, 'host'>> = {
  reconnectDelayMs: 5000,
  maxReconnectAttempts: 3,
}

/**
 * DivoomManager simulates controlling a Divoom Pixoo-64 display.
 *
 * In v1 the class logs status changes to the console. A future version
 * will send real UDP commands to the physical device.
 */
export class DivoomManager {
  private _connectionState: ConnectionState = 'disconnected'
  private _deviceInfo: DeviceInfo | null = null
  private config: Required<Omit<DivoomConfig, 'host'>>
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config?: DivoomConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ── Connection ──────────────────────────────────────────────────

  /** Simulate connecting to the Divoom device. */
  async connect(): Promise<DeviceInfo> {
    if (this._connectionState === 'connected') {
      console.log('[Divoom] Already connected')
      return this._deviceInfo!
    }

    this._connectionState = 'connecting'
    console.log('[Divoom] Connecting…')

    // Simulate a short handshake delay
    await new Promise(resolve => setTimeout(resolve, 50))

    this._connectionState = 'connected'
    this.reconnectAttempts = 0
    this._deviceInfo = {
      model: 'Pixoo-64',
      firmware: '2.4.0',
      mac: 'AA:BB:CC:DD:EE:FF',
    }
    console.log('[Divoom] Connected —', this._deviceInfo.model)
    return this._deviceInfo
  }

  /** Disconnect from the Divoom device. */
  async disconnect(): Promise<void> {
    if (this._connectionState === 'disconnected') {
      console.log('[Divoom] Already disconnected')
      return
    }

    this._connectionState = 'disconnected'
    this._deviceInfo = null
    this.clearReconnectTimer()
    console.log('[Divoom] Disconnected')
  }

  // ── Status update ───────────────────────────────────────────────

  /** Send a status update to the display (simulated via console). */
  async updateStatus(status: DivoomStatus): Promise<void> {
    if (!this.isConnected()) {
      console.warn('[Divoom] Cannot update status — not connected')
      return
    }

    const bar = renderProgressBar(status.progress)
    const lines = [
      `[Divoom] ═══════ Display Update ═══════`,
      `  Agent  : ${status.agentName}`,
      `  Tasks  : ${status.taskCount}`,
      `  ${bar} ${status.progress}%`,
    ]
    if (status.message) lines.push(`  Msg    : ${status.message}`)
    lines.push(`  ───────────────────────────────`)

    console.log(lines.join('\n'))
  }

  // ── Queries ─────────────────────────────────────────────────────

  /** Whether the manager is currently connected to the device. */
  isConnected(): boolean {
    return this._connectionState === 'connected'
  }

  /** The current connection state. */
  get connectionState(): ConnectionState {
    return this._connectionState
  }

  /** Connected device info (null if not connected). */
  get deviceInfo(): DeviceInfo | null {
    return this._deviceInfo
  }

  // ── Reconnection ────────────────────────────────────────────────

  /** Attempt to reconnect after a disconnection. */
  async reconnect(): Promise<DeviceInfo> {
    if (this._connectionState === 'connected') {
      return this._deviceInfo!
    }

    this.reconnectAttempts++
    if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
      this._connectionState = 'error'
      throw new Error(
        `[Divoom] Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`,
      )
    }

    console.log(
      `[Divoom] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}…`,
    )
    return this.connect()
  }

  /** Schedule an automatic reconnection attempt. */
  scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return
    console.log(
      `[Divoom] Scheduling reconnect in ${this.config.reconnectDelayMs}ms…`,
    )
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      try {
        await this.reconnect()
      } catch (err) {
        console.error('[Divoom] Reconnect failed:', (err as Error).message)
      }
    }, this.config.reconnectDelayMs)
  }

  // ── Internal ────────────────────────────────────────────────────

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function renderProgressBar(progress: number, width = 10): string {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)))
  const filled = Math.round((clamped / 100) * width)
  const empty = width - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
