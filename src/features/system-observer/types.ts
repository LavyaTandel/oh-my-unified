export interface ComponentHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: number
  lastError?: string
  details?: Record<string, unknown>
}

export interface SystemReport {
  timestamp: number
  overall: 'healthy' | 'degraded' | 'critical'
  components: ComponentHealth[]
  runningTasks: number
  connectedMcps: number
  agentActivity: Record<string, { lastActive: number; tasksCompleted: number }>
  warnings: string[]
  errors: string[]
}

export interface SystemObserverEvents {
  onStatusChange?: (component: string, from: ComponentHealth['status'], to: ComponentHealth['status']) => void
  onWarning?: (component: string, message: string) => void
  onError?: (component: string, error: string) => void
  onReport?: (report: SystemReport) => void
}

export const DEFAULT_CHECK_INTERVAL_MS = 30_000

export const COMPONENT_NAMES = [
  'plugin-bootstrap',
  'task-registry',
  'mcp-bus',
  'persistent-task-engine',
  'tool-use-enforcer',
  'divoom',
  'openclaw',
] as const

export type ComponentName = (typeof COMPONENT_NAMES)[number]
