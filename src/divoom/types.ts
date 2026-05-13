/**
 * Status update payload sent to the Divoom display.
 */
export interface DivoomStatus {
  /** Name of the currently active agent (e.g. "mimir", "eir") */
  agentName: string
  /** Number of active/pending tasks */
  taskCount: number
  /** Progress percentage 0–100 */
  progress: number
  /** Optional custom message to display */
  message?: string
}

/**
 * Connection state for the Divoom device.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Device information reported after a successful connection.
 */
export interface DeviceInfo {
  model: string
  firmware: string
  mac: string
}

/**
 * Configuration options for DivoomManager.
 */
export interface DivoomConfig {
  /** Device hostname or IP address */
  host?: string
  /** Reconnection delay in ms (default: 5000) */
  reconnectDelayMs?: number
  /** Maximum reconnection attempts (default: 3) */
  maxReconnectAttempts?: number
}
