import type { Plugin } from '@opencode-ai/plugin';

/**
 * TUI (Text User Interface) module for the Oh My Agents plugin.
 * Provides a terminal-based interface for monitoring and interacting with agents.
 */

export interface TuiState {
  agents: Record<string, { model: string; displayName?: string; status?: string }>;
  activeAgent?: string;
  messages: Array<{ role: string; content: string; agent?: string }>;
}

const state: TuiState = {
  agents: {},
  messages: [],
};

export function getTuiState(): TuiState {
  return state;
}

export function updateAgentModel(agentName: string, model: string, displayName?: string): void {
  state.agents[agentName] = { model, displayName, status: 'ready' };
}

export function setActiveAgent(agentName: string): void {
  state.activeAgent = agentName;
}

export function addMessage(role: string, content: string, agent?: string): void {
  state.messages.push({ role, content, agent });
  // Keep only last 100 messages
  if (state.messages.length > 100) {
    state.messages = state.messages.slice(-100);
  }
}

// Plugin function for TUI module
export const TuiPlugin: Plugin = async () => {
  return {
    name: 'oh-my-agents-tui',
    tool: {},
  };
};