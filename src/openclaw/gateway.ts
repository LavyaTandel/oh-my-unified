import type { OpenClawConfig, OutgoingMessage, IncomingMessage } from './types'

export class OpenClawGateway {
  private config: OpenClawConfig
  private listeners: Array<(msg: IncomingMessage) => void> = []

  constructor(config: OpenClawConfig) { this.config = config }

  // Register a message listener
  onMessage(listener: (msg: IncomingMessage) => void): void { this.listeners.push(listener) }

  // Send a message to an external channel
  async send(msg: OutgoingMessage): Promise<boolean> {
    // In v1: just log the outgoing message (actual HTTP/WS calls come later)
    console.log(`[OpenClaw] Send to ${msg.channel}: ${msg.content}`)
    return true
  }

  // Start the gateway — set up listeners
  async start(): Promise<void> {
    if (this.config.discord) console.log('[OpenClaw] Discord gateway configured (token present)')
    if (this.config.telegram) console.log('[OpenClaw] Telegram gateway configured (token present)')
    if (this.config.http) console.log('[OpenClaw] HTTP gateway configured (port:', this.config.http.port, ')')
  }

  // Stop the gateway
  async stop(): Promise<void> { /* cleanup */ }

  // Check if gateway is active
  isActive(): boolean { return this.config.enabled }
}
