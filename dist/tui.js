import { createRequire } from "node:module";
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/tui.ts
var state = {
  agents: {},
  messages: []
};
function getTuiState() {
  return state;
}
function updateAgentModel(agentName, model, displayName) {
  state.agents[agentName] = { model, displayName, status: "ready" };
}
function setActiveAgent(agentName) {
  state.activeAgent = agentName;
}
function addMessage(role, content, agent) {
  state.messages.push({ role, content, agent });
  if (state.messages.length > 100) {
    state.messages = state.messages.slice(-100);
  }
}
var TuiPlugin = async () => {
  return {
    name: "oh-my-agents-tui",
    tool: {}
  };
};
export {
  updateAgentModel,
  setActiveAgent,
  getTuiState,
  addMessage,
  TuiPlugin
};
