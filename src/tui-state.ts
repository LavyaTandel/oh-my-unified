import type { PluginContext } from './plugin/types';

export interface TuiState {
  agents: Record<string, { model: string; displayName?: string }>;
}

export function recordTuiAgentModel(
  state: TuiState,
  agentName: string,
  model: string,
  displayName?: string,
) {
  state.agents[agentName] = { model, displayName };
}

export function recordTuiAgentModels(
  state: TuiState,
  agents: Record<string, { model: string; displayName?: string }>,
) {
  Object.assign(state.agents, agents);
}