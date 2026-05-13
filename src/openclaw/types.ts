export interface OpenClawConfig {
  enabled: boolean
  discord?: { token: string; channelId?: string }
  telegram?: { token: string; chatId?: string }
  http?: { port: number }
}

export interface OutgoingMessage {
  channel: 'discord' | 'telegram' | 'http'
  content: string
  metadata?: Record<string, unknown>
}

export interface IncomingMessage {
  channel: 'discord' | 'telegram' | 'http'
  content: string
  sender?: string
  timestamp: number
}
