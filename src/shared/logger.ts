const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = typeof LOG_LEVELS[number]

let currentLevel: LogLevel = 'info'

export function setLogLevel(level: LogLevel): void { currentLevel = level }

export function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(currentLevel)) return
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`
  if (data) {
    console.log(`${prefix} ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data)
  } else {
    console.log(`${prefix} ${message}`)
  }
}

export const logger = {
  debug: (m: string, msg: string, d?: unknown) => log('debug', m, msg, d),
  info: (m: string, msg: string, d?: unknown) => log('info', m, msg, d),
  warn: (m: string, msg: string, d?: unknown) => log('warn', m, msg, d),
  error: (m: string, msg: string, d?: unknown) => log('error', m, msg, d),
}
