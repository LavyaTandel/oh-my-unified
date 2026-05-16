export interface TuiAgent {
  name: string;
  model: string;
  displayName?: string;
  status: 'ready' | 'busy' | 'error';
  role?: string;
  lastActiveAt?: number;
}

export interface TuiMessage {
  role: string;
  content: string;
  agent?: string;
  timestamp: number;
}

export interface TuiState {
  agents: Record<string, TuiAgent>;
  activeAgent?: string;
  messages: TuiMessage[];
  health: {
    agentCount: number;
    toolCount: number;
    mcpCount: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  sessionId?: string;
}

const state: TuiState = {
  agents: {},
  messages: [],
  health: { agentCount: 0, toolCount: 0, mcpCount: 0, status: 'healthy' },
};

const subscribers = new Set<(s: TuiState) => void>();

export function getTuiState(): TuiState {
  return state;
}

export function subscribe(fn: (s: TuiState) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify(): void {
  const snapshot = { ...state, agents: { ...state.agents }, messages: [...state.messages] };
  for (const fn of subscribers) {
    try { fn(snapshot); } catch { /* ignore */ }
  }
}

export function updateAgentModel(agentName: string, model: string, displayName?: string, role?: string): void {
  const existing = state.agents[agentName];
  state.agents[agentName] = {
    name: agentName,
    model,
    displayName: displayName ?? existing?.displayName,
    status: existing?.status ?? 'ready',
    role: role ?? existing?.role,
    lastActiveAt: existing?.lastActiveAt,
  };
  notify();
}

export function setAgentStatus(agentName: string, status: TuiAgent['status']): void {
  if (state.agents[agentName]) {
    state.agents[agentName].status = status;
    state.agents[agentName].lastActiveAt = Date.now();
    notify();
  }
}

export function setActiveAgent(agentName: string): void {
  state.activeAgent = agentName;
  notify();
}

export function addMessage(role: string, content: string, agent?: string): void {
  state.messages.push({ role, content, agent, timestamp: Date.now() });
  if (state.messages.length > 100) {
    state.messages = state.messages.slice(-100);
  }
  notify();
}

export function updateHealth(health: TuiState['health']): void {
  state.health = health;
  notify();
}

export function setSessionId(id: string): void {
  state.sessionId = id;
  notify();
}
