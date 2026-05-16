import { createRequire } from "node:module";
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/tui/state.ts
var state = {
  agents: {},
  messages: [],
  health: { agentCount: 0, toolCount: 0, mcpCount: 0, status: "healthy" }
};
var subscribers = new Set;
function getTuiState() {
  return state;
}
function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
function notify() {
  const snapshot = { ...state, agents: { ...state.agents }, messages: [...state.messages] };
  for (const fn of subscribers) {
    try {
      fn(snapshot);
    } catch {}
  }
}
function updateAgentModel(agentName, model, displayName, role) {
  const existing = state.agents[agentName];
  state.agents[agentName] = {
    name: agentName,
    model,
    displayName: displayName ?? existing?.displayName,
    status: existing?.status ?? "ready",
    role: role ?? existing?.role,
    lastActiveAt: existing?.lastActiveAt
  };
  notify();
}
function setAgentStatus(agentName, status) {
  if (state.agents[agentName]) {
    state.agents[agentName].status = status;
    state.agents[agentName].lastActiveAt = Date.now();
    notify();
  }
}
function setActiveAgent(agentName) {
  state.activeAgent = agentName;
  notify();
}
function addMessage(role, content, agent) {
  state.messages.push({ role, content, agent, timestamp: Date.now() });
  if (state.messages.length > 100) {
    state.messages = state.messages.slice(-100);
  }
  notify();
}
function updateHealth(health) {
  state.health = health;
  notify();
}
function setSessionId(id) {
  state.sessionId = id;
  notify();
}
// src/tui/renderer.tsx
import { render } from "ink";

// src/tui/app.tsx
import { useState, useEffect } from "react";
import { Box as Box5, Text as Text5, useApp, useInput } from "ink";

// src/tui/components/agent-list.tsx
import { Box, Text } from "ink";
import { jsxDEV } from "react/jsx-dev-runtime";
var statusColor = {
  ready: "green",
  busy: "yellow",
  error: "red"
};
var statusDot = {
  ready: "●",
  busy: "●",
  error: "●"
};
var AgentList = ({ agents, activeAgent, onSelect }) => {
  const agentEntries = Object.values(agents);
  if (agentEntries.length === 0) {
    return /* @__PURE__ */ jsxDEV(Box, {
      flexDirection: "column",
      padding: 1,
      children: /* @__PURE__ */ jsxDEV(Text, {
        color: "gray",
        children: "No agents registered"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV(Box, {
    flexDirection: "column",
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV(Text, {
        bold: true,
        color: "cyan",
        children: "Agents"
      }, undefined, false, undefined, this),
      agentEntries.map((agent) => {
        const isActive = agent.name === activeAgent;
        const color = statusColor[agent.status] ?? "gray";
        const prefix = isActive ? "▸ " : "  ";
        return /* @__PURE__ */ jsxDEV(Text, {
          children: [
            /* @__PURE__ */ jsxDEV(Text, {
              color,
              children: [
                prefix,
                statusDot[agent.status] ?? "●",
                " "
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              bold: isActive,
              color: isActive ? "cyan" : undefined,
              children: agent.displayName ?? `@${agent.name}`
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              color: "gray",
              children: [
                " — ",
                agent.role ?? agent.model
              ]
            }, undefined, true, undefined, this)
          ]
        }, agent.name, true, undefined, this);
      })
    ]
  }, undefined, true, undefined, this);
};
// src/tui/components/message-log.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var roleColor = {
  user: "cyan",
  assistant: "white",
  system: "gray",
  tool: "yellow"
};
var MessageLog = ({ messages, maxLines = 20 }) => {
  const recent = messages.slice(-maxLines);
  if (recent.length === 0) {
    return /* @__PURE__ */ jsxDEV2(Box2, {
      flexDirection: "column",
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsxDEV2(Text2, {
          bold: true,
          color: "cyan",
          children: "Messages"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2(Text2, {
          color: "gray",
          children: "No messages yet"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2(Box2, {
    flexDirection: "column",
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV2(Text2, {
        bold: true,
        color: "cyan",
        children: "Messages"
      }, undefined, false, undefined, this),
      recent.map((msg, i) => /* @__PURE__ */ jsxDEV2(Text2, {
        wrap: "truncate-end",
        children: [
          /* @__PURE__ */ jsxDEV2(Text2, {
            color: roleColor[msg.role] ?? "gray",
            children: [
              "[",
              msg.role,
              "]"
            ]
          }, undefined, true, undefined, this),
          msg.agent ? /* @__PURE__ */ jsxDEV2(Text2, {
            color: "magenta",
            children: [
              " @",
              msg.agent
            ]
          }, undefined, true, undefined, this) : null,
          /* @__PURE__ */ jsxDEV2(Text2, {
            children: [
              " ",
              msg.content.slice(0, 80),
              msg.content.length > 80 ? "…" : ""
            ]
          }, undefined, true, undefined, this)
        ]
      }, i, true, undefined, this))
    ]
  }, undefined, true, undefined, this);
};
// src/tui/components/health-bar.tsx
import { Box as Box3, Text as Text3 } from "ink";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
var statusColor2 = {
  healthy: "green",
  warning: "yellow",
  critical: "red"
};
var HealthBar = ({ health }) => {
  const color = statusColor2[health.status] ?? "gray";
  return /* @__PURE__ */ jsxDEV3(Box3, {
    flexDirection: "column",
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV3(Text3, {
        bold: true,
        color: "cyan",
        children: "System Health"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3(Box3, {
        children: [
          /* @__PURE__ */ jsxDEV3(Text3, {
            color,
            children: [
              "Status: ",
              health.status.toUpperCase()
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            color: "gray",
            children: " | "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            children: [
              "Agents: ",
              health.agentCount
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            color: "gray",
            children: " | "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            children: [
              "Tools: ",
              health.toolCount
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            color: "gray",
            children: " | "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3(Text3, {
            children: [
              "MCPs: ",
              health.mcpCount
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
};
// src/tui/components/status-bar.tsx
import { Box as Box4, Text as Text4 } from "ink";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
var StatusBar = ({ activeAgent, sessionId }) => {
  return /* @__PURE__ */ jsxDEV4(Box4, {
    paddingX: 1,
    borderTop: true,
    borderColor: "gray",
    children: [
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: "gray",
        children: activeAgent ? `Agent: ${activeAgent}` : "No agent"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: "gray",
        children: " | "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: "gray",
        children: sessionId ? `Session: ${sessionId.slice(0, 12)}` : "No session"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: "gray",
        children: " | "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: "gray",
        children: "1-9: switch | h: health | s: status | q: quit"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};
// src/tui/app.tsx
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
var App = () => {
  const { exit } = useApp();
  const [state2, setState] = useState(getTuiState());
  const [showHealth, setShowHealth] = useState(true);
  useEffect(() => {
    const unsub = subscribe((s) => setState(s));
    return unsub;
  }, []);
  useInput((input) => {
    switch (input) {
      case "q":
        exit();
        break;
      case "h":
        setShowHealth((v) => !v);
        break;
      case "s":
        break;
      default:
        break;
    }
  });
  const agents = Object.values(state2.agents);
  return /* @__PURE__ */ jsxDEV5(Box5, {
    flexDirection: "column",
    width: "100%",
    height: "100%",
    children: [
      /* @__PURE__ */ jsxDEV5(Box5, {
        paddingX: 1,
        children: [
          /* @__PURE__ */ jsxDEV5(Text5, {
            bold: true,
            color: "cyan",
            children: "oh-my-unified"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV5(Text5, {
            color: "gray",
            children: " — Multi-Agent Orchestration"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV5(Box5, {
        flexDirection: "row",
        flexGrow: 1,
        children: [
          /* @__PURE__ */ jsxDEV5(Box5, {
            flexDirection: "column",
            width: "40%",
            children: /* @__PURE__ */ jsxDEV5(AgentList, {
              agents,
              activeAgent: state2.activeAgent
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV5(Box5, {
            flexDirection: "column",
            flexGrow: 1,
            children: /* @__PURE__ */ jsxDEV5(MessageLog, {
              messages: state2.messages
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      showHealth && /* @__PURE__ */ jsxDEV5(HealthBar, {
        health: state2.health
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(StatusBar, {
        activeAgent: state2.activeAgent,
        sessionId: state2.sessionId
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
};

// src/utils/logger.ts
var logger = null;
function initLogger(sessionId) {
  const prefix = `[oh-my-unified:${sessionId}]`;
  const debug = process.env.DEBUG?.includes("oh-my-unified");
  logger = {
    info: (msg, meta) => {
      if (debug)
        process.stderr.write(`${prefix} INFO: ${msg} ${JSON.stringify(meta || "")}
`);
    },
    warn: (msg, meta) => {
      process.stderr.write(`${prefix} WARN: ${msg} ${JSON.stringify(meta || "")}
`);
    },
    error: (msg, meta) => {
      process.stderr.write(`${prefix} ERROR: ${msg} ${JSON.stringify(meta || "")}
`);
    },
    debug: (msg, meta) => {
      if (debug)
        process.stderr.write(`${prefix} DEBUG: ${msg} ${JSON.stringify(meta || "")}
`);
    }
  };
}
function log(msg, meta) {
  logger?.info(msg, meta);
}

// src/tui/renderer.tsx
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
var unmount = null;
function startTui() {
  if (unmount)
    return;
  if (!process.stdout.isTTY) {
    log("[tui] skipping — not a TTY (desktop/server mode)");
    return;
  }
  try {
    const instance = render(/* @__PURE__ */ jsxDEV6(App, {}, undefined, false, undefined, this));
    unmount = instance.unmount;
    log("[tui] renderer started");
  } catch (err) {
    log("[tui] failed to start", { error: String(err) });
  }
}
function stopTui() {
  if (unmount) {
    unmount();
    unmount = null;
    log("[tui] renderer stopped");
  }
}
function isRunning() {
  return unmount !== null;
}
export {
  updateHealth,
  updateAgentModel,
  subscribe,
  stopTui,
  startTui,
  setSessionId,
  setAgentStatus,
  setActiveAgent,
  isRunning,
  getTuiState,
  addMessage
};
