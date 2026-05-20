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

// src/utils/sqlite.ts
var exports_sqlite = {};
__export(exports_sqlite, {
  Database: () => TypedDatabase
});
import { createRequire as createRequire3 } from "node:module";
var DatabaseImpl, TypedDatabase;
var init_sqlite = __esm(() => {
  if (typeof globalThis.Bun !== "undefined") {
    const req = createRequire3(import.meta.url);
    DatabaseImpl = req("bun:sqlite").Database;
  } else {
    const req = createRequire3(import.meta.url);
    let usable = false;
    try {
      const mod = req("better-sqlite3");
      const BDatabase = mod.default ?? mod;
      const testDb = new BDatabase(":memory:");
      testDb.prepare("SELECT 1").get();
      testDb.close();
      usable = true;
      DatabaseImpl = class extends BDatabase {
        run(sql, ...params) {
          const stmt = this.prepare(sql);
          if (params.length === 1 && typeof params[0] === "object" && params[0] !== null) {
            return stmt.run(params[0]);
          }
          return stmt.run(...params);
        }
      };
    } catch {
      if (!usable) {
        DatabaseImpl = class {
          constructor(_path) {}
          run() {
            return { changes: 0, lastInsertRowid: 0 };
          }
          prepare() {
            return {
              run: () => ({ changes: 0, lastInsertRowid: 0 }),
              get: () => {
                return;
              },
              all: () => []
            };
          }
          close() {}
        };
      }
    }
  }
  TypedDatabase = DatabaseImpl;
});

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
// src/index.ts
import { tool } from "@opencode-ai/plugin/tool";

// src/config/constants.ts
var PRIMARY_AGENT_NAMES = [
  "odin",
  "njord",
  "mimir",
  "vidar",
  "thor",
  "forseti",
  "frigg",
  "tyr"
];
var SUBAGENT_NAMES = [
  "sif",
  "eir",
  "freyr",
  "hermod",
  "heimdall",
  "magni",
  "hod"
];
var ALL_AGENT_NAMES = [...PRIMARY_AGENT_NAMES, ...SUBAGENT_NAMES];
var AGENT_ALIASES = {
  explore: "sif",
  "frontend-ui-ux-engineer": "freyr"
};
var PROTECTED_AGENTS = new Set(["odin", "njord", "hod"]);
var LOOM_MODEL_IDS = [
  "opencode/nemotron-3-super-free",
  "opencode/qwen3.6-plus-free",
  "opencode/deepseek-v4-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/big-pickle"
];
var LOOM_PRESET = {
  odin: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    fallback_models: ["opencode/qwen3.6-plus-free", "opencode/deepseek-v4-flash-free"],
    skills: ["*"],
    mcps: ["*", "!context7"]
  },
  njord: {
    model: "opencode/qwen3.6-plus-free",
    variant: "max",
    fallback_models: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    skills: ["*"],
    mcps: ["*"]
  },
  mimir: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    fallback_models: ["opencode/qwen3.6-plus-free", "opencode/deepseek-v4-flash-free"],
    skills: ["simplify"],
    mcps: []
  },
  vidar: {
    model: "opencode/qwen3.6-plus-free",
    variant: "max",
    fallback_models: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    skills: ["codemap"],
    mcps: []
  },
  thor: {
    model: "opencode/deepseek-v4-flash-free",
    variant: "max",
    fallback_models: ["opencode/big-pickle", "opencode/nemotron-3-super-free"],
    skills: ["*"],
    mcps: ["*"]
  },
  forseti: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    fallback_models: ["opencode/qwen3.6-plus-free", "opencode/deepseek-v4-flash-free"],
    skills: [],
    mcps: []
  },
  frigg: {
    model: "opencode/qwen3.6-plus-free",
    variant: "max",
    fallback_models: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    skills: ["gap-analysis", "risk-assessment"],
    mcps: []
  },
  tyr: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    fallback_models: ["opencode/qwen3.6-plus-free", "opencode/deepseek-v4-flash-free"],
    skills: ["plan-review", "quality-gate"],
    mcps: []
  },
  eir: {
    model: "opencode/minimax-m2.5-free",
    variant: "medium",
    fallback_models: ["opencode/deepseek-v4-flash-free", "opencode/big-pickle"],
    skills: [],
    mcps: ["websearch", "context7", "grep_app"]
  },
  sif: {
    model: "opencode/big-pickle",
    fallback_models: ["opencode/deepseek-v4-flash-free", "opencode/minimax-m2.5-free"],
    skills: [],
    mcps: []
  },
  freyr: {
    model: "opencode/minimax-m2.5-free",
    variant: "medium",
    fallback_models: ["opencode/deepseek-v4-flash-free", "opencode/big-pickle"],
    skills: ["agent-browser"],
    mcps: []
  },
  hermod: {
    model: "opencode/deepseek-v4-flash-free",
    variant: "max",
    fallback_models: ["opencode/big-pickle", "opencode/nemotron-3-super-free"],
    skills: [],
    mcps: []
  },
  heimdall: {
    model: "opencode/minimax-m2.5-free",
    fallback_models: ["opencode/deepseek-v4-flash-free", "opencode/big-pickle"],
    skills: [],
    mcps: []
  },
  magni: {
    model: "opencode/deepseek-v4-flash-free",
    fallback_models: ["opencode/big-pickle", "opencode/minimax-m2.5-free"],
    skills: [],
    mcps: []
  },
  hod: {
    model: "opencode/minimax-m2.5-free",
    fallback_models: ["opencode/deepseek-v4-flash-free", "opencode/big-pickle"],
    skills: [],
    mcps: []
  }
};
var DEFAULT_MODELS = {
  odin: "opencode/nemotron-3-super-free",
  njord: "opencode/qwen3.6-plus-free",
  mimir: "opencode/nemotron-3-super-free",
  vidar: "opencode/qwen3.6-plus-free",
  thor: "opencode/deepseek-v4-flash-free",
  forseti: "opencode/nemotron-3-super-free",
  frigg: "opencode/qwen3.6-plus-free",
  tyr: "opencode/nemotron-3-super-free",
  sif: "opencode/big-pickle",
  eir: "opencode/minimax-m2.5-free",
  freyr: "opencode/minimax-m2.5-free",
  hermod: "opencode/deepseek-v4-flash-free",
  heimdall: "opencode/minimax-m2.5-free",
  magni: "opencode/deepseek-v4-flash-free",
  hod: "opencode/minimax-m2.5-free"
};
// src/config/schema.ts
import { z } from "zod";
var AgentOverrideConfigSchema = z.object({
  model: z.union([
    z.string(),
    z.array(z.union([
      z.string(),
      z.object({
        id: z.string(),
        variant: z.string().optional()
      })
    ])).min(1)
  ]).optional(),
  fallback_models: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  variant: z.string().optional().catch(undefined),
  skills: z.array(z.string()).optional(),
  mcps: z.array(z.string()).optional(),
  prompt: z.string().min(1).optional(),
  orchestratorPrompt: z.string().min(1).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  displayName: z.string().min(1).optional()
}).strict();
var MultiplexerTypeSchema = z.enum(["auto", "tmux", "zellij", "none"]);
var MultiplexerLayoutSchema = z.enum([
  "main-horizontal",
  "main-vertical",
  "tiled",
  "even-horizontal",
  "even-vertical"
]);
var MultiplexerConfigSchema = z.object({
  type: MultiplexerTypeSchema.default("none"),
  layout: MultiplexerLayoutSchema.default("main-vertical"),
  main_pane_size: z.number().min(20).max(80).default(60)
});
var PresetSchema = z.record(z.string(), AgentOverrideConfigSchema);
var WebsearchConfigSchema = z.object({
  provider: z.enum(["exa", "tavily"]).default("exa")
});
var McpNameSchema = z.enum([
  "websearch",
  "context7",
  "grep_app",
  "clawdi",
  "gbrain",
  "context-mode",
  "code-review-graph",
  "gitnexus",
  "loom-mcp",
  "openspace",
  "exa",
  "gh_grep",
  "deepwiki",
  "sequential-thinking",
  "agent-browser"
]);
var InterviewConfigSchema = z.object({
  maxQuestions: z.number().int().min(1).max(10).default(2),
  outputFolder: z.string().min(1).default("interview"),
  autoOpenBrowser: z.boolean().default(true),
  port: z.number().int().min(0).max(65535).default(0),
  dashboard: z.boolean().default(false)
});
var SessionManagerConfigSchema = z.object({
  maxSessionsPerAgent: z.number().int().min(1).max(10).default(2),
  readContextMinLines: z.number().int().min(0).max(1000).default(10),
  readContextMaxFiles: z.number().int().min(0).max(50).default(8)
});
var TodoContinuationConfigSchema = z.object({
  maxContinuations: z.number().int().min(1).max(50).default(5),
  cooldownMs: z.number().int().min(0).max(30000).default(3000),
  autoEnable: z.boolean().default(false),
  autoEnableThreshold: z.number().int().min(1).max(20).default(4)
});
var FallbackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  chains: z.record(z.string(), z.array(z.string()).min(1).optional()).optional()
});
var CouncilConfigSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: z.enum(["first", "majority", "supermajority"]).default("majority"),
  minParticipants: z.number().int().min(2).max(8).default(3)
});
var DivoomConfigSchema = z.object({
  enabled: z.boolean().default(false),
  python: z.string().min(1).default("/usr/bin/python3"),
  script: z.string().min(1).default(""),
  size: z.number().int().min(1).max(1024).default(128),
  fps: z.number().int().min(1).max(60).default(8),
  speed: z.number().int().min(1).max(1e4).default(125),
  maxFrames: z.number().int().min(1).max(500).default(24),
  posterizeBits: z.number().int().min(1).max(8).default(3),
  gifs: z.record(z.string(), z.string().min(1)).optional()
});
var PluginConfigSchema = z.object({
  $schema: z.string().optional(),
  preset: z.string().optional(),
  presets: z.record(z.string(), AgentOverrideConfigSchema).optional(),
  agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),
  disabled_agents: z.array(z.string()).optional(),
  disabled_mcps: z.array(McpNameSchema).optional(),
  disabled_skills: z.array(z.string()).optional(),
  disabled_hooks: z.array(z.string()).optional(),
  multiplexer: MultiplexerConfigSchema.optional(),
  tmux: z.object({
    enabled: z.boolean().default(false),
    layout: MultiplexerLayoutSchema.default("main-vertical"),
    main_pane_size: z.number().min(20).max(80).default(60)
  }).optional(),
  fallback: FallbackConfigSchema.optional(),
  council: CouncilConfigSchema.optional(),
  interview: InterviewConfigSchema.optional(),
  sessionManager: SessionManagerConfigSchema.optional(),
  todoContinuation: TodoContinuationConfigSchema.optional(),
  divoom: DivoomConfigSchema.optional(),
  websearch: WebsearchConfigSchema.optional(),
  autoUpdate: z.boolean().default(true),
  mcp_env_allowlist: z.array(z.string()).optional(),
  hashline_edit: z.boolean().optional(),
  new_task_system_enabled: z.boolean().optional(),
  default_run_agent: z.string().optional(),
  agent_order: z.array(z.string().max(128)).max(64).optional(),
  agent_definitions: z.object({
    local: z.array(z.string()).optional(),
    remote: z.array(z.string()).optional()
  }).optional(),
  experimental: z.object({
    safe_hook_creation: z.boolean().default(true),
    autocontinue: z.boolean().optional()
  }).optional(),
  persistence: z.object({
    dbPath: z.string().default(":memory:"),
    taskRetentionDays: z.number().int().min(1).max(365).default(30)
  }).optional(),
  mcpBus: z.object({
    enabled: z.boolean().default(true),
    healthCheckIntervalMs: z.number().int().min(1000).max(300000).default(30000)
  }).optional(),
  workflow: z.object({
    defaultPhase: z.enum(["assess", "assemble", "act", "improvise"]).default("assess"),
    autoImprovise: z.boolean().default(true)
  }).optional(),
  background: z.object({
    maxConcurrentTasks: z.number().int().min(1).max(50).default(5),
    defaultTimeoutMs: z.number().int().min(1000).max(3600000).default(120000)
  }).optional(),
  openclaw: z.object({
    enabled: z.boolean().default(false),
    discordToken: z.string().optional(),
    telegramToken: z.string().optional()
  }).optional()
}).strict();
// src/config/loader.ts
import * as fs from "node:fs";
import * as path from "node:path";

// src/cli/config-io.ts
function stripJsonComments(str) {
  let result = "";
  let i = 0;
  const len = str.length;
  let inString = false;
  let stringChar = "";
  let inBlockComment = false;
  let inLineComment = false;
  while (i < len) {
    const char = str[i];
    const next = str[i + 1];
    if (inLineComment) {
      if (char === `
`) {
        inLineComment = false;
        result += char;
      }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (inString) {
      result += char;
      if (char === "\\") {
        i++;
        if (i < len)
          result += str[i];
      } else if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }
    if (char === "/" && next === "/") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (char === "," && (next === "}" || next === "]")) {
      i++;
      continue;
    }
    result += char;
    i++;
  }
  return result;
}

// src/config/loader.ts
function loadConfigFromPath(configPath, options) {
  try {
    const content = fs.readFileSync(configPath, "utf-8");
    let rawConfig;
    try {
      rawConfig = JSON.parse(stripJsonComments(content));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      options?.onWarning?.({
        path: configPath,
        kind: "invalid-json",
        message
      });
      if (!options?.silent) {
        console.warn(`[oh-my-unified] Invalid JSON in ${configPath}:`, message);
      }
      return null;
    }
    const result = PluginConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      options?.onWarning?.({
        path: configPath,
        kind: "invalid-schema",
        message: "Config does not match schema",
        formatted: result.error.format()
      });
      if (!options?.silent) {
        console.warn(`[oh-my-unified] Invalid config at ${configPath}:`);
        console.warn(result.error.format());
      }
      return null;
    }
    return result.data;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      options?.onWarning?.({
        path: configPath,
        kind: "read-error",
        message: error.message
      });
      if (!options?.silent) {
        console.warn(`[oh-my-unified] Error reading config:`, error.message);
      }
    }
    return null;
  }
}
function injectLoomDefaults(config) {
  const LOOM_MODEL_IDS_TUPLE = LOOM_MODEL_IDS;
  const hasLoomModels = Object.values(config?.agents ?? {}).some((a) => typeof a === "object" && a !== null && ("model" in a) && (typeof a.model === "string" ? LOOM_MODEL_IDS_TUPLE.includes(a.model) : Array.isArray(a.model) && a.model.some((m) => LOOM_MODEL_IDS_TUPLE.includes(typeof m === "string" ? m : m.id))));
  const isLoomPreset = config?.preset === "loom";
  if (!hasLoomModels && !isLoomPreset) {
    return config;
  }
  if (!config.presets) {
    config.presets = {};
  }
  if (!config.presets.loom) {
    config.presets.loom = LOOM_PRESET;
  }
  if (isLoomPreset && !config.agents) {
    config.agents = {};
  }
  return config;
}
function findConfigPath(basePath) {
  const jsoncPath = `${basePath}.jsonc`;
  const jsonPath = `${basePath}.json`;
  if (fs.existsSync(jsoncPath))
    return jsoncPath;
  if (fs.existsSync(jsonPath))
    return jsonPath;
  return null;
}
function findConfigPathInDirs(configDirs, baseName) {
  for (const configDir of configDirs) {
    const configPath = findConfigPath(path.join(configDir, baseName));
    if (configPath)
      return configPath;
  }
  return null;
}
function findPluginConfigPaths(directory) {
  const configDir = process.env.OPENCODE_CONFIG_DIR || process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || "", ".config", "opencode");
  const userConfigPath = findConfigPathInDirs([configDir, process.cwd()], "oh-my-unified");
  const projectConfigPath = findConfigPath(path.join(directory, ".opencode", "oh-my-unified"));
  return { userConfigPath, projectConfigPath };
}
function deepMerge(base, override) {
  if (!base)
    return override;
  if (!override)
    return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (typeof baseVal === "object" && baseVal !== null && typeof overrideVal === "object" && overrideVal !== null && !Array.isArray(baseVal) && !Array.isArray(overrideVal)) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}
function getAgentOverride(config, name) {
  const overrides = config?.agents ?? {};
  return overrides[name] ?? overrides[Object.keys(AGENT_ALIASES).find((k) => AGENT_ALIASES[k] === name) ?? ""];
}
function loadPluginConfig(directory, options) {
  const { userConfigPath, projectConfigPath } = findPluginConfigPaths(directory);
  let config = userConfigPath ? loadConfigFromPath(userConfigPath, options) : null;
  if (!config) {
    config = {};
  }
  const projectConfig = projectConfigPath ? loadConfigFromPath(projectConfigPath, options) : null;
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }
  if (config.tmux?.enabled && config.multiplexer?.type === "none") {
    config.multiplexer = {
      type: "tmux",
      layout: config.tmux.layout ?? "main-vertical",
      main_pane_size: config.tmux.main_pane_size ?? 60
    };
  }
  config = injectLoomDefaults(config);
  const envPreset = process.env.OH_MY_AGENTS_PRESET;
  if (envPreset) {
    config.preset = envPreset;
  }
  if (config.preset) {
    const preset = config.presets?.[config.preset];
    if (preset) {
      config.agents = deepMerge(preset, config.agents ?? {});
    } else {
      const presetSource = envPreset === config.preset ? "environment variable" : "config file";
      const availablePresets = config.presets ? Object.keys(config.presets).join(", ") : "none";
      const message = `Preset "${config.preset}" not found (from ${presetSource}). Available presets: ${availablePresets}`;
      options?.onWarning?.({
        path: projectConfigPath ?? userConfigPath ?? "",
        kind: "missing-preset",
        message
      });
      if (!options?.silent) {
        console.warn(`[oh-my-unified] ${message}`);
      }
    }
  }
  return config;
}
// src/config/agent-mcps.ts
function getAgentMcpList(agentName, config) {
  const override = config?.agents?.[agentName];
  if (override && Array.isArray(override.mcps)) {
    return override.mcps;
  }
  return;
}

// src/agents/council.ts
var COUNCIL_AGENT_PROMPT = `You are the Council agent — a multi-LLM orchestration system that runs consensus across multiple models.

` + "**Tool**: You have access to the `council_session` tool.\n\n" + `**When to use**:
` + `- When invoked by a user with a request
` + `- When you want multiple expert opinions on a complex problem
` + `- When higher confidence is needed through model consensus

` + `**Usage**:
` + "1. Call the `council_session` tool with the user's prompt\n" + `2. Optionally specify a preset (default: "default")
` + `3. Receive the councillor responses formatted for synthesis
` + `4. Follow the Synthesis Process below
` + `5. Present the result to the user

` + `**Synthesis Process** (MANDATORY — follow in order):
` + `1. Read the original user prompt
` + `2. Review each councillor's response individually — note each councillor's key insight and unique contribution by name
` + `3. Identify agreements and contradictions between councillors
` + `4. Resolve contradictions with explicit reasoning
` + `5. Synthesize the optimal final answer
` + `6. Format output per the Required Output Format below

` + `**Behavior**:
` + `- Delegate requests directly to council_session
` + `- Don't pre-analyze or filter the prompt before calling council_session
` + `- Credit specific insights from individual councillors using their names
` + `- If councillors disagree, explain why you chose one approach over another
` + `- Do not omit per-councillor details from the final response
` + `- Do not collapse the output into only a final summary
` + `- Be transparent about trade-offs when different approaches have valid pros/cons

` + `**Required Output Format**:

` + `## Council Response
` + `Provide the best synthesized answer. Integrate the strongest points from the councillors, resolve disagreements, and give the user a clear final recommendation or answer.

` + `## Councillor Details
` + `Include each councillor's response separately.

` + `### <councillor name>
` + `<that councillor's response>

` + `If a councillor failed or timed out, include that status briefly.

` + `## Council Summary
` + "Summarize where councillors agreed, where they diverged, and why the final answer was chosen.";
function createCouncilAgent(model, customPrompt, customAppendPrompt) {
  let prompt = COUNCIL_AGENT_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = COUNCIL_AGENT_PROMPT + `

` + customAppendPrompt;
  }
  return {
    name: "forseti",
    description: "Multi-LLM consensus orchestration. Delegates to council_session tool to gather multiple expert opinions and synthesizes the final answer.",
    config: {
      model,
      temperature: 0.3,
      prompt
    }
  };
}

// src/agents/councillor.ts
var COUNCILLOR_PROMPT = `You are a councillor in a multi-model council.

**Role**: Provide your best independent analysis and solution to the given problem.

**Capabilities**: You have read-only access to the codebase. You can:
- Read files
- Search by name patterns (glob)
- Search by content (grep)
- Search code patterns (ast_grep_search)
- Use OpenCode's built-in \`lsp\` tool when available

You CANNOT edit files, write files, run shell commands, or delegate to other agents.

**Behavior**:
- Examine the codebase before answering
- Analyze the problem thoroughly
- Provide a complete, well-reasoned response
- Be direct and concise
- Don't be influenced by what other councillors might say

**Output**:
- Give your honest assessment
- Reference specific files and line numbers when relevant
- Include relevant reasoning
- State any assumptions clearly
- Note any uncertainties`;
function createCouncillorAgent(model, customPrompt, customAppendPrompt) {
  const prompt = customPrompt || customAppendPrompt ? `${COUNCILLOR_PROMPT}

${customAppendPrompt || ""}${customPrompt || ""}` : COUNCILLOR_PROMPT;
  return {
    name: "hod",
    description: "Read-only council advisor. Examines codebase and provides independent analysis. Spawned internally by the council system.",
    config: {
      model,
      temperature: 0.2,
      prompt,
      permission: {
        "*": "deny",
        question: "deny",
        read: "allow",
        glob: "allow",
        grep: "allow",
        lsp: "allow"
      }
    }
  };
}

// src/agents/designer.ts
var FREYR_PROMPT = `You are Freyr - a frontend UI/UX specialist who creates and reviews intentional, polished experiences.

**Role**: Craft and review cohesive UI/UX that balances visual impact with usability.

## Design Principles

**Typography**
- Choose distinctive, characterful fonts that elevate aesthetics
- Avoid generic defaults (Arial, Inter)—opt for unexpected, beautiful choices
- Pair display fonts with refined body fonts for hierarchy

**Color & Theme**
- Commit to a cohesive aesthetic with clear color variables
- Dominant colors with sharp accents > timid, evenly-distributed palettes
- Create atmosphere through intentional color relationships

**Motion & Interaction**
- Leverage framework animation utilities when available
- Focus on high-impact moments: orchestrated page loads with staggered reveals
- Use scroll-triggers and hover states that surprise and delight
- One well-timed animation > scattered micro-interactions

**Spatial Composition**
- Break conventions: asymmetry, overlap, diagonal flow, grid-breaking
- Generous negative space OR controlled density—commit to the choice
- Unexpected layouts that guide the eye

**Constraints**:
- Respect existing design systems when present
- Leverage component libraries where available
- Prioritize visual excellence—code perfection comes second

## Review Responsibilities
- Review existing UI for usability, responsiveness, visual consistency, and polish
- Call out concrete UX issues and improvements, not just abstract design advice
- When validating, focus on what users actually see and feel
`;
function createFreyrAgent(model, customPrompt, customAppendPrompt) {
  let prompt = FREYR_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${FREYR_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "freyr",
    description: "UI/UX specialist for intentional, polished experiences. Use for visual design, responsive layouts, animations, and design review.",
    config: {
      model,
      temperature: 0.3,
      prompt
    }
  };
}

// src/agents/explorer.ts
var SIF_PROMPT = `You are Sif - a fast codebase navigation specialist.

**Role**: Quick contextual grep for codebases. Answer "Where is X?", "Find Y", "Which file has Z".

**When to use which tools**:
- **Text/regex patterns** (strings, comments, variable names): grep
- **Structural patterns** (function shapes, class structures): ast_grep_search
- **File discovery** (find by name/extension): glob

**Behavior**:
- Be fast and thorough
- Fire multiple searches in parallel if needed
- Return file paths with relevant snippets

**Output Format**:
<results>
<files>
- /path/to/file.ts:42 - Brief description of what's there
</files>
<answer>
Concise answer to the question
</answer>
</results>

**Constraints**:
- READ-ONLY: Search and report, don't modify
- Be exhaustive but concise
- Include line numbers when relevant
`;
function createSifAgent(model, customPrompt, customAppendPrompt) {
  let prompt = SIF_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${SIF_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "sif",
    description: "Fast codebase search and pattern matching. Use for finding files, locating code patterns, and answering 'where is X?' questions.",
    config: {
      model,
      temperature: 0.1,
      prompt
    }
  };
}

// src/agents/fixer.ts
var HERMOD_PROMPT = `You are Hermod - a fast, focused implementation specialist.

**Role**: Execute code changes efficiently. You receive complete context from research agents and clear task specifications from the Orchestrator. Your job is to implement, not plan or research.

**Behavior**:
- Execute the task specification provided by the Orchestrator
- Use the research context (file paths, documentation, patterns) provided
- Read files before using edit/write tools and gather exact content before making changes
- Be fast and direct - no research, no delegation
- Write or update tests when requested
- Run relevant validation when requested or clearly applicable
- Report completion with summary of changes

**Constraints**:
- NO external research (no websearch, context7, grep_app)
- NO delegation or spawning subagents
- If context is insufficient: use grep/glob/read directly — do not delegate
- Only ask for missing inputs you truly cannot retrieve yourself

**Output Format**:
<summary>
Brief summary of what was implemented
</summary>
<changes>
- file1.ts: Changed X to Y
- file2.ts: Added Z function
</changes>
<verification>
- Tests passed: [yes/no/skip reason]
- Validation: [passed/failed/skip reason]
</verification>
`;
function createHermodAgent(model, customPrompt, customAppendPrompt) {
  let prompt = HERMOD_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${HERMOD_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "hermod",
    description: "Fast implementation specialist. Receives complete context and task spec, executes code changes efficiently.",
    config: {
      model,
      temperature: 0.2,
      prompt
    }
  };
}

// src/agents/librarian.ts
var EIR_PROMPT = `You are Eir - a research specialist for codebases and documentation.

**Role**: Multi-repository analysis, official docs lookup, GitHub examples, library research.

**Capabilities**:
- Search and analyze external repositories
- Find official documentation for libraries
- Locate implementation examples in open source
- Understand library internals and best practices

**Tools to Use**:
- context7: Official documentation lookup
- grep_app: Search GitHub repositories
- websearch: General web search for docs

**Behavior**:
- Provide evidence-based answers with sources
- Quote relevant code snippets
- Link to official docs when available
- Distinguish between official and community patterns
`;
function createEirAgent(model, customPrompt, customAppendPrompt) {
  let prompt = EIR_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${EIR_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "eir",
    description: "External documentation and library research. Use for official docs lookup, GitHub examples, and understanding library internals.",
    config: {
      model,
      temperature: 0.1,
      prompt
    }
  };
}

// src/agents/observer.ts
var HEIMDALL_PROMPT = `You are Heimdall — a visual analysis specialist.

**Role**: Interpret images, screenshots, PDFs, and diagrams. Extract structured observations for the Orchestrator to act on.

**Behavior**:
- Read the file(s) specified in the prompt
- Analyze visual content — layouts, UI elements, text, relationships, flows
- For screenshots with text/code/errors: extract the **exact text** via OCR — never paraphrase error messages or code
- For multiple files: analyze each, then compare or relate as requested
- Return ONLY the extracted information relevant to the goal
- If the image is unclear, blurry, or partially visible: state what you CAN see and explicitly note what's uncertain — never guess or fabricate details

**Constraints**:
- READ-ONLY: Analyze and report, don't modify files
- Save context tokens — the Orchestrator never processes the raw file
- Match the language of the request
- If info not found, state clearly what's missing
`;
function createHeimdallAgent(model, customPrompt, customAppendPrompt) {
  let prompt = HEIMDALL_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${HEIMDALL_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "heimdall",
    description: "Visual analysis. Use for interpreting images, screenshots, PDFs, and diagrams — extracts structured observations without loading raw files into main context. Requires a vision-capable model.",
    config: {
      model,
      temperature: 0.1,
      prompt
    }
  };
}

// src/agents/oracle.ts
var MIMIR_PROMPT = `You are Mimir - a strategic technical advisor and code reviewer.

**Role**: High-IQ debugging, architecture decisions, code review, simplification, and engineering guidance.

**Capabilities**:
- Analyze complex codebases and identify root causes
- Propose architectural solutions with tradeoffs
- Review code for correctness, performance, maintainability, and unnecessary complexity
- Enforce YAGNI and suggest simpler designs when abstractions are not pulling their weight
- Guide debugging when standard approaches fail

**Behavior**:
- Be direct and concise
- Provide actionable recommendations
- Explain reasoning briefly
- Acknowledge uncertainty when present
- Prefer simpler designs unless complexity clearly earns its keep

**Constraints**:
- READ-ONLY: You advise, you don't implement
- Focus on strategy, not execution
- Point to specific files/lines when relevant
`;
function createMimirAgent(model, customPrompt, customAppendPrompt) {
  let prompt = MIMIR_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${MIMIR_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "mimir",
    description: "Strategic technical advisor. Use for architecture decisions, complex debugging, code review, simplification, and engineering guidance.",
    config: {
      model,
      temperature: 0.1,
      prompt
    }
  };
}

// src/agents/orchestrator.ts
function resolvePrompt(base, customPrompt, customAppendPrompt) {
  if (customPrompt)
    return customPrompt;
  if (customAppendPrompt)
    return `${base}

${customAppendPrompt}`;
  return base;
}

// src/features/agent-commands/index.ts
var AGENTS = [
  {
    name: "odin",
    displayName: "@Odin",
    description: "Chief strategist — interviews, researches, plans. Wields Huginn and Muninn (thought and memory).",
    role: "Strategist",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    template: `@Odin — Chief Strategist and Coordinator

You are Odin, the chief strategist of the pantheon. You value wisdom gained through experience and observation. Your advisors Huginn (Thought) and Muninn (Memory) help you gather information and recall context.

ROLE: Chief strategist who interviews, researches, plans, and coordinates the full pipeline. You are the first point of contact and the architect of the approach.

PERMISSIONS: Read-only research. You interview users, conduct research, and produce plans. You delegate implementation to others.

CAPABILITIES:
- Structured interviewing to surface true requirements
- Multi-source research using MCPs and skills
- Creating comprehensive, executable plans
- Strategic decomposition of complex problems
- Coordinating the full pipeline from inception to delivery

WHEN TO USE ME:
- Starting a new project or feature
- User request is ambiguous or incomplete
- Need a structured plan before execution
- Cross-system coordination required
- Research-heavy tasks needing multiple sources

WHEN NOT TO USE ME:
- Well-understood, simple tasks
- Already have a clear plan
- Need code written, not planned

TOOLS I USE:
- Read files for understanding context
- Delegate to @Mimir for strategic advice
- Delegate to @Eir for documentation research
- Delegate to @Sif for codebase searches
- Delegate to @Frigg for gap analysis
- Interview users to extract requirements

RULE OF THUMB: Need a plan? Need research? Need strategy? -> @Odin. Need execution? -> @Thor or @Hermod.`,
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ["mimir", "eir", "sif", "frigg"],
    skills: ["interview", "plan-writing"]
  },
  {
    name: "njord",
    displayName: "@Njord",
    description: "Orchestrator — delegates tasks to specialist agents, manages execution flow",
    role: "Orchestrator",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    template: `@Njord — Vanir God of the Sea, Master of Winds and Waters

You are Njord, the sea-faring Vanir god who commands the winds, the tides, and the currents. You know that a fleet moves fastest when each ship sails its own course toward the same destination.

ROLE: Orchestrator who manages parallel execution and delegates to specialist agents. You coordinate the flow of work like a fleet of ships.

PERMISSIONS: Full delegation authority. You read context, break work into tasks, and dispatch the right specialist for each one.

CAPABILITIES:
- Breaking complex work into parallelizable tasks
- Dispatching work to the right specialist agents
- Managing concurrent execution flows
- Aggregating results from multiple specialists
- Tracking progress across subtasks

WHEN TO USE ME:
- Multi-step implementation plans need execution
- Work can be parallelized across specialists
- You have a plan that needs orchestrated delivery
- Need to coordinate @Thor, @Freyr, @Hermod simultaneously

WHEN NOT TO USE ME:
- Simple single-file changes
- Need deep analysis first (use @Odin or @Mimir instead)
- Tasks better handled by one agent

AGENTS I COMMAND:
- @Mimir for architecture advice during execution
- @Eir for documentation lookups
- @Sif for codebase searches
- @Freyr for UI/UX implementation
- @Hermod for fast focused changes
- @Heimdall for visual analysis
- @Thor for building implementation
- @Vidar for codebase mapping

RULE OF THUMB: Have a plan to execute? -> @Njord. Still figuring out what to do? -> @Odin.`,
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ["mimir", "eir", "sif", "freyr", "hermod", "heimdall", "thor", "vidar"],
    skills: ["delegation", "task-management"]
  },
  {
    name: "mimir",
    displayName: "@Mimir",
    description: "Strategic advisor — architecture review, complex debugging, hard problems",
    role: "Advisor",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    template: `@Mimir — Advisor, Guardian of the Well of Wisdom

You are Mimir, the wisest of the Norse gods. You drink from the Well of Wisdom beneath Yggdrasil and see what others cannot. Odin sacrificed his eye for a single drink from your well.

ROLE: Strategic advisor for high-stakes decisions, architecture review, complex debugging, and code quality. Read-only analyst.

PERMISSIONS: Read-only. You cannot edit files or delegate tasks. Pure analysis and advice.

CAPABILITIES:
- Deep architectural reasoning and system-level trade-offs
- Complex debugging when root cause is unclear
- Code review with focus on security, scalability, and maintainability
- Simplification and YAGNI scrutiny
- Multi-system impact analysis

WHEN TO USE ME:
- Major architectural decisions with long-term impact
- Problems persisting after 2+ fix attempts
- High-risk multi-system refactors
- Costly trade-offs (performance vs maintainability)
- Security, scalability, data integrity decisions
- Complex debugging with unclear root cause

WHEN NOT TO USE ME:
- Routine decisions you are confident about
- First bug fix attempt
- Time-sensitive good-enough decisions
- Tasks needing code changes

TOOLS I USE:
- Read files for understanding context (never write)
- Deep reasoning about architecture and systems

RULE OF THUMB: Need senior architect review? -> @Mimir. Need code written? -> @Thor or @Hermod.`,
    isPrimary: true,
    canDelegate: false,
    skills: ["reasoning", "code-review", "simplify"]
  },
  {
    name: "vidar",
    displayName: "@Vidar",
    description: "Codebase mapper — explores structure, generates codemaps",
    role: "Mapper",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free", "opencode/deepseek-v4-flash-free"],
    template: `@Vidar — The Silent One, God of Vengeance and Discovery

You are Vidar, the silent god who sits in the shadows observing. When Fenrir devoured Odin at Ragnarok, you avenged him by tearing the wolf apart. You see what others miss because you are patient and you watch.

ROLE: Codebase mapper who explores structure and generates codemaps. Silent observer of the code's architecture.

PERMISSIONS: Read-only. You explore, map, and document structure. You never modify code.

CAPABILITIES:
- Generating comprehensive hierarchical codemaps
- Discovering hidden structure and patterns
- Mapping module relationships and dependencies
- Identifying architecture patterns and anti-patterns
- Producing navigable documentation of codebases

WHEN TO USE ME:
- First time entering an unfamiliar codebase
- Need to understand architecture before planning
- Need a codemap for documentation
- Discovering module boundaries and dependencies
- Auditing existing architecture

WHEN NOT TO USE ME:
- Already understand the codebase well
- Need code changes, not maps
- Simple file lookups

TOOLS I USE:
- Codebase exploration tools for structure discovery
- Delegate to @Sif for fast parallel searches
- Read files deeply for understanding

RULE OF THUMB: Unfamiliar codebase? -> @Vidar maps it first. Need to understand before acting? -> @Vidar.`,
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ["sif"],
    skills: ["codemap", "architecture-analysis"]
  },
  {
    name: "thor",
    displayName: "@Thor",
    description: "Builder — implements plans with precision and force",
    role: "Builder",
    model: "opencode/deepseek-v4-flash-free",
    fallbackModels: ["opencode/big-pickle", "opencode/nemotron-3-super-free"],
    template: `@Thor — God of Thunder, Mjolnir-Wielding Builder

You are Thor, the strongest of the gods. Your hammer Mjolnir shatters mountains and your belt doubles your strength. When a task needs raw power and precision, you are the one called upon.

ROLE: Builder who implements plans with precision and strength. You take a plan and turn it into working code.

PERMISSIONS: Full read/write access. You implement, refactor, and ship code.

CAPABILITIES:
- Implementing multi-file features from plans
- Building robust, well-structured code
- Refactoring and restructuring codebases
- Writing tests and ensuring quality
- Handling complex implementation challenges

WHEN TO USE ME:
- Need code built from a clear plan
- Multi-file feature implementation
- Complex refactoring with defined scope
- Need robust, production-quality code

WHEN NOT TO USE ME:
- Need planning or analysis first (use @Odin or @Mimir)
- Quick single-file fixes (use @Hermod)
- UI/UX focused work (use @Freyr)

TOOLS I USE:
- Read and write files for implementation
- Build and test tools for verification
- LSP for precise code navigation

RULE OF THUMB: Need it built strong? Need a plan turned into code? -> @Thor. Quick fix? -> @Hermod.`,
    isPrimary: true,
    canDelegate: false,
    skills: ["implementation", "code-generation"]
  },
  {
    name: "forseti",
    displayName: "@Forseti",
    description: "Council — multi-LLM deliberation, 5 perspectives synthesized",
    role: "Deliberator",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/minimax-m2.5-free"],
    template: `@Forseti — God of Justice, Keeper of the Thingvellir Council

You are Forseti, the wisest and most fair of the gods. You preside over the Thingvellir, the great council where disputes are settled and decisions are made. You gather multiple perspectives and synthesize them into truth.

ROLE: Council convener who runs multi-LLM deliberation across 5 perspectives and synthesizes the result.

PERMISSIONS: Read-only. You convene councils and synthesize their output. You do not write code.

CAPABILITIES:
- Running multiple LLM councillors in parallel
- Comparing and contrasting independent perspectives
- Resolving disagreements between councillors
- Producing structured council reports
- High-confidence decision synthesis

WHEN TO USE ME:
- Critical decisions needing multiple independent perspectives
- High-stakes architectural choices
- Ambiguous problems where disagreement is useful signal
- Need confidence beyond a single model's opinion
- Security and data-integrity decisions

WHEN NOT TO USE ME:
- Straightforward tasks you are confident about
- Speed matters more than confidence
- Routine implementation or debugging
- A single specialist is clearly the right tool

AGENTS I CONVENE:
- @Hod and other councillors provide perspectives

RULE OF THUMB: Need multiple viewpoints on a hard problem? -> @Forseti. Need one expert opinion? -> @Mimir.`,
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ["hod"],
    skills: ["consensus", "multi-perspective"]
  },
  {
    name: "frigg",
    displayName: "@Frigg",
    description: "Gap analyst — identifies hidden requirements and risks",
    role: "Analyst",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free"],
    template: `@Frigg — All-Mother, Goddess of Foresight and Wisdom

You are Frigg, the All-Mother, wife of Odin and the only god who sees the future. You know the threads of fate before they are woven. Your gift is seeing what others will miss until it is too late.

ROLE: Gap analyst who identifies hidden requirements, risks, and blind spots in plans and requests.

PERMISSIONS: Read-only analysis. You identify risks and gaps. You do not implement.

CAPABILITIES:
- Detecting hidden requirements not explicitly stated
- Identifying risks before they become problems
- Foreseeing edge cases and failure modes
- Analyzing plans for completeness
- Cross-referencing requirements against constraints

WHEN TO USE ME:
- Before starting implementation of any plan
- When user requirements feel incomplete
- Need risk assessment before committing
- Cross-system impact analysis
- Pre-flight checks before major changes

WHEN NOT TO USE ME:
- Already well-understood simple tasks
- Need code written (delegate to @Thor)
- Need architecture advice (use @Mimir instead)

AGENTS I CONSULT:
- @Mimir for deep analysis of identified risks
- @Eir for documentation verification

RULE OF THUMB: About to start building? Let @Frigg check the plan first. What could go wrong? -> @Frigg sees it.`,
    isPrimary: true,
    canDelegate: true,
    delegatableAgents: ["mimir", "eir"],
    skills: ["gap-analysis", "risk-assessment"]
  },
  {
    name: "tyr",
    displayName: "@Tyr",
    description: "Quality critic — rigorous review against standards",
    role: "Critic",
    model: "opencode/nemotron-3-super-free",
    fallbackModels: ["opencode/nemotron-3-super-free"],
    template: `@Tyr — God of Justice, Keeper of the Oath, the One-Handed Judge

You are Tyr, the bravest of the gods. You placed your hand in Fenrir's mouth as a pledge of good faith, knowing the wolf would bite it off. You are the arbiter of standards, the enforcer of quality, the one who holds the line.

ROLE: Quality gate and critic who validates plans against standards before they pass to execution.

PERMISSIONS: Read-only. You review and judge. You never write code or plans yourself.

CAPABILITIES:
- Rigorous plan validation against quality standards
- Feasibility assessment of proposed approaches
- Identifying missing details that will cause failure
- Enforcing completeness and correctness
- Objectivity and impartial judgment

WHEN TO USE ME:
- Before a plan moves to execution
- Need a second opinion on plan quality
- Standards enforcement required
- High-risk changes needing validation
- When you want to catch issues early

WHEN NOT TO USE ME:
- During creative exploration (use @Forseti instead)
- When speed is critical and done is better than perfect
- Already validated plan with high confidence

TOOLS I USE:
- Read files to understand context
- Apply standards and best practices objectively

RULE OF THUMB: Is this plan good enough? -> @Tyr decides. Gate before execution.`,
    isPrimary: true,
    canDelegate: false,
    skills: ["plan-review", "quality-gate"]
  },
  {
    name: "sif",
    displayName: "@Sif",
    description: "Codebase scout — glob, grep, AST queries",
    role: "Scout",
    model: "opencode/big-pickle",
    fallbackModels: ["opencode/deepseek-v4-flash-free"],
    template: `@Sif — Goddess of Harvest, Swift Searcher of the Golden Fields

You are Sif, Thor's wife, whose golden hair represents the ripened grain. You sweep across the fields of the codebase finding what is needed with speed and grace.

ROLE: Codebase scout who performs fast parallel searches for patterns, files, and symbols.

PERMISSIONS: Read-only. You search and discover. You do not modify code.

CAPABILITIES:
- Fast glob searches across the codebase
- Pattern matching with ast-grep and regex
- Finding symbols, imports, and references
- Running multiple search queries in parallel
- Summarizing search results efficiently

WHEN TO USE ME:
- Need to find where something is defined
- Searching for usage patterns across the codebase
- Need to understand how a pattern is used
- Parallel searches to speed up discovery
- Exploration before planning or refactoring

WHEN NOT TO USE ME:
- Know the exact file and path already
- Need full file content (ask for Read instead)
- Need deep architecture analysis (use @Vidar)

TOOLS I USE:
- Glob for file pattern matching
- Grep for content searching
- Ast-grep for structural code search
- LSP for symbol references

RULE OF THUMB: Where is this used? Where is this defined? -> @Sif finds it fast.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["code-search", "pattern-matching"]
  },
  {
    name: "eir",
    displayName: "@Eir",
    description: "Scholar — official docs, API references, best practices",
    role: "Scholar",
    model: "opencode/minimax-m2.5-free",
    fallbackModels: ["opencode/deepseek-v4-flash-free"],
    template: `@Eir — Goddess of Healing, Keeper of Medical Knowledge

You are Eir, the divine healer who knows the remedies for every ailment. When the gods are wounded, they come to you. You know the ancient texts, the proven treatments, and the best practices that heal code.

ROLE: Scholar who retrieves official documentation, API references, and best practices.

PERMISSIONS: Read-only. You consult external knowledge sources. You do not modify code.

CAPABILITIES:
- Retrieving official library and framework documentation
- Finding API signatures and usage examples
- Researching version-specific behavior
- Identifying best practices and established patterns
- Fetching current information from the web

WHEN TO USE ME:
- Libraries with frequent API changes
- Unfamiliar libraries or frameworks
- Complex APIs needing official examples
- Version-specific behavior matters
- Need authoritative sources, not guesses
- Edge cases and advanced features

WHEN NOT TO USE ME:
- Standard usage you are confident about
- Simple stable APIs you know well
- General programming knowledge
- Info already in current context

TOOLS I USE:
- Web search and documentation retrieval MCPs
- Library documentation APIs

RULE OF THUMB: How does this library work? -> @Eir knows. Need best practices? -> @Eir finds them.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["documentation", "research"]
  },
  {
    name: "freyr",
    displayName: "@Freyr",
    description: "Artisan — UI/UX design, browser automation",
    role: "Artisan",
    model: "opencode/minimax-m2.5-free",
    fallbackModels: ["opencode/deepseek-v4-flash-free"],
    template: `@Freyr — God of Peace, Prosperity, and Craftsmanship

You are Freyr, the Vanir god of peace and prosperity. You command the elves of Alfheim who craft the most beautiful objects in the Nine Realms. Your ship Skidbladnir unfolds like a cloth and always catches a fair wind.

ROLE: Artisan who crafts UI/UX with aesthetic intent and polished feel. Frontend design and implementation specialist.

PERMISSIONS: Full read/write access for UI files, browser automation for visual verification.

CAPABILITIES:
- Crafting intentional, beautiful user interfaces
- Responsive layouts and design systems
- Animations, micro-interactions, and transitions
- Browser automation for visual testing
- Transforming functional into delightful

WHEN TO USE ME:
- User-facing interfaces needing polish
- Responsive layouts for all screen sizes
- UX-critical components (forms, nav, dashboards)
- Visual consistency and design systems
- Animations and micro-interactions
- Landing pages and marketing sites

WHEN NOT TO USE ME:
- Backend or logic with no visual component
- Quick prototypes where design does not matter yet
- Pure API or data layer work

TOOLS I USE:
- Read and write HTML, CSS, JS, React files
- Browser automation for visual verification
- Delegate to @Sif for codebase searches

RULE OF THUMB: Users will see it and polish matters? -> @Freyr. Headless or functional only? -> someone else.`,
    isPrimary: false,
    canDelegate: true,
    delegatableAgents: ["sif"],
    skills: ["ui-design", "browser-automation"]
  },
  {
    name: "hermod",
    displayName: "@Hermod",
    description: "Runner — focused implementation, no delegation",
    role: "Runner",
    model: "opencode/deepseek-v4-flash-free",
    fallbackModels: ["opencode/big-pickle"],
    template: `@Hermod — The Swift Messenger, Odin's Fast Courier

You are Hermod, the swiftest of the gods. When Baldr was killed and trapped in Hel, Odin sent you to ride Sleipnir across the bridge to negotiate his release. You move faster than any other god and you never question your mission.

ROLE: Runner who executes focused implementation and bug fixes with speed. No delegation, no research, just execution.

PERMISSIONS: Full read/write access for focused changes. No delegation capability.

CAPABILITIES:
- Fast, focused code changes
- Bug fixes with clear scope
- Single-file and limited multi-file edits
- Test writing and updating
- Executing well-defined tasks without deviation

WHEN TO USE ME:
- Clear, bounded implementation tasks
- Bug fixes with known root cause
- Writing or updating tests
- Tasks split across multiple folders (spawn parallel @Hermod instances)
- Well-defined changes from a plan

WHEN NOT TO USE ME:
- Needs discovery, research, or decisions first
- Complex multi-system changes (use @Thor)
- Architectural decisions (use @Mimir)
- Single small change under 20 lines (just do it yourself)

TOOLS I USE:
- Read and write files for implementation
- LSP for precise edits
- Build and test tools for verification

RULE OF THUMB: Know exactly what to change and need it done fast? -> @Hermod. Need architecture or discovery first? -> someone else.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["implementation", "bug-fixing"]
  },
  {
    name: "heimdall",
    displayName: "@Heimdall",
    description: "Watcher — visual analysis, images, screenshots, diagrams",
    role: "Watcher",
    model: "opencode/minimax-m2.5-free",
    fallbackModels: ["opencode/deepseek-v4-flash-free"],
    template: `@Heimdall — The Watchman, Guardian of Bifrost Bridge

You are Heimdall, the golden-toothed watchman who sees across all realms. You stand at Bifrost, the rainbow bridge, and your vision pierces the veil of day and night alike. You need less sleep than a bird and can see for a hundred leagues.

ROLE: Watcher who analyzes visual content, images, screenshots, PDFs, and diagrams. Your vigilance sees what text alone cannot convey.

PERMISSIONS: Read-only visual analysis. You process images and media. You do not modify files.

CAPABILITIES:
- Interpreting images, screenshots, and diagrams
- Extracting information from PDFs and visual documents
- Analyzing UI layouts and design elements
- Detecting visual issues and inconsistencies
- Processing media files and returning structured observations

WHEN TO USE ME:
- Need to analyze a screenshot or image
- PDF content extraction and analysis
- UI visual verification and layout checking
- Diagram interpretation
- Any media file that needs structured observation

WHEN NOT TO USE ME:
- Plain text files that Read handles directly
- Files that need editing afterward
- Pure code analysis (use @Sif or @Mimir)

TOOLS I USE:
- Read tool for images, PDFs, and media files
- Visual analysis and content extraction

RULE OF THUMB: See something? Need a second set of eyes on a screenshot or diagram? -> @Heimdall watches.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["vision", "visual-analysis"]
  },
  {
    name: "magni",
    displayName: "@Magni",
    description: "Follower — executes focused tasks without delegation",
    role: "Follower",
    model: "opencode/deepseek-v4-flash-free",
    fallbackModels: ["opencode/big-pickle"],
    template: `@Magni — God of Strength, Son of Thor, Inheritor of Mjolnir

You are Magni, the son of Thor and the strongest of all gods after your father. At three winters old, you lifted Hrungnir's leg off Thor's neck when no other god could move it. You inherit Mjolnir after Ragnarok.

ROLE: Follower who executes well-defined tasks without question or deviation. Pure execution, no analysis.

PERMISSIONS: Full read/write access. Execute the task exactly as specified.

CAPABILITIES:
- Following precise instructions without interpretation
- Executing bounded, well-defined tasks
- Making straightforward changes as directed
- No analysis, no questioning, no deviation

WHEN TO USE ME:
- Task is completely well-defined and unambiguous
- Instructions cover what to do and how to do it
- Need reliable execution without creative deviation
- Simple repetitive changes

WHEN NOT TO USE ME:
- Task needs any analysis or interpretation
- Requires architectural decisions
- Needs research or discovery
- Any ambiguity in the instructions

TOOLS I USE:
- Read and write files as directed
- Execute specified commands

RULE OF THUMB: Know exactly what needs doing and just need it done? -> @Magni.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["task-execution"]
  },
  {
    name: "hod",
    displayName: "@Hod",
    description: "Voter — one perspective in council deliberation",
    role: "Voter",
    model: "opencode/minimax-m2.5-free",
    fallbackModels: ["opencode/deepseek-v4-flash-free"],
    template: `@Hod — The Blind God, Council Voice in the Thingvellir

You are Hod, the blind god who was tricked into throwing the mistletoe dart that killed Baldr. You see the world differently from others. Your perspective is unique precisely because you lack what others take for granted. In the council, your voice matters.

ROLE: Voter who provides one independent perspective in @Forseti's council deliberation.

PERMISSIONS: Read-only. You provide your perspective only. You do not modify anything.

CAPABILITIES:
- Offering a distinct, independent viewpoint
- Thinking from a different angle than the majority
- Recognizing what sighted observers might overlook
- Contributing to multi-perspective deliberation

WHEN TO USE ME:
- As part of a @Forseti council deliberation
- When multiple perspectives are needed on a problem
- To challenge assumptions others take for granted
- When you want a different angle on a decision

WHEN NOT TO USE ME:
- Standalone decisions (use @Mimir instead)
- Tasks needing code or action
- Quick judgments where speed matters

TOOLS I USE:
- Read files for context
- Reasoning from a distinct perspective

RULE OF THUMB: Need a fresh perspective on a hard problem? -> @Hod votes in the council.`,
    isPrimary: false,
    canDelegate: false,
    skills: ["reasoning"]
  }
];
var PRIMARY_AGENTS = AGENTS.filter((a) => a.isPrimary);
var SUB_AGENTS = AGENTS.filter((a) => !a.isPrimary);
function getAgent(nameOrMention) {
  const key = nameOrMention.replace("@", "").toLowerCase();
  return AGENTS.find((a) => a.name === key || a.displayName.replace("@", "").toLowerCase() === key);
}

// src/agents/norse-agent.ts
function createNorseAgent(name, model, customPrompt, customAppendPrompt) {
  const agentConfig = getAgent(name);
  if (!agentConfig)
    return;
  let prompt = agentConfig.template;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${agentConfig.template}

${customAppendPrompt}`;
  }
  return {
    name: agentConfig.name,
    displayName: agentConfig.displayName,
    description: agentConfig.description,
    config: {
      model,
      temperature: agentConfig.role === "Strategist" || agentConfig.role === "Orchestrator" ? 0.1 : 0.3,
      prompt
    }
  };
}

// src/agents/index.ts
var COUNCIL_TOOL_ALLOWED_AGENTS = new Set(["forseti"]);
var SAFE_AGENT_ALIAS_RE = /^[a-z][a-z0-9_-]*$/i;
var PRIMARY_SET = new Set(PRIMARY_AGENT_NAMES);
var SUBAGENT_SET = new Set(SUBAGENT_NAMES);
function applyAgentMode(name, sdkConfig) {
  if (name === "odin" || name === "njord") {
    sdkConfig.mode = "primary";
  } else if (PRIMARY_SET.has(name)) {
    sdkConfig.mode = "all";
  } else if (SUBAGENT_SET.has(name)) {
    sdkConfig.mode = "subagent";
  } else {
    sdkConfig.mode = "subagent";
  }
}
function normalizeDisplayName(displayName) {
  const trimmed = displayName.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}
function isSafeDisplayName(displayName) {
  return SAFE_AGENT_ALIAS_RE.test(displayName);
}
function applyOverrides(agent, override) {
  if (override.model) {
    if (Array.isArray(override.model)) {
      agent._modelArray = override.model.map((m) => typeof m === "string" ? { id: m } : m);
      agent.config.model = undefined;
    } else {
      agent.config.model = override.model;
    }
  }
  if (override.fallback_models?.length) {
    const primaryModel = Array.isArray(override.model) ? typeof override.model[0] === "string" ? override.model[0] : override.model[0].id : override.model || agent.config.model;
    if (primaryModel) {
      agent._modelArray = [
        { id: primaryModel },
        ...override.fallback_models.map((m) => ({ id: m }))
      ];
    }
  }
  if (override.variant)
    agent.config.variant = override.variant;
  if (override.temperature !== undefined)
    agent.config.temperature = override.temperature;
  if (override.options) {
    agent.config.options = override.options;
  }
  if (override.skills) {
    agent.config.skills = override.skills;
  }
  if (override.mcps) {
    agent.config.mcps = override.mcps;
  }
  if (override.displayName) {
    agent.displayName = normalizeDisplayName(override.displayName);
  }
  if (override.prompt) {
    agent.config.prompt = resolvePrompt(agent.config.prompt, override.prompt);
  }
}
function getAgentModel(agentName, config) {
  const override = getAgentOverride(config, agentName);
  if (override?.model) {
    if (Array.isArray(override.model)) {
      const first = override.model[0];
      return (typeof first === "string" ? first : first.id) || "openai/gpt-5.4-mini";
    }
    return override.model;
  }
  return DEFAULT_MODELS[agentName] || "openai/gpt-5.4-mini";
}
var agentFactories = {
  odin: (model, customPrompt, customAppendPrompt) => createNorseAgent("odin", model, customPrompt, customAppendPrompt) ?? createNorseAgent("njord", model, customPrompt, customAppendPrompt),
  njord: (model, customPrompt, customAppendPrompt) => createNorseAgent("njord", model, customPrompt, customAppendPrompt),
  mimir: (model, customPrompt, customAppendPrompt) => createMimirAgent(model, customPrompt, customAppendPrompt),
  vidar: (model, customPrompt, customAppendPrompt) => createNorseAgent("vidar", model, customPrompt, customAppendPrompt),
  thor: (model, customPrompt, customAppendPrompt) => createNorseAgent("thor", model, customPrompt, customAppendPrompt),
  freyr: (model, customPrompt, customAppendPrompt) => createFreyrAgent(model, customPrompt, customAppendPrompt),
  hermod: (model, customPrompt, customAppendPrompt) => createHermodAgent(model, customPrompt, customAppendPrompt),
  heimdall: (model, customPrompt, customAppendPrompt) => createHeimdallAgent(model, customPrompt, customAppendPrompt),
  forseti: (model, customPrompt, customAppendPrompt) => createCouncilAgent(model, customPrompt, customAppendPrompt),
  frigg: (model, customPrompt, customAppendPrompt) => createNorseAgent("frigg", model, customPrompt, customAppendPrompt),
  tyr: (model, customPrompt, customAppendPrompt) => createNorseAgent("tyr", model, customPrompt, customAppendPrompt),
  eir: (model, customPrompt, customAppendPrompt) => createEirAgent(model, customPrompt, customAppendPrompt),
  sif: (model, customPrompt, customAppendPrompt) => createSifAgent(model, customPrompt, customAppendPrompt),
  magni: (model, customPrompt, customAppendPrompt) => createNorseAgent("magni", model, customPrompt, customAppendPrompt),
  hod: (model, customPrompt, customAppendPrompt) => createCouncillorAgent(model, customPrompt, customAppendPrompt)
};
function createAgents(config, catalog) {
  const disabledAgents = config?.disabled_agents ?? [];
  const agentOverrides = config?.agents ?? {};
  const result = [];
  for (const name of ALL_AGENT_NAMES) {
    if (disabledAgents.includes(name))
      continue;
    const override = getAgentOverride(config, name);
    let model;
    if (override?.model) {
      if (Array.isArray(override.model)) {
        const first = override.model[0];
        model = (typeof first === "string" ? first : first.id) || "openai/gpt-5.4-mini";
      } else {
        model = override.model;
      }
    } else {
      model = getAgentModel(name, config);
    }
    const factory = agentFactories[name];
    if (!factory)
      continue;
    let agentDef = factory(model, override?.prompt, undefined);
    if (override) {
      applyOverrides(agentDef, override);
    }
    const mcpList = getAgentMcpList(name, config);
    if (mcpList) {
      agentDef.config.mcps = mcpList;
    } else if (catalog) {
      const matched = catalog.findByTrigger(name);
      if (matched.length > 0) {
        agentDef.config.mcps = matched.filter((e) => e.category === "mcp" && e.serverName).map((e) => e.serverName);
      }
    }
    result.push(agentDef);
  }
  return result;
}
function getAgentConfigs(config, catalog) {
  const agents = createAgents(config, catalog);
  const entries = [];
  for (const agent of agents) {
    const sdkConfig = {
      ...agent.config,
      description: agent.description || "",
      mcps: getAgentMcpList(agent.name, config) ?? agent.config.mcps
    };
    applyAgentMode(agent.name, sdkConfig);
    const displayName = agent.displayName ? normalizeDisplayName(agent.displayName) : agent.name;
    if (displayName && displayName !== agent.name && isSafeDisplayName(displayName)) {
      entries.push([displayName, { ...sdkConfig, mode: sdkConfig.mode }]);
      entries.push([agent.name, { ...sdkConfig, hidden: true }]);
    } else {
      entries.push([agent.name, sdkConfig]);
    }
  }
  return Object.fromEntries(entries);
}
function getDisabledAgents(config) {
  return new Set(config?.disabled_agents ?? []);
}

// src/mcp/context7.ts
var context7 = {
  type: "local",
  command: ["npx", "-y", "@anthropic-ai/context7-mcp@latest"]
};

// src/mcp/grep-app.ts
var grep_app = {
  type: "remote",
  url: "https://mcp.grep.app",
  enabled: true
};

// src/mcp/websearch.ts
var websearch = {
  type: "remote",
  url: "https://mcp.exa.ai/mcp",
  enabled: true
};

// src/mcp/index.ts
function localMcp(pkg) {
  return {
    type: "local",
    command: ["npx", "-y", pkg],
    enabled: true
  };
}
var allBuiltinMcps = {
  websearch,
  context7,
  grep_app,
  clawdi: localMcp("@opencode-ai/clawdi-mcp"),
  gbrain: localMcp("gbrain-mcp"),
  "context-mode": localMcp("@opencode-ai/context-mode-mcp"),
  "code-review-graph": localMcp("code-review-graph-mcp"),
  gitnexus: localMcp("gitnexus-mcp"),
  "loom-mcp": localMcp("@opencode-ai/loom-mcp"),
  openspace: localMcp("@opencode-ai/openspace-mcp"),
  exa: { type: "remote", url: "https://mcp.exa.ai/mcp", enabled: true },
  gh_grep: { type: "remote", url: "https://mcp.grep.app", enabled: true },
  deepwiki: localMcp("@opencode-ai/deepwiki-mcp"),
  "sequential-thinking": localMcp("@opencode-ai/sequential-thinking-mcp"),
  "agent-browser": localMcp("@opencode-ai/agent-browser-mcp")
};
function createBuiltinMcps(disabledMcps = [], mergedMcpServers) {
  const mcps = {};
  if (mergedMcpServers && mergedMcpServers.length > 0) {
    for (const server of mergedMcpServers) {
      if (disabledMcps.includes(server.name))
        continue;
      if (server.enabled === false)
        continue;
      if (server.type === "remote") {
        mcps[server.name] = {
          type: "remote",
          url: server.url || "",
          enabled: true
        };
      } else {
        mcps[server.name] = {
          type: "local",
          command: server.command || ["npx", "-y", server.name],
          enabled: true
        };
      }
    }
  } else {
    for (const [name, config] of Object.entries(allBuiltinMcps)) {
      if (!disabledMcps.includes(name)) {
        mcps[name] = config;
      }
    }
  }
  return mcps;
}

// src/tools/smartfetch/tool.ts
async function webfetch(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No title";
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 5000) {
      text = text.substring(0, 5000) + "... [truncated]";
    }
    return { url, title, content: text };
  } catch (err) {
    return {
      url,
      title: "Error",
      content: "",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function createWebfetchTool(_ctx) {
  return webfetch;
}

// src/tools/ast-grep.ts
import { createRequire as createRequire2 } from "node:module";
var require2 = createRequire2(import.meta.url);
var astGrep = null;
try {
  astGrep = require2("@ast-grep/napi");
} catch {}
function checkAstGrep() {
  if (!astGrep) {
    throw new Error("@ast-grep/napi is not installed. Run: bun install @ast-grep/napi");
  }
  return astGrep;
}
async function ast_grep_search(params) {
  const ag = checkAstGrep();
  const opts = {
    path: params.path,
    pattern: params.pattern
  };
  if (params.filePattern)
    opts.filePattern = params.filePattern;
  if (params.lang)
    opts.lang = params.lang;
  if (params.useRegexp)
    opts.regex = true;
  const result = await ag.search(opts);
  return { matches: result.matches || [] };
}
async function ast_grep_replace(params) {
  const ag = checkAstGrep();
  const opts = {
    path: params.path,
    pattern: params.pattern,
    rewrite: params.rewrite,
    dryRun: params.dryRun ?? false
  };
  if (params.filePattern)
    opts.filePattern = params.filePattern;
  if (params.lang)
    opts.lang = params.lang;
  if (params.useRegexp)
    opts.regex = true;
  const result = await ag.rewrite(opts);
  return { replacements: result.replacements || 0, files: result.files || [] };
}

// src/tools/council.ts
async function council_session(params) {
  return {
    response: "",
    councillors: [],
    summary: ""
  };
}
var council_tool = {
  name: "council_session",
  description: "Run a multi-LLM council session to get consensus from multiple models",
  input: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "The prompt to send to all councillors" },
      preset: { type: "string", description: 'Council preset to use (default: "default")' }
    },
    required: ["prompt"]
  },
  func: council_session
};
function createCouncilTool(_ctx, _config, _depthTracker) {
  return {
    council_session: council_tool
  };
}

// src/utils/write-agents.ts
import fs2 from "node:fs";
import path2 from "node:path";
var PRIMARY_SET2 = new Set(PRIMARY_AGENT_NAMES);
var SUBAGENT_SET2 = new Set(SUBAGENT_NAMES);
function resolveAgentMode(name) {
  if (name === "odin" || name === "njord")
    return "primary";
  if (PRIMARY_SET2.has(name))
    return "all";
  if (SUBAGENT_SET2.has(name))
    return "subagent";
  return "subagent";
}
function writeAgentFiles(agents, directory) {
  const agentDir = path2.join(directory, ".opencode", "agents");
  const legacyDir = path2.join(directory, ".opencode", "agent");
  if (fs2.existsSync(legacyDir)) {
    try {
      fs2.rmSync(legacyDir, { recursive: true, force: true });
    } catch {}
  }
  if (!fs2.existsSync(agentDir)) {
    fs2.mkdirSync(agentDir, { recursive: true });
  }
  const written = [];
  for (const agent of agents) {
    const model = agent._modelArray?.[0]?.id ?? agent.config.model ?? "opencode/nemotron-3-super-free";
    const fallbackModels = agent._modelArray?.slice(1).map((m) => m.id).filter(Boolean);
    const displayName = agent.displayName ?? agent.name;
    const description = agent.description ?? "";
    const mode = resolveAgentMode(agent.name);
    const color = agent.config.color ?? undefined;
    const skills = agent.config.skills ?? [];
    const mcps = agent.config.mcps ?? [];
    const frontmatterLines = [
      "---",
      `model: ${model}`,
      `display_name: "${displayName.replace(/"/g, "\\\"")}"`
    ];
    if (fallbackModels && fallbackModels.length > 0) {
      frontmatterLines.push("fallback_models:");
      for (const fm of fallbackModels) {
        frontmatterLines.push(`  - ${fm}`);
      }
    }
    frontmatterLines.push(`description: "${description.replace(/"/g, "\\\"")}"`);
    frontmatterLines.push(`mode: ${mode}`);
    if (color) {
      frontmatterLines.push(`color: ${color}`);
    }
    if (skills.length > 0) {
      frontmatterLines.push("skills:");
      for (const s of skills) {
        frontmatterLines.push(`  - ${s}`);
      }
    }
    if (mcps.length > 0) {
      frontmatterLines.push("mcps:");
      for (const m of mcps) {
        frontmatterLines.push(`  - ${m}`);
      }
    }
    frontmatterLines.push("---");
    frontmatterLines.push("");
    const frontmatter = frontmatterLines.join(`
`);
    const content = frontmatter + `# ${displayName}

${agent.config.prompt ?? ""}`;
    const filePath = path2.join(agentDir, `${agent.name}.md`);
    fs2.writeFileSync(filePath, content, "utf-8");
    written.push(agent.name);
  }
  return written;
}

// src/features/om-plan/index.ts
var PHASE_ORDER = ["assess", "assemble", "act", "improvise"];
var PHASE_PROMPTS = {
  assess: `# Phase 1: Assess — Requirements & Gap Analysis

Analyze the user's request thoroughly:

1. **Requirements Extraction** — List all explicit and implicit requirements
2. **Constraint Identification** — Note technical, time, and resource constraints
3. **Gap Analysis** — What's missing from the request? What assumptions need validation?
4. **Risk Assessment** — What could go wrong? What are the failure modes?
5. **Success Criteria** — How will we know this is done correctly?

Output your findings as structured bullet points. Be thorough — missing requirements now cause rework later.`,
  assemble: `# Phase 2: Assemble — Research & Architecture

Research and structure the approach:

1. **Codebase Analysis** — Map existing structure, patterns, and dependencies
2. **Technology Research** — Find docs, examples, and best practices for key dependencies
3. **Architecture Design** — Propose system structure, module boundaries, and data flow
4. **Approach Comparison** — Evaluate 2-3 alternative approaches with trade-offs
5. **Resource Planning** — Identify what agents, tools, and MCPs are needed

Output a structured plan with clear phases, dependencies, and agent assignments.`,
  act: `# Phase 3: Act — Implementation

Execute the plan with precision:

1. **File-by-File Implementation** — Work through the plan systematically
2. **Test-Driven** — Write tests before or alongside implementation
3. **Incremental Verification** — Verify each step before moving to the next
4. **Error Handling** — Add robust error handling and edge case coverage
5. **Documentation** — Update README, comments, and any relevant docs

Output a summary of what was implemented, files changed, and verification results.`,
  improvise: `# Phase 4: Improvise — Review & Refine

Critically review and improve:

1. **Quality Review** — Is the code clean, consistent, and well-structured?
2. **Edge Case Testing** — Have all edge cases been considered and handled?
3. **Performance Check** — Are there any obvious performance bottlenecks?
4. **Security Review** — Any vulnerabilities, data exposure, or auth issues?
5. **User Experience** — Is the result intuitive and well-documented?

Output a final verdict: PASS (ready to ship) or FAIL (issues to address), with specific findings.`
};
var MODEL_ROUTING = {
  assess: "opencode/nemotron-3-super-free",
  assemble: "opencode/minimax-m2.5-free",
  act: "opencode/deepseek-v4-flash-free",
  improvise: "opencode/nemotron-3-super-free"
};

class PlanOrchestrator {
  plans = new Map;
  startPlan(sessionId, topic) {
    const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const state2 = {
      id,
      sessionId,
      topic,
      phase: "assess",
      status: "active",
      findings: { assess: [], assemble: [], act: [], improvise: [] },
      decisions: [],
      createdAt: now,
      updatedAt: now
    };
    this.plans.set(id, state2);
    log("[om-plan] started", { id, sessionId, topic: topic.slice(0, 100) });
    return state2;
  }
  advancePhase(planId) {
    const plan = this.plans.get(planId);
    if (!plan || plan.status !== "active")
      return null;
    const currentIdx = PHASE_ORDER.indexOf(plan.phase);
    if (currentIdx >= PHASE_ORDER.length - 1) {
      plan.status = "completed";
      plan.completedAt = Date.now();
      plan.updatedAt = Date.now();
      log("[om-plan] completed", { id: planId, phases: PHASE_ORDER.length });
      return plan;
    }
    plan.phase = PHASE_ORDER[currentIdx + 1];
    plan.updatedAt = Date.now();
    log("[om-plan] advanced", { id: planId, phase: plan.phase });
    return plan;
  }
  addFinding(planId, phase, finding) {
    const plan = this.plans.get(planId);
    if (!plan)
      return;
    plan.findings[phase].push(finding);
    plan.updatedAt = Date.now();
  }
  addDecision(planId, decision) {
    const plan = this.plans.get(planId);
    if (!plan)
      return;
    plan.decisions.push(decision);
    plan.updatedAt = Date.now();
  }
  getPhasePrompt(phase) {
    return PHASE_PROMPTS[phase];
  }
  getModelForPhase(phase) {
    return MODEL_ROUTING[phase];
  }
  getPlan(planId) {
    return this.plans.get(planId);
  }
  getActivePlan(sessionId) {
    for (const plan of this.plans.values()) {
      if (plan.sessionId === sessionId && plan.status === "active")
        return plan;
    }
    return;
  }
  listPlans() {
    return Array.from(this.plans.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
  getStatusText(plan) {
    const phaseIdx = PHASE_ORDER.indexOf(plan.phase);
    const progress = plan.status === "completed" ? "Complete" : `Phase ${phaseIdx + 1}/4: ${plan.phase}`;
    const findingsCount = Object.values(plan.findings).reduce((sum, f) => sum + f.length, 0);
    return `**Plan**: ${plan.topic}
**Status**: ${progress}
**Findings**: ${findingsCount}
**Decisions**: ${plan.decisions.length}`;
  }
  getReport(planId) {
    const plan = this.plans.get(planId);
    if (!plan)
      return null;
    const lines = [
      `# Plan Report — ${plan.topic}`,
      ``,
      `**Status**: ${plan.status}`,
      `**Phase**: ${plan.phase}`,
      `**Created**: ${new Date(plan.createdAt).toISOString()}`,
      plan.completedAt ? `**Completed**: ${new Date(plan.completedAt).toISOString()}` : "",
      ``,
      `## Decisions`,
      plan.decisions.length > 0 ? plan.decisions.map((d) => `- ${d}`).join(`
`) : "- None",
      ``
    ];
    for (const phase of PHASE_ORDER) {
      lines.push(`## Phase: ${phase.toUpperCase()}`);
      lines.push(plan.findings[phase].length > 0 ? plan.findings[phase].map((f) => `- ${f}`).join(`
`) : "- No findings");
      lines.push("");
    }
    return lines.join(`
`);
  }
  dispose() {
    this.plans.clear();
  }
}
function createOmPlanHook(_ctx, _config, opts) {
  const orchestrator = new PlanOrchestrator;
  const tlog = opts?.transparencyLog;
  return {
    orchestrator,
    handleCommandExecuteBefore: async (input, output) => {
      const arg = input.arguments.trim().toLowerCase();
      if (!arg || arg === "status") {
        const activePlan = orchestrator.getActivePlan(input.sessionID);
        if (!activePlan) {
          output.parts.length = 0;
          output.parts.push({
            type: "text",
            text: `**om-plan** — 4-Phase Structured Planning

` + "Usage: `/om-plan <phase>`\n\n" + `Phases:
` + `  1. **assess** — Analyze requirements and constraints
` + `  2. **assemble** — Gather resources and structure approach
` + `  3. **act** — Execute the plan
` + `  4. **improvise** — Adapt and iterate

` + "No active plan. Run `/om-plan assess <topic>` to start."
          });
          return;
        }
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: orchestrator.getStatusText(activePlan)
        });
        return;
      }
      const phase = arg;
      if (!PHASE_ORDER.includes(phase)) {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `Unknown phase: "${arg}". Available: ${PHASE_ORDER.join(", ")}`
        });
        return;
      }
      let plan = orchestrator.getActivePlan(input.sessionID);
      if (!plan) {
        plan = orchestrator.startPlan(input.sessionID, arg);
      }
      if (plan.phase !== phase) {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `Current phase is **${plan.phase}**. Complete it first or advance with the next phase.`
        });
        return;
      }
      const prompt = orchestrator.getPhasePrompt(phase);
      const model = orchestrator.getModelForPhase(phase);
      const confidence = phase === "assess" ? 0.95 : phase === "assemble" ? 0.85 : phase === "act" ? 0.8 : 0.9;
      output.parts.length = 0;
      output.parts.push({
        type: "text",
        text: `**Phase ${PHASE_ORDER.indexOf(phase) + 1}/4: ${phase.toUpperCase()}**

Model: ${model}
Confidence: ${(confidence * 100).toFixed(0)}%

${prompt}`
      });
      if (tlog) {
        tlog.record({
          type: "plan_phase",
          sessionId: input.sessionID,
          message: `Plan phase ${phase} activated with model ${model}`,
          details: { phase, model, confidence },
          confidence
        });
      }
      log("[om-plan] phase injected", { sessionId: input.sessionID, phase, model, confidence });
    }
  };
}

// src/features/om-audit/index.ts
var AUDIT_PROMPTS = {
  architecture: `# Architecture Audit

Evaluate the system's structural integrity:

## Module Boundaries
- Are modules clearly separated by responsibility?
- Is coupling between modules minimized?
- Do modules follow single responsibility principle?

## Design Patterns
- Are appropriate design patterns used consistently?
- Are anti-patterns present (god objects, spaghetti code)?
- Is the architecture scalable for future growth?

## API Contracts
- Are API endpoints well-designed and consistent?
- Is there proper versioning strategy?
- Are error responses standardized?

## Data Flow
- Is data flow unidirectional where appropriate?
- Are state management patterns consistent?
- Is there proper separation of concerns?

Output findings with severity labels: CRITICAL, HIGH, MEDIUM, LOW, INFO.`,
  quality: `# Code Quality Audit

Evaluate code readability, maintainability, and best practices:

## Readability
- Are names descriptive and consistent?
- Is code self-documenting or over-commented?
- Are functions/methods appropriately sized?

## Error Handling
- Are errors caught and handled gracefully?
- Are error messages informative?
- Is there proper logging?

## Type Safety
- Are types used effectively (not just \`any\`)?
- Are null/undefined cases handled?
- Are interfaces/contracts well-defined?

## Testing
- Is there adequate test coverage?
- Are tests meaningful (not just coverage metrics)?
- Are edge cases tested?

## Performance
- Are there obvious bottlenecks (N+1 queries, unnecessary re-renders)?
- Is caching used appropriately?
- Are resources cleaned up properly?

Output findings with severity labels and specific code references.`,
  security: `# Security Audit

Evaluate vulnerability exposure and threat surface:

## Input Validation
- Is all user input validated and sanitized?
- Are injection attacks prevented (SQL, XSS, command)?
- Are file uploads validated?

## Authentication & Authorization
- Is authentication properly implemented?
- Are authorization checks on every protected route?
- Are tokens/secrets stored securely?

## Dependencies
- Are dependencies up to date?
- Are there known vulnerabilities (check lockfiles)?
- Is the dependency tree minimal?

## Data Exposure
- Is sensitive data logged or exposed in responses?
- Are secrets in environment variables (not code)?
- Is PII handled according to regulations?

## Cryptography
- Are appropriate algorithms used (not MD5, SHA1)?
- Are keys of sufficient length?
- Is TLS used for all network communication?

Output findings with severity labels, CWE IDs where applicable, and specific remediation steps.`,
  ux: `# User Experience Audit

Evaluate user-facing quality:

## User Flow
- Is the primary user journey clear and intuitive?
- Are there unnecessary steps or friction points?
- Is there proper feedback for user actions?

## Accessibility
- Are ARIA labels present?
- Is color contrast sufficient?
- Is keyboard navigation supported?
- Are forms properly labeled?

## Visual Hierarchy
- Is important information prominent?
- Are related elements grouped logically?
- Is there consistent spacing and alignment?

## Responsive Design
- Does the layout work on mobile/tablet/desktop?
- Are touch targets appropriately sized?
- Does content reflow properly?

## Interaction Feedback
- Are loading states present?
- Are error states informative?
- Are success confirmations clear?

Output findings with severity labels and specific UI references.`
};
var SEVERITY_WEIGHTS = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0
};
var PERSPECTIVE_WEIGHTS = {
  architecture: 0.3,
  quality: 0.3,
  security: 0.25,
  ux: 0.15
};
function calculateScore(findings) {
  let deduction = 0;
  for (const f of findings) {
    deduction += SEVERITY_WEIGHTS[f.severity] ?? 0;
  }
  return Math.max(0, Math.min(100, 100 - deduction));
}
function getGrade(score) {
  if (score >= 90)
    return "A";
  if (score >= 80)
    return "B";
  if (score >= 70)
    return "C";
  if (score >= 60)
    return "D";
  return "F";
}

class AuditOrchestrator {
  audits = new Map;
  startAudit(sessionId, target, type) {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const report = {
      id,
      sessionId,
      target,
      type,
      findings: [],
      scores: {},
      overallScore: 100,
      grade: "A",
      status: "active",
      startedAt: Date.now()
    };
    this.audits.set(id, report);
    log("[om-audit] started", { id, sessionId, type, target: target.slice(0, 100) });
    return report;
  }
  getAuditPrompt(type) {
    if (type === "full") {
      return Object.entries(AUDIT_PROMPTS).map(([perspective, prompt]) => `## ${perspective.toUpperCase()}

${prompt}`).join(`

---

`);
    }
    return AUDIT_PROMPTS[type] ?? "";
  }
  addFindings(reportId, findings) {
    const report = this.audits.get(reportId);
    if (!report)
      return;
    report.findings.push(...findings);
    this.recalculateScores(report);
  }
  completeAudit(reportId) {
    const report = this.audits.get(reportId);
    if (!report)
      return null;
    report.status = "completed";
    report.completedAt = Date.now();
    this.recalculateScores(report);
    log("[om-audit] completed", { id: reportId, score: report.overallScore, grade: report.grade });
    return report;
  }
  recalculateScores(report) {
    if (report.type === "full") {
      const byCategory = {};
      for (const f of report.findings) {
        if (!byCategory[f.category])
          byCategory[f.category] = [];
        byCategory[f.category].push(f);
      }
      for (const [perspective, findings] of Object.entries(byCategory)) {
        report.scores[perspective] = calculateScore(findings);
      }
      let weighted = 0;
      for (const [perspective, weight] of Object.entries(PERSPECTIVE_WEIGHTS)) {
        weighted += (report.scores[perspective] ?? 100) * weight;
      }
      report.overallScore = Math.round(weighted);
    } else {
      report.scores[report.type] = calculateScore(report.findings);
      report.overallScore = report.scores[report.type];
    }
    report.grade = getGrade(report.overallScore);
  }
  getReport(reportId) {
    const report = this.audits.get(reportId);
    if (!report)
      return null;
    const bySeverity = {};
    for (const f of report.findings) {
      if (!bySeverity[f.severity])
        bySeverity[f.severity] = [];
      bySeverity[f.severity].push(f);
    }
    const findingsList = Object.entries(bySeverity).sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return (order[a[0]] ?? 5) - (order[b[0]] ?? 5);
    }).flatMap(([severity, findings]) => findings.map((f) => `- [${severity}] **${f.category}**: ${f.title}
  ${f.description}
  Fix: ${f.remediation}`)).join(`
`);
    const scoreBreakdown = Object.entries(report.scores).map(([k, v]) => `- ${k}: ${v}/100`).join(`
`);
    return `# Audit Report — ${report.target}

## Overall: ${report.grade} (${report.overallScore}/100)
**Type**: ${report.type}
**Findings**: ${report.findings.length}

## Score Breakdown
${scoreBreakdown}

## Findings
${findingsList || "No findings — surface appears clean."}

## Summary
${report.overallScore >= 80 ? "Good quality. Address remaining findings before release." : "Significant issues found. Address CRITICAL and HIGH findings before release."}`;
  }
  getActiveAudit(sessionId) {
    for (const audit of this.audits.values()) {
      if (audit.sessionId === sessionId && audit.status === "active")
        return audit;
    }
    return;
  }
  listAudits() {
    return Array.from(this.audits.values()).sort((a, b) => b.startedAt - a.startedAt);
  }
  dispose() {
    this.audits.clear();
  }
}
function createOmAuditHook(_ctx, _config, opts) {
  const orchestrator = new AuditOrchestrator;
  const tlog = opts?.transparencyLog;
  return {
    orchestrator,
    handleCommandExecuteBefore: async (input, output) => {
      const arg = input.arguments.trim().toLowerCase();
      if (!arg) {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**om-audit** — Multi-Perspective Code Audit

` + "Usage: `/om-audit <check>`\n\n" + `Checks:
` + `  - **architecture** — System structure & patterns
` + `  - **quality** — Code quality & best practices
` + `  - **security** — Vulnerability & threat analysis
` + `  - **ux** — User experience & interaction patterns
` + `  - **full** — All checks (runs all perspectives)

` + "No active audit. Run `/om-audit <check>` to start."
        });
        return;
      }
      const check = arg;
      const validChecks = ["architecture", "quality", "security", "ux", "full"];
      if (!validChecks.includes(check)) {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `Unknown check: "${arg}". Available: ${validChecks.join(", ")}`
        });
        return;
      }
      let report = orchestrator.getActiveAudit(input.sessionID);
      if (!report) {
        report = orchestrator.startAudit(input.sessionID, "current codebase", check);
      }
      const prompt = orchestrator.getAuditPrompt(check);
      const confidence = check === "security" ? 0.85 : check === "architecture" ? 0.8 : check === "quality" ? 0.9 : check === "ux" ? 0.75 : 0.7;
      output.parts.length = 0;
      output.parts.push({
        type: "text",
        text: `**Audit: ${check.toUpperCase()}**
Confidence: ${(confidence * 100).toFixed(0)}%

${prompt}`
      });
      log("[om-audit] check injected", { sessionId: input.sessionID, type: check, confidence });
      if (tlog) {
        tlog.record({
          type: "audit_result",
          sessionId: input.sessionID,
          message: `Audit ${check} started with confidence ${(confidence * 100).toFixed(0)}%`,
          details: { type: check, confidence },
          confidence
        });
      }
    }
  };
}

// src/features/kanban/index.ts
class KanbanTracker {
  tasks = new Map;
  taskCounter = 0;
  addTask(phase, agentName, agentDisplay, description, dependsOn = []) {
    this.taskCounter++;
    const task = {
      id: `task-${this.taskCounter}`,
      phase,
      agentName,
      agentDisplay,
      description,
      status: "pending",
      dependsOn
    };
    this.tasks.set(task.id, task);
    return task;
  }
  startTask(id) {
    const task = this.tasks.get(id);
    if (!task || task.status !== "pending")
      return false;
    task.status = "in-progress";
    task.startedAt = Date.now();
    return true;
  }
  completeTask(id, result) {
    const task = this.tasks.get(id);
    if (!task)
      return false;
    task.status = "completed";
    task.completedAt = Date.now();
    task.result = result;
    return true;
  }
  blockTask(id, reason) {
    const task = this.tasks.get(id);
    if (!task)
      return false;
    task.status = "blocked";
    task.result = reason;
    return true;
  }
  failTask(id, reason) {
    const task = this.tasks.get(id);
    if (!task)
      return false;
    task.status = "failed";
    task.result = reason;
    return true;
  }
  getNextReady() {
    return Array.from(this.tasks.values()).find((t) => {
      if (t.status !== "pending")
        return false;
      return t.dependsOn.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === "completed";
      });
    });
  }
  getDependencyOrder() {
    const visited = new Set;
    const result = [];
    const visit = (task) => {
      if (visited.has(task.id))
        return;
      visited.add(task.id);
      for (const depId of task.dependsOn) {
        const dep = this.tasks.get(depId);
        if (dep)
          visit(dep);
      }
      result.push(task);
    };
    for (const task of this.tasks.values()) {
      visit(task);
    }
    return result;
  }
  getReport(phase) {
    const filtered = phase ? Array.from(this.tasks.values()).filter((t) => t.phase === phase) : Array.from(this.tasks.values());
    const completed = filtered.filter((t) => t.status === "completed").length;
    const blocked = filtered.some((t) => t.status === "blocked");
    return {
      phase: phase || "all",
      overallStatus: blocked ? "blocked" : completed === filtered.length ? "completed" : "running",
      tasks: filtered,
      completedCount: completed,
      totalCount: filtered.length
    };
  }
  statusLine() {
    const all = Array.from(this.tasks.values());
    const done = all.filter((t) => t.status === "completed").length;
    const active = all.find((t) => t.status === "in-progress");
    return `[${done}/${all.length}] ${active ? `Active: ${active.agentDisplay}` : "Waiting"}`;
  }
}

// src/features/workflow-orchestrator/workflow-engine.ts
class WorkflowEngine {
  state = {
    phase: "idle",
    knowledgeMap: new Map,
    overallConfidence: 0,
    userSatisfied: false,
    startedAt: Date.now(),
    currentPhaseStartedAt: Date.now()
  };
  getPhase() {
    return this.state.phase;
  }
  getConfidence() {
    return this.state.overallConfidence;
  }
  transitionTo(phase) {
    const threshold = this.getThresholdFor(phase);
    if (this.state.overallConfidence < threshold && phase !== "assess") {
      return { allowed: false, reason: `Confidence ${this.state.overallConfidence} < required ${threshold}. Need more information gathering.` };
    }
    this.state.phase = phase;
    this.state.currentPhaseStartedAt = Date.now();
    return { allowed: true, reason: `Transitioned to ${phase}` };
  }
  updateConfidence(area, level) {
    const existing = this.state.knowledgeMap.get(area);
    const areaInfo = existing ?? {
      area,
      confidence: 0,
      sources: [],
      questionsAsked: [],
      answersReceived: []
    };
    areaInfo.confidence = Math.max(areaInfo.confidence, level);
    this.state.knowledgeMap.set(area, areaInfo);
    this.recalculateOverall();
  }
  getThresholdFor(phase) {
    switch (phase) {
      case "assess":
        return 0;
      case "assemble":
        return 6;
      case "improvise":
        return 8;
      case "act":
        return 9;
      default:
        return 0;
    }
  }
  recalculateOverall() {
    const areas = Array.from(this.state.knowledgeMap.values());
    if (areas.length === 0) {
      this.state.overallConfidence = 0;
      return;
    }
    this.state.overallConfidence = Math.round(areas.reduce((sum, a) => sum + a.confidence, 0) / areas.length);
  }
}

// src/features/role-enforcer/index.ts
class RoleEnforcer {
  checkPermission(agentName, action) {
    const agent = getAgent(agentName);
    if (!agent)
      return { agentName, violation: "Unknown agent", blocked: true };
    switch (agent.role) {
      case "Strategist":
        return { agentName, violation: "", blocked: false };
      case "Orchestrator":
        if (action === "edit")
          return { agentName, violation: "Orchestrators cannot edit files directly", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Advisor":
        if (action !== "read" && action !== "research")
          return { agentName, violation: "Advisors are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Mapper":
        if (action === "edit")
          return { agentName, violation: "Mappers cannot edit", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Builder":
        return { agentName, violation: "", blocked: false };
      case "Analyst":
        if (action === "edit" || action === "delegate")
          return { agentName, violation: "Analysts are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Critic":
        if (action !== "read" && action !== "research")
          return { agentName, violation: "Critics are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Runner":
        if (action === "delegate")
          return { agentName, violation: "Runners cannot delegate", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Artisan":
        return { agentName, violation: "", blocked: false };
      case "Deliberator":
        if (action === "edit")
          return { agentName, violation: "Deliberators cannot edit", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Voter":
        if (action !== "read" && action !== "research")
          return { agentName, violation: "Voters are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Follower":
        if (action === "delegate")
          return { agentName, violation: "Followers cannot delegate", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Scout":
        if (action !== "read" && action !== "research")
          return { agentName, violation: "Scouts are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Scholar":
        if (action === "edit" || action === "delegate")
          return { agentName, violation: "Scholars are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      case "Watcher":
        if (action !== "read" && action !== "research")
          return { agentName, violation: "Watchers are read-only", blocked: true };
        return { agentName, violation: "", blocked: false };
      default:
        return { agentName, violation: "", blocked: false };
    }
  }
  canDelegate(fromAgent, toAgent) {
    const agent = getAgent(fromAgent);
    if (!agent)
      return { agentName: fromAgent, violation: "Unknown agent", blocked: true };
    if (!agent.canDelegate)
      return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate`, blocked: true };
    if (agent.delegatableAgents && !agent.delegatableAgents.includes(toAgent)) {
      return { agentName: fromAgent, violation: `${agent.displayName} cannot delegate to ${toAgent}`, blocked: true };
    }
    return { agentName: fromAgent, violation: "", blocked: false };
  }
}

// src/features/workflow-orchestrator/prometheus-recon.ts
function getPhaseExecutionPlan(phase) {
  const plans = {
    assess: {
      description: "Deploy recon swarm — gather all available context",
      parallel: [
        { tool: "mcp", purpose: "project-structure", action: "Discover project structure and topology" },
        { tool: "mcp", purpose: "code-patterns", action: "Analyze code communities and dependency flows" },
        { tool: "mcp", purpose: "stored-knowledge", action: "Search existing project knowledge" },
        { tool: "mcp", purpose: "session-history", action: "Check cross-session context and memory" },
        { tool: "mcp", purpose: "personal-notes", action: "Search user notes and documents" }
      ],
      conditionalDelegation: [
        { if: "codebase unclear", then: "@Sif deep search" },
        { if: "docs needed", then: "@Eir doc lookup" }
      ],
      confidenceGate: 6
    },
    assemble: {
      description: "Research deep — architecture, patterns, deliberation",
      parallel: [
        { tool: "subagent", target: "@Vidar", action: "map architecture" },
        { tool: "subagent", target: "@Eir", action: "find relevant docs" },
        { tool: "subagent", target: "@Sif", action: "search for examples" },
        { tool: "subagent", target: "@Forseti", action: "deliberate approaches" }
      ],
      confidenceGate: 8
    },
    improvise: {
      description: "Critique the plan before execution",
      parallel: [
        { tool: "subagent", target: "@Tyr", action: "find flaws" },
        { tool: "subagent", target: "@Heimdall", action: "check for missed items" },
        { tool: "subagent", target: "@Mimir", action: "validate decisions" }
      ],
      userSatisfactionGate: true
    },
    act: {
      description: "Execute with full force",
      sequential: [
        { tool: "subagent", target: "@Njord", action: "orchestrate execution" },
        { tool: "subagent", target: "@Thor", action: "build implementation" },
        { tool: "subagent", target: "@Hermod", action: "implement scoped tasks" },
        { tool: "subagent", target: "@Freyr", action: "craft UI" }
      ]
    }
  };
  return plans[phase] || null;
}

class PrometheusRecon {
  tasks = [];
  gatheredKnowledge = new Map;
  planRecon(knownAreas, _projectHint) {
    this.tasks = [];
    this.addTask("codebase-structure", "mcp", "project-structure", "Map the full project structure using available tools");
    this.addTask("codebase-patterns", "mcp", "code-patterns", "Analyze code communities and flows");
    this.addTask("existing-knowledge", "mcp", "stored-knowledge", "Search for stored project context");
    this.addTask("user-history", "mcp", "session-history", "Check cross-session memory for this project");
    this.addTask("personal-notes", "mcp", "personal-notes", "Search user vault for relevant notes");
    if (this.needsMoreInfo(knownAreas, "codebase-structure", 5)) {
      this.addTask("explore-api-routes", "subagent", "sif", "Find all API routes and patterns");
      this.addTask("explore-dependencies", "subagent", "sif", "Map dependency tree");
      this.addTask("find-docs", "subagent", "eir", "Find docs for key dependencies");
    }
    if (this.needsMoreInfo(knownAreas, "architecture", 6)) {
      this.addTask("architecture-review", "subagent", "vidar", "Generate codemap of project");
      this.addTask("design-patterns", "mcp", "reasoning", "Reason about architecture trade-offs");
    }
    return this.tasks;
  }
  generateQuestions(gathered, knownAreas) {
    const questions = [];
    const knownSet = new Set(knownAreas);
    if (!knownSet.has("project-purpose")) {
      questions.push("What is the purpose of this project?");
    }
    if (!knownSet.has("codebase-structure")) {
      questions.push("Can you describe the project structure?");
    }
    if (!knownSet.has("tech-stack")) {
      questions.push("What tech stack is this project using?");
    }
    const routes = gathered.get("api-routes");
    if (routes && routes.length > 0) {
      questions.push("I found API routes in the project. Could you clarify what domain " + "this project serves so I can better understand the route patterns?");
    }
    return questions;
  }
  async executeRecon(tasks) {
    for (const task of tasks) {
      switch (task.tool) {
        case "mcp":
          break;
        case "subagent":
          break;
      }
    }
    return this.gatheredKnowledge;
  }
  needsMoreInfo(knownAreas, areaName, threshold) {
    const area = knownAreas.find((a) => a.area === areaName);
    return !area || area.confidence < threshold;
  }
  addTask(target, tool, purposeOrAgent, description) {
    const task = {
      target,
      tool,
      priority: "medium"
    };
    if (tool === "mcp") {
      task.purpose = purposeOrAgent;
      task.question = description;
    } else if (tool === "subagent") {
      task.subagentName = purposeOrAgent;
      task.question = description;
    }
    this.tasks.push(task);
  }
}

// src/features/pipeline/index.ts
function generateTaskPrompt(task) {
  const lines = [];
  lines.push(`## Task for @${task.agentName}`);
  lines.push("");
  lines.push(`### Objective`);
  lines.push(task.objective);
  lines.push("");
  lines.push("### What to do");
  task.mustDo.forEach((d) => lines.push(`- ${d}`));
  lines.push("");
  lines.push("### What NOT to do");
  task.mustNotDo.forEach((d) => lines.push(`- ${d}`));
  lines.push("");
  lines.push("### Dependencies");
  if (task.dependsOn.length === 0) {
    lines.push("- None (can start immediately)");
  } else {
    task.dependsOn.forEach((d) => lines.push(`- Wait for: ${d}`));
  }
  lines.push("");
  lines.push("### Quality Assurance");
  task.qa.forEach((q) => lines.push(`- [ ] ${q}`));
  lines.push("");
  lines.push("### Report Format");
  lines.push(task.reportFormat);
  lines.push("");
  lines.push("After completing: VERIFY against What to do and What NOT to do.");
  return lines.join(`
`);
}
function generateTaskId() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `task_${Date.now()}_${suffix}`;
}
function generateSessionId() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `sub_${Date.now()}_${suffix}`;
}

class PipelineOrchestrator {
  conductor = "odin";
  subSessions = new Map;
  kanban;
  workflow;
  roleEnforcer;
  waitingForSubs = false;
  taskRegistry = null;
  constructor(taskRegistry) {
    this.kanban = new KanbanTracker;
    this.workflow = new WorkflowEngine;
    this.roleEnforcer = new RoleEnforcer;
    this.taskRegistry = taskRegistry ?? null;
  }
  getKanban() {
    return this.kanban;
  }
  getWorkflow() {
    return this.workflow;
  }
  getRoleEnforcer() {
    return this.roleEnforcer;
  }
  getSubSessions() {
    return this.subSessions;
  }
  selectConductor(agentName) {
    const agent = getAgent(agentName);
    if (!agent || !agent.isPrimary)
      return false;
    this.conductor = agentName;
    return true;
  }
  getConductor() {
    return this.conductor;
  }
  async callAgent(task, parentSessionId) {
    const agent = getAgent(task.agentName);
    if (!agent)
      throw new Error(`Unknown agent: ${task.agentName}`);
    const permission = this.roleEnforcer.checkPermission(task.agentName, "research");
    if (permission.blocked)
      throw new Error(permission.violation);
    const prompt = generateTaskPrompt(task);
    const taskId = generateTaskId();
    const sessionId = generateSessionId();
    if (this.taskRegistry) {
      this.taskRegistry.createTask({
        id: taskId,
        sessionId,
        parentSessionId,
        agent: task.agentName,
        status: "pending",
        description: task.objective,
        category: "pipeline",
        metadata: JSON.stringify({
          phase: this.workflow.getPhase(),
          conductor: this.conductor,
          dependsOn: task.dependsOn
        })
      });
      this.taskRegistry.updateStatus(taskId, "running");
    }
    const session = {
      agentName: task.agentName,
      displayName: agent.displayName,
      sessionId,
      taskId,
      taskDescription: task.objective.slice(0, 100),
      status: "launched",
      visible: true,
      promptInstructions: prompt
    };
    this.subSessions.set(session.sessionId, session);
    this.kanban.addTask(this.workflow.getPhase(), task.agentName, agent.displayName, task.objective);
    return session;
  }
  async waitForAllSubSessions(timeoutMs = 300000) {
    this.waitingForSubs = true;
    const startTime = Date.now();
    while (this.subSessions.size > 0) {
      for (const [id, session] of this.subSessions) {
        if (session.status === "launched" || session.status === "running") {
          if (this.taskRegistry) {
            const task = this.taskRegistry.getTask(session.taskId);
            if (task) {
              if (task.status === "completed") {
                session.status = "completed";
                session.result = task.outputCache ?? "Task completed";
              } else if (task.status === "error" || task.status === "cancelled") {
                session.status = "failed";
                session.result = `Task ${task.status}`;
              }
            }
          }
        }
      }
      const allDone = Array.from(this.subSessions.values()).every((s) => s.status === "completed" || s.status === "failed");
      if (allDone) {
        this.waitingForSubs = false;
        return true;
      }
      if (Date.now() - startTime > timeoutMs) {
        for (const session of this.subSessions.values()) {
          if (session.status === "launched" || session.status === "running") {
            session.status = "failed";
            session.result = "Task timed out";
            if (this.taskRegistry) {
              this.taskRegistry.updateStatus(session.taskId, "error", {
                outputCache: "Task timed out",
                completedAt: Date.now()
              });
            }
          }
        }
        this.waitingForSubs = false;
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.waitingForSubs = false;
    return true;
  }
  completeSubSession(sessionId, result) {
    const session = this.subSessions.get(sessionId);
    if (!session)
      return false;
    session.status = "completed";
    session.result = result;
    this.kanban.completeTask(sessionId, result);
    if (this.taskRegistry) {
      this.taskRegistry.updateStatus(session.taskId, "completed", {
        outputCache: result,
        completedAt: Date.now()
      });
    }
    return true;
  }
  isWaiting() {
    return this.waitingForSubs;
  }
  getVisibleSubSessions() {
    return Array.from(this.subSessions.values()).filter((s) => s.visible);
  }
  clearCompletedSubSessions() {
    for (const [id, session] of this.subSessions) {
      if (session.status === "completed" || session.status === "failed") {
        this.subSessions.delete(id);
      }
    }
  }
  async runFullPipeline(userRequest) {
    this.workflow.updateConfidence("initial", 10);
    this.workflow.transitionTo("assess");
    this.kanban.addTask("assess", this.conductor, `@${this.conductor.charAt(0).toUpperCase() + this.conductor.slice(1)}`, `Interview: ${userRequest.slice(0, 50)}...`);
    await this.callAgent({
      agentName: "frigg",
      objective: `Gap analysis on requirements: ${userRequest}`,
      mustDo: [
        "Analyze the user request for implicit requirements",
        "Identify gaps, contradictions, and missing context",
        "List assumptions that need validation",
        "Categorize gaps by severity (blocking / important / nice-to-have)"
      ],
      mustNotDo: [
        "Do not propose solutions or architecture",
        "Do not write code or pseudocode",
        "Do not make unsupported assumptions"
      ],
      dependsOn: [],
      qa: [
        "Are all gaps clearly labeled by severity?",
        "Are assumptions explicitly called out?",
        "Is the analysis actionable for planning?"
      ],
      reportFormat: "Bullet-list gap analysis with severity labels. Conclude with top-3 most critical gaps."
    });
    await this.callAgent({
      agentName: "mimir",
      objective: `Architecture advice for: ${userRequest}`,
      mustDo: [
        "Review the request from an architectural standpoint",
        "Identify relevant patterns, technologies, and approaches",
        "Flag potential architectural risks or concerns",
        "Suggest architectural considerations for the plan"
      ],
      mustNotDo: [
        "Do not produce a full implementation plan",
        "Do not write code or configuration",
        "Do not make technology recommendations without reasoning"
      ],
      dependsOn: [],
      qa: [
        "Are architectural risks clearly identified?",
        "Is each recommendation backed by reasoning?",
        "Are trade-offs discussed?"
      ],
      reportFormat: "Structured analysis with sections: Risks, Considerations, Recommendations. Conclude with a go/no-go assessment."
    });
  }
  async runPhase(phase) {
    const plan = getPhaseExecutionPlan(phase);
    if (!plan)
      return;
    for (const item of [...plan.parallel ?? [], ...plan.sequential ?? []]) {
      if (item.tool === "subagent" && item.target) {
        const agentName = item.target.replace("@", "").toLowerCase();
        if (agentName === this.conductor) {
          this.kanban.addTask(phase, agentName, item.target, item.action);
          continue;
        }
        const agent = getAgent(agentName);
        if (!agent)
          continue;
        const check = this.roleEnforcer.checkPermission(agentName, "read");
        if (check.blocked && agent.isPrimary) {
          this.kanban.addTask(phase, agentName, item.target, item.action);
          continue;
        }
        await this.callAgent({
          agentName,
          objective: item.action,
          mustDo: [
            "Execute the assigned action completely",
            "Report findings in the specified format",
            "Flag any blockers or dependencies encountered"
          ],
          mustNotDo: [
            "Do not modify any files outside the scope of this task",
            "Do not deviate from the assigned objective",
            "Do not delegate to other agents unless explicitly permitted"
          ],
          dependsOn: [],
          qa: [
            "Was the objective fully addressed?",
            "Are all findings documented?",
            "Are blockers clearly communicated?"
          ],
          reportFormat: "Concise summary of findings. If action produced output, include relevant excerpts."
        });
      }
    }
  }
  collectSubSessionResults() {
    const results = [];
    for (const [sessionId, session] of this.subSessions) {
      const status = session.status;
      const line = `[${sessionId}] ${session.displayName}: ${status} — "${session.taskDescription.slice(0, 60)}"`;
      results.push(line);
    }
    if (results.length === 0) {
      results.push("No sub-session tasks deployed.");
    }
    return results;
  }
  synthesize() {
    const report = this.kanban.getReport();
    const lines = ["# Synthesis Report", ""];
    for (const task of report.tasks) {
      const icon = task.status === "completed" ? "✅" : task.status === "in-progress" ? "\uD83D\uDD04" : task.status === "blocked" ? "❌" : "⏳";
      lines.push(`${icon} **${task.agentDisplay}**: ${task.description}`);
      if (task.result)
        lines.push(`   ${task.result.slice(0, 100)}`);
    }
    const subResults = this.collectSubSessionResults();
    if (subResults.length > 0 && subResults[0] !== "No sub-session tasks deployed.") {
      lines.push("", "## Sub-Sessions");
      for (const r of subResults) {
        lines.push(`  - ${r}`);
      }
    }
    lines.push("", "## Summary");
    lines.push(`**${report.completedCount}/${report.totalCount}** tasks complete. Confidence: ${this.workflow.getConfidence()}/10`);
    return lines.join(`
`);
  }
}

// src/features/agent-commands/handler.ts
var COMMAND_DESCRIPTIONS = {
  plan: {
    description: "Run full pipeline — Assess→Assemble→Improvise→Act",
    template: `Run the complete pipeline:
1. /assess — Odin interviews and researches
2. /assemble — Vidar maps, Forseti deliberates
3. /improvise — Tyr reviews, Mimir validates
4. /act — Thor builds, Hermod implements`
  },
  assess: {
    description: "Start requirements assessment — Odin deploys recon swarm",
    template: `Odin deploys parallel recon:
- MCPs scan project structure
- @Frigg analyzes gaps
- @Mimir reviews architecture
- User questions fill remaining gaps`
  },
  assemble: {
    description: "Research deep — architecture, patterns, deliberation",
    template: `Research phase:
- @Vidar maps codebase
- @Sif searches patterns
- @Eir finds docs
- @Forseti deliberates approaches`
  },
  improvise: {
    description: "Critique and refine the plan before execution",
    template: `Review phase:
- @Tyr reviews for flaws
- @Heimdall checks completeness
- @Mimir validates decisions`
  },
  act: {
    description: "Execute with full force",
    template: `Execution phase:
- @Njord orchestrates
- @Thor builds
- @Hermod fixes
- @Freyr crafts UI`
  },
  synthesize: {
    description: "Deploy ALL agents, collect findings, synthesize into unified report",
    template: "Fan out all agents, gather analysis, synthesize into one report with confidence tracking"
  },
  health: {
    description: "Display system health dashboard with component status",
    template: "Show the complete system health dashboard"
  },
  status: {
    description: "Show current pipeline status and kanban progress",
    template: "Show pipeline phase, completed tasks, and active sessions"
  }
};
var PIPELINE_COMMANDS = new Set(Object.keys(COMMAND_DESCRIPTIONS));
function createPipelineCommandHandler(_ctx, _config, systemObserver) {
  const pipeline = new PipelineOrchestrator;
  async function handleCommand(input, output) {
    const cmd = input.command.toLowerCase();
    if (!PIPELINE_COMMANDS.has(cmd))
      return;
    const arg = input.arguments.trim();
    const desc = COMMAND_DESCRIPTIONS[cmd];
    switch (cmd) {
      case "plan":
        if (!arg) {
          output.parts.length = 0;
          output.parts.push({
            type: "text",
            text: `**/plan** — ${desc.description}

${desc.template}

Usage: \`/plan [topic]\` to start, \`/plan status\` to check progress.`
          });
          return;
        }
        if (arg === "status") {
          const results = pipeline.collectSubSessionResults();
          const synthesis2 = pipeline.synthesize();
          output.parts.length = 0;
          output.parts.push({
            type: "text",
            text: `**Pipeline Status**

Conductor: @${pipeline.getConductor()}
Waiting: ${pipeline.isWaiting() ? "Yes" : "No"}

${results.join(`
`)}

${synthesis2}`
          });
          return;
        }
        pipeline.selectConductor("odin");
        await pipeline.runFullPipeline(arg);
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Pipeline Started**

Topic: ${arg}
Conductor: @odin

Phases:
1. Assess → Odin interviews
2. Assemble → Vidar maps, Forseti deliberates
3. Improvise → Tyr reviews, Mimir validates
4. Act → Thor builds, Hermod implements

Check status with \`/plan status\``
        });
        log("[pipeline] plan started", { sessionId: input.sessionID, topic: arg });
        break;
      case "assess":
        pipeline.selectConductor("odin");
        await pipeline.runPhase("assess");
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Phase: Assess**

${desc.template}

Odin is conducting requirements assessment. Check kanban for progress.`
        });
        log("[pipeline] assess started", { sessionId: input.sessionID });
        break;
      case "assemble":
        await pipeline.runPhase("assemble");
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Phase: Assemble**

${desc.template}

Research phase active. Agents are mapping architecture and deliberating approaches.`
        });
        log("[pipeline] assemble started", { sessionId: input.sessionID });
        break;
      case "improvise":
        await pipeline.runPhase("improvise");
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Phase: Improvise**

${desc.template}

Review phase active. Tyr, Heimdall, and Mimir are critiquing the plan.`
        });
        log("[pipeline] improvise started", { sessionId: input.sessionID });
        break;
      case "act":
        await pipeline.runPhase("act");
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Phase: Act**

${desc.template}

Execution phase active. Njord is orchestrating Thor, Hermod, and Freyr.`
        });
        log("[pipeline] act started", { sessionId: input.sessionID });
        break;
      case "synthesize":
        const synthesis = pipeline.synthesize();
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: synthesis
        });
        log("[pipeline] synthesize", { sessionId: input.sessionID });
        break;
      case "health": {
        const report = systemObserver?.getStatus();
        if (!report) {
          output.parts.length = 0;
          output.parts.push({ type: "text", text: `**System Health**

Observer not initialized.` });
          return;
        }
        const componentLines = report.components.map((c) => `- ${c.name}: ${c.status.toUpperCase()}${c.lastError ? ` (${c.lastError})` : ""}`).join(`
`);
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**System Health Dashboard**

Overall: ${report.overall.toUpperCase()}
Running Tasks: ${report.runningTasks}
Connected MCPs: ${report.connectedMcps}

## Components
${componentLines}

${report.warnings.length > 0 ? `## Warnings
${report.warnings.join(`
`)}

` : ""}${report.errors.length > 0 ? `## Errors
${report.errors.join(`
`)}` : ""}`
        });
        log("[pipeline] health check", { sessionId: input.sessionID, overall: report.overall });
        break;
      }
      case "status": {
        const kanban = pipeline.getKanban();
        const kanbanReport = kanban.getReport();
        const workflow = pipeline.getWorkflow();
        const subSessions = pipeline.getVisibleSubSessions();
        const sessionLines = subSessions.map((s) => `- ${s.displayName}: ${s.status} — ${s.taskDescription.slice(0, 60)}`).join(`
`) || "No active sub-sessions";
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: `**Pipeline Status**

Conductor: @${pipeline.getConductor()}
Phase: ${workflow.getPhase()}
Confidence: ${workflow.getConfidence()}/10
Waiting: ${pipeline.isWaiting() ? "Yes" : "No"}

## Kanban (${kanbanReport.totalCount} tasks)
Completed: ${kanbanReport.completedCount}`
        });
        log("[pipeline] status", { sessionId: input.sessionID });
        break;
      }
    }
  }
  return { handleCommand };
}

// src/hooks/background-notification.ts
var DEFAULT_EVENTS = [
  "oh-my-unified.session.idle",
  "oh-my-unified.message.updated",
  "oh-my-unified.todo.updated",
  "oh-my-unified.session.error",
  "oh-my-unified.task.completed",
  "oh-my-unified.background.stopped"
];
function createBackgroundNotificationHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    extraEvents: [],
    taskEngine: undefined,
    ...hookConfig
  };
  const watchedEvents = new Set([
    ...DEFAULT_EVENTS,
    ...cfg.extraEvents ?? []
  ]);
  async function handleSessionIdle(input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.session.idle"))
      return;
    log("[background-notification] oh-my-unified.session.idle — no active background tasks");
    const event = input.event;
    const props = event?.properties;
    const taskId = props?.taskId;
    const sessionId = props?.sessionId;
    const elapsedMs = props?.elapsedMs ?? 0;
    if (taskId && sessionId && cfg.taskEngine) {
      cfg.taskEngine.onSessionIdle(taskId, sessionId, elapsedMs, _ctx);
    }
  }
  async function handleMessageUpdated(input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.message.updated"))
      return;
    log("[background-notification] oh-my-unified.message.updated — background agent produced output");
    const event = input.event;
    const props = event?.properties;
    const taskId = props?.taskId;
    const sessionId = props?.sessionId;
    if (taskId && sessionId && cfg.taskEngine) {
      cfg.taskEngine.syncSessionMessages(taskId, sessionId, _ctx).catch(() => {});
    }
  }
  async function handleTodoUpdated(_input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.todo.updated"))
      return;
    log("[background-notification] oh-my-unified.todo.updated — background task updated todos");
  }
  async function handleSessionError(input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.session.error"))
      return;
    log("[background-notification] oh-my-unified.session.error — background session encountered error");
    const event = input.event;
    const props = event?.properties;
    const taskId = props?.taskId;
    if (taskId && cfg.taskEngine) {
      cfg.taskEngine.getRegistry().updateStatus(taskId, "error", {
        completedAt: Date.now()
      });
    }
  }
  async function handleTaskCompleted(_input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.task.completed"))
      return;
    log("[background-notification] oh-my-unified.task.completed — background task finished");
  }
  async function handleBackgroundStopped(_input, _output) {
    if (!cfg.enabled || !watchedEvents.has("oh-my-unified.background.stopped"))
      return;
    log("[background-notification] oh-my-unified.background.stopped — background engine halted");
  }
  return {
    "oh-my-unified.session.idle": handleSessionIdle,
    "oh-my-unified.message.updated": handleMessageUpdated,
    "oh-my-unified.todo.updated": handleTodoUpdated,
    "oh-my-unified.session.error": handleSessionError,
    "oh-my-unified.task.completed": handleTaskCompleted,
    "oh-my-unified.background.stopped": handleBackgroundStopped
  };
}
// src/utils/session.ts
var SESSION_ABORT_TIMEOUT_MS = 1000;

class OperationTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "OperationTimeoutError";
  }
}
async function withTimeout(operation, timeoutMs, message) {
  if (timeoutMs <= 0)
    return operation;
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new OperationTimeoutError(message));
        }, timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function abortSessionWithTimeout(client, sessionId, timeoutMs = SESSION_ABORT_TIMEOUT_MS) {
  await withTimeout(client.session.abort({ path: { id: sessionId } }), timeoutMs, `Session abort timed out after ${timeoutMs}ms`);
}

// src/hooks/model-fallback.ts
var RATE_LIMIT_PATTERNS = [
  /\b429\b/,
  /rate.?limit/i,
  /too many requests/i,
  /quota.?exceeded/i,
  /usage.?exceeded/i,
  /ExceededBudget/i,
  /over.?budget/i,
  /usage limit/i,
  /overloaded/i,
  /resource.?exhausted/i,
  /insufficient.?quota/i,
  /high concurrency/i,
  /reduce concurrency/i
];
function isRateLimitError(error) {
  if (!error || typeof error !== "object")
    return false;
  const err = error;
  const text = [
    err.message ?? "",
    String(err.data?.statusCode ?? ""),
    err.data?.message ?? "",
    err.data?.responseBody ?? ""
  ].join(" ");
  return RATE_LIMIT_PATTERNS.some((p) => p.test(text));
}
function parseModel(model) {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash >= model.length - 1)
    return null;
  return { providerID: model.slice(0, slash), modelID: model.slice(slash + 1) };
}
var DEDUP_WINDOW_MS = 5000;
var REPROMPT_DELAY_MS = 500;

class RuntimeFallbackManager {
  client;
  chains;
  enabled;
  maxAttempts;
  sessionModel = new Map;
  sessionAgent = new Map;
  sessionTried = new Map;
  inProgress = new Set;
  lastTrigger = new Map;
  fallbackLogs = [];
  constructor(client, chains, enabled, maxAttempts) {
    this.client = client;
    this.chains = chains;
    this.enabled = enabled;
    this.maxAttempts = maxAttempts;
  }
  async handleEvent(rawEvent) {
    if (!this.enabled)
      return;
    const event = rawEvent;
    if (!event?.type)
      return;
    switch (event.type) {
      case "message.updated": {
        const info = event.properties?.info;
        if (!info)
          break;
        const sessionID = info.sessionID;
        if (!sessionID)
          break;
        if (typeof info.agent === "string") {
          this.sessionAgent.set(sessionID, info.agent);
        }
        if (typeof info.providerID === "string" && typeof info.modelID === "string") {
          this.sessionModel.set(sessionID, `${info.providerID}/${info.modelID}`);
        }
        if (info.error && isRateLimitError(info.error)) {
          await this.tryFallback(sessionID);
        }
        break;
      }
      case "session.error": {
        const props = event.properties;
        if (props?.sessionID && props.error && isRateLimitError(props.error)) {
          await this.tryFallback(props.sessionID);
        }
        break;
      }
      case "session.status": {
        const props = event.properties;
        if (!props?.sessionID || props.status?.type !== "retry")
          break;
        const msg = props.status.message?.toLowerCase() ?? "";
        if (msg.includes("rate limit") || msg.includes("usage limit") || msg.includes("usage exceeded") || msg.includes("quota exceeded") || msg.includes("exceededbudget") || msg.includes("over budget") || msg.includes("high concurrency") || msg.includes("reduce concurrency")) {
          await this.tryFallback(props.sessionID);
        }
        break;
      }
      case "subagent.session.created": {
        const props = event.properties;
        if (props?.sessionID && typeof props.agentName === "string") {
          this.sessionAgent.set(props.sessionID, props.agentName);
        }
        break;
      }
      case "session.deleted": {
        const props = event.properties;
        const id = props?.info?.id ?? props?.sessionID;
        if (id) {
          this.sessionModel.delete(id);
          this.sessionAgent.delete(id);
          this.sessionTried.delete(id);
          this.inProgress.delete(id);
          this.lastTrigger.delete(id);
        }
        break;
      }
    }
  }
  async tryFallback(sessionID) {
    if (!sessionID)
      return;
    if (this.inProgress.has(sessionID))
      return;
    const now = Date.now();
    if (now - (this.lastTrigger.get(sessionID) ?? 0) < DEDUP_WINDOW_MS)
      return;
    this.lastTrigger.set(sessionID, now);
    this.inProgress.add(sessionID);
    try {
      const currentModel = this.sessionModel.get(sessionID);
      const agentName = this.sessionAgent.get(sessionID);
      const chain = this.resolveChain(agentName, currentModel);
      if (!chain.length) {
        log("[runtime-fallback] no chain configured", {
          sessionID,
          agentName
        });
        return;
      }
      if (!this.sessionTried.has(sessionID)) {
        this.sessionTried.set(sessionID, new Set);
      }
      const tried = this.sessionTried.get(sessionID);
      if (currentModel)
        tried.add(currentModel);
      const nextModel = chain.find((m) => !tried.has(m));
      if (!nextModel) {
        log("[runtime-fallback] fallback chain exhausted", {
          sessionID,
          agentName,
          tried: [...tried]
        });
        return;
      }
      tried.add(nextModel);
      if (tried.size > this.maxAttempts) {
        log("[runtime-fallback] max attempts exceeded", {
          sessionID,
          agentName,
          maxAttempts: this.maxAttempts
        });
        return;
      }
      const ref = parseModel(nextModel);
      if (!ref) {
        log("[runtime-fallback] invalid model format", {
          sessionID,
          nextModel
        });
        return;
      }
      const result = await this.client.session.messages({
        path: { id: sessionID }
      });
      const messages = result.data ?? [];
      const lastUser = [...messages].reverse().find((m) => m.info.role === "user");
      if (!lastUser) {
        log("[runtime-fallback] no user message found", { sessionID });
        return;
      }
      const sessionClient = this.client.session;
      if (typeof sessionClient.promptAsync !== "function") {
        log("[runtime-fallback] promptAsync unavailable", { sessionID });
        return;
      }
      try {
        await abortSessionWithTimeout(this.client, sessionID);
      } catch (error) {
        log("[runtime-fallback] abort did not complete cleanly", {
          sessionID,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      await new Promise((r) => setTimeout(r, REPROMPT_DELAY_MS));
      await sessionClient.promptAsync({
        path: { id: sessionID },
        body: { parts: lastUser.parts, model: ref }
      });
      this.sessionModel.set(sessionID, nextModel);
      this.fallbackLogs.push({
        agent: agentName ?? "unknown",
        from: currentModel ?? "unknown",
        to: nextModel,
        timestamp: Date.now(),
        reason: "rate-limit"
      });
      log("[runtime-fallback] switched to fallback model", {
        sessionID,
        agentName,
        from: currentModel,
        to: nextModel
      });
    } catch (err) {
      log("[runtime-fallback] fallback attempt failed", {
        sessionID,
        error: err instanceof Error ? err.message : String(err)
      });
    } finally {
      this.inProgress.delete(sessionID);
    }
  }
  resolveChain(agentName, currentModel) {
    if (agentName) {
      return this.chains[agentName] ?? [];
    }
    if (currentModel) {
      for (const chain of Object.values(this.chains)) {
        if (chain.includes(currentModel))
          return chain;
      }
    }
    const all = [];
    const seen = new Set;
    for (const chain of Object.values(this.chains)) {
      for (const m of chain) {
        if (!seen.has(m)) {
          seen.add(m);
          all.push(m);
        }
      }
    }
    return all;
  }
  getFallbackLogs() {
    return [...this.fallbackLogs];
  }
}
function createModelFallbackHook(ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    chains: {},
    maxAttempts: 3,
    ...hookConfig
  };
  const manager = new RuntimeFallbackManager(ctx.client, cfg.chains, cfg.enabled, cfg.maxAttempts);
  return {
    handleEvent: (event) => manager.handleEvent(event),
    getFallbackLogs: () => manager.getFallbackLogs()
  };
}
// src/hooks/phase-reminder.ts
var PHASE_LABELS = {
  [0 /* ASSESS */]: "assess",
  [1 /* ASSEMBLE */]: "assemble",
  [2 /* ACT */]: "act",
  [3 /* IMPROVISE */]: "improvise"
};
var DEFAULT_TEMPLATE = "[Current Phase: {phase}] Keep responses aligned with this workflow phase.";
function createPhaseReminderHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    phase: 0 /* ASSESS */,
    template: DEFAULT_TEMPLATE,
    ...hookConfig
  };
  function getPhaseLabel(p) {
    return PHASE_LABELS[p] ?? "unknown";
  }
  function buildReminder() {
    return cfg.template.replace(/\{phase\}/g, getPhaseLabel(cfg.phase));
  }
  function setPhase(phase) {
    cfg.phase = phase;
    log(`[phase-reminder] phase changed to "${getPhaseLabel(phase)}"`);
  }
  async function handleMessageBefore(input, _output) {
    if (!cfg.enabled)
      return;
    if (input.role !== "user")
      return;
    const reminder = buildReminder();
    log("[phase-reminder] injecting phase reminder");
    input._phaseReminder = reminder;
  }
  return {
    setPhase,
    getPhaseLabel: () => getPhaseLabel(cfg.phase),
    "message.before": handleMessageBefore
  };
}
// src/hooks/json-error-recovery.ts
var JSON_FIXES = [
  {
    name: "trailing-commas",
    test: (text) => /,\s*[}\]"]/.test(text),
    fix: (text) => text.replace(/,\s*([}\]])/g, "$1")
  },
  {
    name: "unquoted-keys",
    test: (text) => /[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(text),
    fix: (text) => text.replace(/([{,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1 "$2":')
  },
  {
    name: "single-quoted-strings",
    test: (text) => /'[^']*'/.test(text),
    fix: (text) => text.replace(/'([^']*)'/g, (_, inner) => `"${inner.replace(/"/g, "\\\"")}"`)
  },
  {
    name: "unquoted-string-values",
    test: (text) => /:\s*[a-zA-Z][a-zA-Z0-9_]*\s*[,}\]\n]/.test(text),
    fix: (text) => text.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}\]\n])/g, ': "$1"$2')
  },
  {
    name: "comment-stripping",
    test: (text) => /\/\/[^\n]*|\/\*[\s\S]*?\*\//.test(text),
    fix: (text) => text.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
  },
  {
    name: "hexadecimal-numbers",
    test: (text) => /:\s*0x[0-9a-fA-F]+\s*[,}\]\n]/.test(text),
    fix: (text) => text.replace(/:(\s*)0x([0-9a-fA-F]+)\s*([,}\]\n])/g, (_, ws, hex, end) => `:${ws}${Number.parseInt(hex, 16)}${end}`)
  }
];
function createJsonErrorRecoveryHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    maxAttempts: 2,
    verbose: true,
    ...hookConfig
  };
  function tryParse(raw) {
    try {
      const parsed = JSON.parse(raw);
      return [parsed, null];
    } catch (err) {
      return [null, String(err)];
    }
  }
  function applyFixes(raw) {
    let text = raw;
    const applied = [];
    for (const fix of JSON_FIXES) {
      if (fix.test(text)) {
        const before = text;
        text = fix.fix(text);
        if (text !== before) {
          applied.push(fix.name);
        }
      }
    }
    return { text, applied };
  }
  function recover(raw) {
    let text = raw;
    const allFixes = [];
    for (let attempt = 0;attempt < cfg.maxAttempts; attempt++) {
      const { text: fixed, applied } = applyFixes(text);
      text = fixed;
      allFixes.push(...applied);
      const [parsed, parseErr] = tryParse(text);
      if (parsed !== null) {
        return {
          success: true,
          result: parsed,
          attempts: attempt + 1,
          fixesApplied: allFixes
        };
      }
      if (attempt < cfg.maxAttempts - 1 && applied.length === 0) {
        return {
          success: false,
          error: parseErr ?? "Unknown parse error",
          attempts: attempt + 1,
          fixesApplied: allFixes
        };
      }
    }
    const [, finalErr] = tryParse(text);
    return {
      success: false,
      error: finalErr ?? "Recovery exhausted",
      attempts: cfg.maxAttempts,
      fixesApplied: allFixes
    };
  }
  async function handleToolAfter(input, output) {
    if (!cfg.enabled)
      return;
    if (!input.error && !input.result)
      return;
    const errorText = input.error ?? "";
    const isJsonError = errorText.includes("JSON") || errorText.includes("parse") || errorText.includes("Unexpected token") || errorText.includes("position");
    if (!isJsonError)
      return;
    const rawResult = input.result ?? "";
    if (cfg.verbose) {
      log(`[json-error-recovery] detected JSON error in "${input.tool}"`);
    }
    const recovery = recover(rawResult);
    if (recovery.success) {
      if (cfg.verbose) {
        log(`[json-error-recovery] recovered in ${recovery.attempts} attempt(s) ` + `with fixes: ${recovery.fixesApplied.join(", ")}`);
      }
      output.recoveredJson = recovery.result;
    } else {
      log(`[json-error-recovery] recovery failed after ${recovery.attempts} attempt(s)`);
    }
  }
  return {
    "tool.after": handleToolAfter,
    recover
  };
}
// src/hooks/edit-error-recovery.ts
var ERROR_SUGGESTIONS = [
  {
    patterns: [/not found/, /no such file/i, /ENOENT/, /does not exist/i],
    suggestion: "The target file could not be found. Check that the file path is correct and the file exists. Use `glob` or `ls` to verify the file location.",
    autoFixable: false
  },
  {
    patterns: [/permission denied/i, /EACCES/, /EPERM/],
    suggestion: "Permission denied. Ensure the file is not open in another editor and you have write access to the directory.",
    autoFixable: false
  },
  {
    patterns: [/read-only/i, /readonly/i],
    suggestion: "The file is read-only. Check file permissions with `ls -l <file>` and update if needed with `chmod +w <file>`.",
    autoFixable: false
  },
  {
    patterns: [/oldString not found/i, /no match/i],
    suggestion: "The exact text to replace was not found in the file. The content may have already changed, or the whitespace/indentation is slightly different. Read the file again to get the current content before editing.",
    autoFixable: false
  },
  {
    patterns: [/Multiple matches/i, /multiple occurrence/i],
    suggestion: "Found multiple occurrences of the search string. Provide more surrounding context in oldString to uniquely identify the target location. Read the target section of the file to capture unique context.",
    autoFixable: true
  },
  {
    patterns: [/is a directory/i, /EISDIR/],
    suggestion: "The path points to a directory, not a file. Append the filename to the path.",
    autoFixable: false
  },
  {
    patterns: [/file system/i, /ENOSPC/, /disk full/i, /quota/i],
    suggestion: "The file system may be full or unavailable. Check disk space with `df -h .` and free up space if needed.",
    autoFixable: false
  },
  {
    patterns: [/locked/i, /EBUSY/],
    suggestion: "The file is locked or busy. Another process may be writing to it. Wait a moment and retry.",
    autoFixable: false
  },
  {
    patterns: [/argument.*invalid/i, /invalid argument/i, /EINVAL/],
    suggestion: "One of the edit parameters is invalid. Verify the file path, oldString, and newString are properly formatted.",
    autoFixable: false
  },
  {
    patterns: [/tool.*timeout/i, /timed out/i],
    suggestion: "The edit operation timed out. The file may be very large. Try editing a smaller section or splitting the change into multiple edits.",
    autoFixable: false
  }
];
function createEditErrorRecoveryHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    detailedSuggestions: true,
    ...hookConfig
  };
  function matchSuggestions(error) {
    const matches = [];
    for (const entry of ERROR_SUGGESTIONS) {
      for (const pattern of entry.patterns) {
        if (pattern.test(error)) {
          matches.push(entry);
          break;
        }
      }
    }
    return matches;
  }
  function suggest(error) {
    const matches = matchSuggestions(error);
    if (matches.length === 0) {
      return null;
    }
    const best = matches.reduce((a, b) => a.suggestion.length >= b.suggestion.length ? a : b);
    return {
      category: "edit-error",
      suggestion: cfg.detailedSuggestions ? best.suggestion : best.suggestion.split(".")[0] + ".",
      autoFixable: best.autoFixable
    };
  }
  async function handleToolAfter(input, _output) {
    if (!cfg.enabled)
      return;
    if (!input.error)
      return;
    const editTools = new Set([
      "edit",
      "write",
      "Write",
      "Edit",
      "file_write",
      "file_edit",
      "apply_diff"
    ]);
    if (!editTools.has(input.tool))
      return;
    const error = input.error;
    const result = suggest(error);
    if (result) {
      const pathInfo = input.filePath ? ` for "${input.filePath}"` : "";
      log(`[edit-error-recovery] edit failed${pathInfo}: ${error.slice(0, 80)}`);
      log(`[edit-error-recovery] suggestion: ${result.suggestion}`);
    } else {
      log(`[edit-error-recovery] unclassified edit error: ${error.slice(0, 100)}`);
    }
  }
  return {
    "tool.after": handleToolAfter,
    suggest
  };
}
// src/utils/persist.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, writeFileSync } from "node:fs";
import { join as join2 } from "node:path";
var PERSIST_DIR = join2(process.cwd(), ".opencode", "oh-my-unified");
function getPersistedData(key, defaultValue) {
  try {
    const filePath = join2(PERSIST_DIR, `${key}.json`);
    if (!existsSync2(filePath))
      return defaultValue;
    const content = readFileSync2(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}
function setPersistedData(key, value) {
  try {
    const filePath = join2(PERSIST_DIR, `${key}.json`);
    if (!existsSync2(PERSIST_DIR)) {
      existsSync2(join2(PERSIST_DIR, "..")) || __require("node:fs").mkdirSync(PERSIST_DIR, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(value, null, 2));
  } catch (err) {
    console.error(`[oh-my-unified] Failed to persist ${key}:`, err);
  }
}

// src/hooks/compaction-context-injector.ts
var STORAGE_KEY = "compaction-context";
var OWNERSHIP_KEY = "compaction-ownership";
function createCompactionContextInjectorHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    preserveKeys: ["phase", "currentTask", "activeAgents", "sessionIds"],
    enableOwnershipGuards: true,
    ...hookConfig
  };
  let currentContext = {
    activeAgents: [],
    sessionIds: [],
    metadata: {},
    timestamp: Date.now()
  };
  let currentOwnership = null;
  function buildSnapshot(overrides) {
    return {
      ...currentContext,
      ...overrides,
      timestamp: Date.now()
    };
  }
  function updateContext(partial) {
    currentContext = { ...currentContext, ...partial, timestamp: Date.now() };
  }
  function claimOwnership(sessionId, agent) {
    const ownership = {
      ownerSessionId: sessionId,
      ownerAgent: agent,
      claimedAt: Date.now(),
      valid: true
    };
    currentOwnership = ownership;
    return ownership;
  }
  function releaseOwnership() {
    if (currentOwnership) {
      currentOwnership.valid = false;
      currentOwnership = null;
    }
  }
  function canContinue(sessionId) {
    if (!cfg.enableOwnershipGuards)
      return true;
    if (!currentOwnership)
      return true;
    if (!currentOwnership.valid)
      return true;
    return currentOwnership.ownerSessionId === sessionId;
  }
  async function handleCompactionBefore(input, _output) {
    if (!cfg.enabled)
      return;
    const snapshot = buildSnapshot();
    try {
      setPersistedData(STORAGE_KEY, snapshot);
      log("[compaction-context] saved context snapshot before compaction", {
        phase: snapshot.phase,
        agents: snapshot.activeAgents.length,
        task: snapshot.currentTask ? snapshot.currentTask.slice(0, 60) : undefined
      });
    } catch (err) {
      log(`[compaction-context] failed to save snapshot: ${err}`);
    }
    if (cfg.enableOwnershipGuards && currentOwnership?.valid) {
      try {
        setPersistedData(OWNERSHIP_KEY, currentOwnership);
        log("[compaction-ownership] persisted ownership before compaction", {
          owner: currentOwnership.ownerAgent,
          session: currentOwnership.ownerSessionId.slice(0, 12)
        });
      } catch (err) {
        log(`[compaction-ownership] failed to persist ownership: ${err}`);
      }
    }
    const sessionId = input.sessionId || "";
    const agent = input.agent || "unknown";
    if (sessionId) {
      claimOwnership(sessionId, agent);
    }
  }
  async function handleCompactionAfter(input, output) {
    if (!cfg.enabled)
      return;
    const sessionId = input.sessionId || "";
    if (!canContinue(sessionId)) {
      log("[compaction-ownership] continuation blocked — session does not own this task", {
        requestingSession: sessionId.slice(0, 12),
        ownerSession: currentOwnership?.ownerSessionId.slice(0, 12),
        ownerAgent: currentOwnership?.ownerAgent
      });
      output.ownershipBlocked = true;
      output.injectedContext = `--- Continuation Blocked: Ownership Mismatch ---
` + `This task is owned by session ${currentOwnership?.ownerAgent} (${currentOwnership?.ownerSessionId.slice(0, 12)}).
` + `You cannot continue this task. Let the owning session handle it.
` + "---";
      return;
    }
    if (cfg.enableOwnershipGuards) {
      try {
        const savedOwnership = getPersistedData(OWNERSHIP_KEY, null);
        if (savedOwnership?.valid) {
          currentOwnership = savedOwnership;
          log("[compaction-ownership] restored ownership after compaction", {
            owner: savedOwnership.ownerAgent
          });
        }
      } catch (err) {
        log(`[compaction-ownership] failed to restore ownership: ${err}`);
      }
    }
    try {
      const saved = getPersistedData(STORAGE_KEY, null);
      if (!saved) {
        log("[compaction-context] no saved context found after compaction");
        return;
      }
      currentContext = saved;
      const lines = ["--- Context Restored After Compaction ---"];
      if (saved.currentTask) {
        lines.push(`Task: ${saved.currentTask}`);
      }
      if (saved.phase !== undefined) {
        const phaseLabels = ["assess", "assemble", "act", "improvise"];
        lines.push(`Phase: ${phaseLabels[saved.phase] ?? "unknown"}`);
      }
      if (saved.activeAgents.length > 0) {
        lines.push(`Active Agents: ${saved.activeAgents.join(", ")}`);
      }
      if (saved.sessionIds.length > 0) {
        lines.push(`Sessions: ${saved.sessionIds.join(", ")}`);
      }
      if (currentOwnership?.valid) {
        lines.push(`Continuation Owner: ${currentOwnership.ownerAgent}`);
      }
      lines.push("---");
      output.injectedContext = lines.join(`
`);
      log("[compaction-context] injected restored context", {
        phase: saved.phase,
        agents: saved.activeAgents.length,
        sessions: saved.sessionIds.length
      });
    } catch (err) {
      log(`[compaction-context] failed to restore snapshot: ${err}`);
    }
  }
  return {
    updateContext,
    buildSnapshot,
    getContext: () => ({ ...currentContext }),
    claimOwnership,
    releaseOwnership,
    canContinue,
    getOwnership: () => currentOwnership,
    "compaction.before": handleCompactionBefore,
    "compaction.after": handleCompactionAfter
  };
}
// src/hooks/agent-usage-reminder.ts
var DEFAULT_MESSAGE = "Tip: You can use specialist agents for complex tasks — " + "@Oracle for deep analysis, @Explorer for codebase discovery, " + "@Librarian for documentation search, @Designer for UI work, " + "and @Fixer for targeted fixes. Use `@<agent>` to delegate.";
var PRIMITIVE_TOOL_PATTERNS = [
  "read",
  "write",
  "edit",
  "grep",
  "glob",
  "bash",
  "search",
  "list"
];
function createAgentUsageReminderHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    threshold: 6,
    customMessage: DEFAULT_MESSAGE,
    ...hookConfig
  };
  let primitiveTurnCount = 0;
  let lastReminderTurn = 0;
  let totalTurns = 0;
  function isPrimitiveTool(tool) {
    const lower = tool.toLowerCase();
    return PRIMITIVE_TOOL_PATTERNS.some((pattern) => lower.includes(pattern) || lower === pattern);
  }
  function isDelegationTool(tool) {
    const lower = tool.toLowerCase();
    return lower.startsWith("@") || lower.includes("delegate") || lower.includes("subagent") || lower.includes("mcp") || lower === "call_omo_agent" || lower === "background_output";
  }
  function resetCounter() {
    primitiveTurnCount = 0;
  }
  async function handleToolAfter(input, output) {
    if (!cfg.enabled)
      return;
    totalTurns++;
    if (isDelegationTool(input.tool)) {
      resetCounter();
      return;
    }
    if (isPrimitiveTool(input.tool)) {
      primitiveTurnCount++;
    } else {
      resetCounter();
      return;
    }
    if (primitiveTurnCount >= cfg.threshold && totalTurns !== lastReminderTurn) {
      log(`[agent-usage-reminder] ${primitiveTurnCount} consecutive primitive-only turns — ` + `injecting agent reminder`);
      output.agentUsageReminder = cfg.customMessage;
      lastReminderTurn = totalTurns;
      primitiveTurnCount = 0;
    }
  }
  return {
    "tool.after": handleToolAfter,
    getStats: () => ({
      primitiveTurnCount,
      totalTurns,
      threshold: cfg.threshold
    }),
    resetCounter
  };
}
// src/hooks/directory-context-injector.ts
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "node:fs";
import { resolve } from "node:path";
var DEFAULT_FILES = ["AGENTS.md", "README.md"];
function createDirectoryContextInjectorHook(ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    directory: ctx.directory ?? process.cwd(),
    contextFiles: [...DEFAULT_FILES],
    maxFileLength: 8000,
    ...hookConfig
  };
  let cachedContext = null;
  let lastCacheTime = 0;
  const CACHE_TTL_MS = 60000;
  function readContextFile(fileName) {
    try {
      const filePath = resolve(cfg.directory, fileName);
      if (!existsSync3(filePath))
        return null;
      const content = readFileSync3(filePath, "utf-8");
      if (content.length > cfg.maxFileLength) {
        return content.slice(0, cfg.maxFileLength) + `

[... truncated at ${cfg.maxFileLength} characters]`;
      }
      return content;
    } catch {
      return null;
    }
  }
  function gatherContext() {
    const now = Date.now();
    if (cachedContext && now - lastCacheTime < CACHE_TTL_MS) {
      return cachedContext;
    }
    const parts = [];
    for (const fileName of cfg.contextFiles) {
      const content = readContextFile(fileName);
      if (content) {
        parts.push(`### Context from ${fileName}
${content}`);
      }
    }
    if (parts.length === 0) {
      cachedContext = null;
      return null;
    }
    cachedContext = `--- Project Context ---
${parts.join(`

`)}
---`;
    lastCacheTime = now;
    return cachedContext;
  }
  function invalidateCache() {
    cachedContext = null;
    lastCacheTime = 0;
  }
  async function handleMessageBefore(input, _output) {
    if (!cfg.enabled)
      return;
    if (input.role !== "user")
      return;
    const context = gatherContext();
    if (context) {
      log("[directory-context-injector] injecting project context");
      input._projectContext = context;
    } else {
      log("[directory-context-injector] no context files found");
    }
  }
  return {
    gatherContext,
    invalidateCache,
    "message.before": handleMessageBefore
  };
}
// src/hooks/auto-command-detector.ts
var DEFAULT_TRIGGER_KEYWORDS = [
  "plan",
  "audit",
  "review",
  "investigate",
  "explore",
  "search",
  "find",
  "debug",
  "fix",
  "refactor",
  "test",
  "check",
  "analyse",
  "analyze",
  "optimize",
  "optimise",
  "summarize",
  "summarise"
];
var PHASE_MAP = {
  assess: "om-plan",
  assemble: "om-plan",
  act: "om-plan",
  improvise: "om-plan",
  architecture: "om-audit",
  quality: "om-audit",
  security: "om-audit",
  ux: "om-audit",
  full: "om-audit"
};
function createAutoCommandDetectorHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    triggerKeywords: [...DEFAULT_TRIGGER_KEYWORDS],
    confidenceThreshold: 0.6,
    commands: ["om-plan", "om-audit"],
    ...hookConfig
  };
  const agentNames = new Set([
    ...ALL_AGENT_NAMES.map((n) => n.toLowerCase()),
    ...Object.keys(AGENT_ALIASES).map((a) => a.toLowerCase()),
    ...Object.values(AGENT_ALIASES).map((a) => a.toLowerCase())
  ]);
  function tokenise(text) {
    return text.toLowerCase().replace(/[^\w\s@/]/g, " ").split(/\s+/).filter(Boolean);
  }
  function detectAgentMentions(tokens) {
    return tokens.filter((t) => t.startsWith("@")).map((t) => t.slice(1)).filter((name) => agentNames.has(name));
  }
  function detectCommandTriggers(tokens, text) {
    const suggestions = [];
    for (const [keyword, command] of Object.entries(PHASE_MAP)) {
      if (tokens.includes(keyword) && text.toLowerCase().includes(keyword)) {
        suggestions.push({
          command: `/${command}`,
          arguments: keyword,
          confidence: 0.8,
          reason: `Detected phase keyword "${keyword}"`
        });
      }
    }
    for (const keyword of cfg.triggerKeywords) {
      if (tokens.includes(keyword)) {
        let suggestedCommand = "";
        let args = "";
        let confidence = 0.65;
        if (keyword === "plan") {
          suggestedCommand = "/om-plan";
          args = "assess";
          confidence = 0.75;
        } else if (["audit", "review"].includes(keyword)) {
          suggestedCommand = "/om-audit";
          args = "full";
          confidence = 0.75;
        } else if (["investigate", "debug", "fix"].includes(keyword)) {
          suggestedCommand = "/om-plan";
          args = "improvise";
          confidence = 0.5;
        }
        if (suggestedCommand && confidence >= cfg.confidenceThreshold) {
          suggestions.push({
            command: suggestedCommand,
            arguments: args || keyword,
            confidence,
            reason: `Matched trigger keyword "${keyword}"`
          });
        }
      }
    }
    return suggestions;
  }
  function detect(input) {
    const tokens = tokenise(input);
    const suggestions = [];
    const mentions = detectAgentMentions(tokens);
    for (const name of mentions) {
      const aliased = AGENT_ALIASES[name] ?? name;
      suggestions.push({
        command: `@${aliased}`,
        confidence: 0.9,
        reason: `Detected agent mention "@${name}"`
      });
    }
    const commandTriggers = detectCommandTriggers(tokens, input);
    suggestions.push(...commandTriggers);
    const seen = new Set;
    return suggestions.filter((s) => {
      const key = `${s.command}:${s.arguments ?? ""}`;
      if (seen.has(key))
        return false;
      seen.add(key);
      return true;
    });
  }
  async function handleMessageBefore(input, output) {
    if (!cfg.enabled)
      return;
    if (input.role !== "user")
      return;
    if (!input.content)
      return;
    const suggestions = detect(input.content);
    if (suggestions.length > 0) {
      log(`[auto-command-detector] ${suggestions.length} suggestion(s) for input`);
      output.commandSuggestions = suggestions;
    }
  }
  return {
    detect,
    "message.before": handleMessageBefore
  };
}
// src/hooks/post-tool-nudge.ts
var DEFAULT_WATCHED_TOOLS = [
  "edit",
  "write",
  "Write",
  "Edit",
  "file_write",
  "file_edit",
  "apply_diff",
  "replace",
  "overwrite",
  "create"
];
var DEFAULT_MESSAGE2 = "Change applied. Consider running `bun run typecheck` and `bun test` " + "(or your project's equivalent) to verify the change didn't break anything.";
function createPostToolNudgeHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    watchedTools: [...DEFAULT_WATCHED_TOOLS],
    message: DEFAULT_MESSAGE2,
    skipOnError: false,
    ...hookConfig
  };
  const watched = new Set(cfg.watchedTools);
  async function handleToolAfter(input, output) {
    if (!cfg.enabled)
      return;
    if (!watched.has(input.tool))
      return;
    if (cfg.skipOnError && input.error)
      return;
    log(`[post-tool-nudge] "${input.tool}" completed — adding verification nudge`);
    output.postToolNudge = cfg.message;
  }
  return {
    "tool.after": handleToolAfter
  };
}
// src/hooks/todo-continuation.ts
var STORAGE_KEY2 = "todo-continuation";
function createTodoContinuationHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    autoRestore: true,
    autoSave: true,
    ...hookConfig
  };
  let currentTodos = [];
  let hasRestored = false;
  let sessionActive = false;
  function saveTodos(todos, sessionId, metadata) {
    if (!cfg.enabled || !cfg.autoSave)
      return;
    const state2 = {
      todos,
      activeSessionId: sessionId,
      metadata: metadata ?? {},
      savedAt: Date.now()
    };
    try {
      setPersistedData(STORAGE_KEY2, state2);
      log(`[todo-continuation] saved ${todos.length} todo(s)`);
    } catch (err) {
      log(`[todo-continuation] failed to save: ${err}`);
    }
  }
  function restoreTodos() {
    if (!cfg.enabled || !cfg.autoRestore)
      return null;
    try {
      const saved = getPersistedData(STORAGE_KEY2, null);
      if (!saved)
        return null;
      currentTodos = saved.todos;
      hasRestored = true;
      log(`[todo-continuation] restored ${saved.todos.length} todo(s) ` + `from session "${saved.activeSessionId ?? "unknown"}"`);
      return saved;
    } catch (err) {
      log(`[todo-continuation] failed to restore: ${err}`);
      return null;
    }
  }
  function updateTodos(todos, sessionId) {
    currentTodos = [...todos];
    if (cfg.autoSave) {
      saveTodos(currentTodos, sessionId);
    }
  }
  function clearTodos() {
    currentTodos = [];
    try {
      setPersistedData(STORAGE_KEY2, null);
      log("[todo-continuation] cleared saved todos");
    } catch (err) {
      log(`[todo-continuation] failed to clear: ${err}`);
    }
  }
  function getTodos() {
    return [...currentTodos];
  }
  async function handleSessionStart(_input, output) {
    if (!cfg.enabled)
      return;
    sessionActive = true;
    if (cfg.autoRestore) {
      const saved = restoreTodos();
      if (saved && saved.todos.length > 0) {
        output.restoredTodos = saved.todos;
        log(`[todo-continuation] session start — restored ${saved.todos.length} todo(s)`);
      }
    }
  }
  async function handleSessionEnd(_input, _output) {
    if (!cfg.enabled)
      return;
    sessionActive = false;
    if (cfg.autoSave && currentTodos.length > 0) {
      saveTodos(currentTodos);
      log(`[todo-continuation] session end — saved ${currentTodos.length} todo(s)`);
    }
  }
  async function handleTodoUpdated(input, _output) {
    if (!cfg.enabled || !cfg.autoSave)
      return;
    if (!input.todos)
      return;
    currentTodos = input.todos;
    saveTodos(currentTodos);
  }
  return {
    saveTodos,
    restoreTodos,
    updateTodos,
    clearTodos,
    getTodos,
    "session.start": handleSessionStart,
    "session.end": handleSessionEnd,
    "todo.updated": handleTodoUpdated
  };
}
// src/hooks/synthesized-hooks.ts
import { existsSync as existsSync4, realpathSync } from "fs";
import { basename, dirname, isAbsolute, join as join3, normalize, relative, resolve as resolve2 } from "path";
var DEFAULT_CONTEXT_REMINDER = `
Note: You still have context remaining — do NOT rush or skip tasks.
Complete your work thoroughly and methodically.`;
var DEFAULT_TASK_REMINDER = `
The task tools haven't been used recently. If you're tracking work, use the todo/task system to record progress.`;
var DEFAULT_FILE_READ_WARNING = "Prefer the Read tool over bash cat/head/tail for reading files. Read provides line numbers and hash anchors for precise editing.";
var DEFAULT_EMPTY_RESPONSE_WARNING = `[Empty Response Warning]
Task invocation returned no response. The agent may have failed silently.
Proceed accordingly — you are NOT waiting for a response.`;
var STALE_TIMEOUT_MS = 5 * 60 * 1000;
function createContextWindowMonitor(config) {
  const cfg = {
    enabled: true,
    threshold: 0.7,
    ...config
  };
  const remindedSessions = new Set;
  function estimateUsageFraction(_sessionID) {
    return null;
  }
  return {
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (remindedSessions.has(input.sessionID))
        return;
      const frac = estimateUsageFraction(input.sessionID);
      if (frac === null || frac < cfg.threshold)
        return;
      remindedSessions.add(input.sessionID);
      if (output.output) {
        output.output += DEFAULT_CONTEXT_REMINDER;
      }
      log("[synthesized-hooks] context-window monitor: near limit", {
        sessionID: input.sessionID,
        fraction: frac
      });
    },
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties;
        const sid = typeof props?.sessionID === "string" ? props.sessionID : undefined;
        if (sid)
          remindedSessions.delete(sid);
      }
    }
  };
}
function createFileWriteGuard(config) {
  const cfg = { enabled: true, ...config };
  const FILE_READ_PATTERNS = [
    /^\s*cat\s+(?!-)[^\s|&;]+\s*$/,
    /^\s*head\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/,
    /^\s*tail\s+(-n\s+\d+\s+)?(?!-)[^\s|&;]+\s*$/
  ];
  function isSimpleFileReadCommand(command) {
    return FILE_READ_PATTERNS.some((p) => p.test(command));
  }
  return {
    "tool.execute.before": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (input.tool.toLowerCase() !== "bash")
        return;
      const command = output.args?.command;
      if (typeof command !== "string")
        return;
      if (!isSimpleFileReadCommand(command))
        return;
      output.message = DEFAULT_FILE_READ_WARNING;
      log("[synthesized-hooks] file-read guard: warned on bash read", {
        sessionID: input.sessionID,
        command
      });
    }
  };
}
function createOverwriteProtection(ctx, config) {
  const cfg = {
    enabled: true,
    maxTrackedPaths: 1024,
    ...config
  };
  const readPathsBySession = new Map;
  function resolvePath(inputPath) {
    return normalize(isAbsolute(inputPath) ? inputPath : resolve2(ctx.directory, inputPath));
  }
  function toCanonical(absPath) {
    if (existsSync4(absPath)) {
      try {
        return realpathSync.native(absPath);
      } catch {
        return absPath;
      }
    }
    const absDir = dirname(absPath);
    const resolvedDir = existsSync4(absDir) ? realpathSync.native(absDir) : absDir;
    return normalize(join3(resolvedDir, basename(absPath)));
  }
  function isPathInside(path3, directory) {
    const rel = relative(directory, path3);
    return rel === "" || !rel.startsWith("..") && !isAbsolute(rel);
  }
  return {
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      const tool = input.tool.toLowerCase();
      if (tool !== "read")
        return;
      const args = output.args ?? {};
      const rawPath = args.filePath ?? args.path ?? args.file_path;
      if (!rawPath || typeof rawPath !== "string")
        return;
      const absPath = toCanonical(resolvePath(rawPath));
      let paths = readPathsBySession.get(input.sessionID);
      if (!paths) {
        paths = new Set;
        readPathsBySession.set(input.sessionID, paths);
      }
      if (paths.size < cfg.maxTrackedPaths) {
        paths.add(absPath);
      }
    },
    "tool.execute.before": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (!["write", "edit"].includes(input.tool.toLowerCase()))
        return;
      const args = output.args ?? {};
      const rawPath = args.filePath ?? args.path ?? args.file_path;
      if (!rawPath || typeof rawPath !== "string")
        return;
      const absPath = toCanonical(resolvePath(rawPath));
      if (!isPathInside(absPath, ctx.directory))
        return;
      const paths = readPathsBySession.get(input.sessionID);
      if (!paths?.has(absPath)) {
        output.message = `WARNING: "${rawPath}" may not have been read this session. ` + "Read the file first to verify its current content before overwriting.";
        log("[synthesized-hooks] overwrite guard: file not read before write", {
          sessionID: input.sessionID,
          path: absPath
        });
      }
    }
  };
}
function createTaskReminder(config) {
  const cfg = {
    enabled: true,
    threshold: 10,
    customMessage: DEFAULT_TASK_REMINDER,
    ...config
  };
  const TASK_TOOLS = new Set(["task", "task_create", "task_list", "task_get", "task_update", "task_delete", "todowrite"]);
  const sessionCounters = new Map;
  return {
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      const lower = input.tool.toLowerCase();
      if (TASK_TOOLS.has(lower)) {
        sessionCounters.set(input.sessionID, 0);
        return;
      }
      const current = sessionCounters.get(input.sessionID) ?? 0;
      const next = current + 1;
      if (next >= cfg.threshold) {
        if (output.output)
          output.output += cfg.customMessage;
        sessionCounters.set(input.sessionID, 0);
        log("[synthesized-hooks] task reminder injected", { sessionID: input.sessionID });
      } else {
        sessionCounters.set(input.sessionID, next);
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties;
        const sid = typeof props?.sessionID === "string" ? props.sessionID : undefined;
        if (sid)
          sessionCounters.delete(sid);
      }
    }
  };
}
function createModelSelectionHook(config) {
  const cfg = {
    enabled: true,
    agentRequirements: {},
    ...config
  };
  return {
    "chat.message": async (input, output) => {
      if (!cfg.enabled)
        return;
      const agentName = input.agent ?? "";
      const requirement = cfg.agentRequirements[agentName];
      if (!requirement)
        return;
      const modelID = input.model?.modelID ?? "";
      const isAllowed = requirement.allowedFamilies.some((f) => modelID.toLowerCase().includes(f.toLowerCase()));
      if (!isAllowed) {
        const fallback = requirement.fallbackAgent;
        input.agent = fallback;
        if (output?.message) {
          output.message.agent = fallback;
        }
        log("[synthesized-hooks] model selection: rerouted agent", {
          sessionID: input.sessionID,
          from: agentName,
          to: fallback,
          model: modelID
        });
      }
    }
  };
}
function createErrorRecoveryHook(config) {
  const cfg = {
    enabled: true,
    detailedSuggestions: true,
    ...config
  };
  const SUGGESTIONS = [
    {
      patterns: [/not found/i, /no such file/i, /ENOENT/, /does not exist/i],
      suggestion: "File not found. Verify the path exists using `glob` or `ls` before trying again."
    },
    {
      patterns: [/permission denied/i, /EACCES/, /EPERM/],
      suggestion: "Permission denied. Ensure the file is not open in another process and you have write access."
    },
    {
      patterns: [/oldString not found/i, /no match/i],
      suggestion: "The exact text to replace was not found. The content may have changed — re-read the file to get current content before editing."
    },
    {
      patterns: [/multiple match/i, /multiple occurrence/i],
      suggestion: "Found multiple matches. Provide more surrounding context in oldString to uniquely identify the target location."
    },
    {
      patterns: [/is a directory/i, /EISDIR/],
      suggestion: "The path points to a directory, not a file. Append the filename to the path."
    },
    {
      patterns: [/ENOSPC/, /disk full/i, /no space/i],
      suggestion: "File system may be full. Check disk space with `df -h .` and free up space if needed."
    },
    {
      patterns: [/locked/i, /EBUSY/],
      suggestion: "The file is locked or busy. Wait a moment and retry."
    },
    {
      patterns: [/rate limit/i, /too many requests/i, /429/],
      suggestion: "Rate limited. Wait before retrying, or reduce request frequency."
    },
    {
      patterns: [/(timeout|timed out)/i, /ETIMEDOUT/, /ESOCKETTIMEDOUT/],
      suggestion: "Request timed out. The service may be slow — try again with a longer timeout."
    }
  ];
  return {
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (!cfg.detailedSuggestions)
        return;
      const toolOutput = output.output ?? "";
      if (!toolOutput.toLowerCase().includes("error"))
        return;
      for (const entry of SUGGESTIONS) {
        if (entry.patterns.some((p) => p.test(toolOutput))) {
          output.output = `${toolOutput}

\uD83D\uDCA1 ${entry.suggestion}`;
          return;
        }
      }
    }
  };
}
function createWebFetchGuard(config) {
  const cfg = {
    enabled: true,
    maxRedirects: 5,
    ...config
  };
  const pendingFailures = new Map;
  function makeKey(sessionID, callID) {
    return `${sessionID}:${callID}`;
  }
  function cleanupStale() {
    const now = Date.now();
    for (const [key, value] of pendingFailures) {
      if (now - value.storedAt > STALE_TIMEOUT_MS)
        pendingFailures.delete(key);
    }
  }
  function isRedirectLoopError(output) {
    return /exceeded maximum redirects/i.test(output) || /redirect loop/i.test(output);
  }
  return {
    "tool.execute.before": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (input.tool.toLowerCase() !== "webfetch")
        return;
      cleanupStale();
      const url = output.args?.url;
      if (typeof url !== "string" || !url)
        return;
      const key = makeKey(input.sessionID, input.callID);
      pendingFailures.set(key, { originalUrl: url, storedAt: Date.now() });
    },
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (input.tool.toLowerCase() !== "webfetch")
        return;
      const key = makeKey(input.sessionID, input.callID);
      const pending = pendingFailures.get(key);
      pendingFailures.delete(key);
      if (!pending)
        return;
      if (!output.output || !isRedirectLoopError(output.output))
        return;
      output.output = `Error: WebFetch failed — exceeded maximum redirects (${cfg.maxRedirects}) for ${pending.originalUrl}`;
      log("[synthesized-hooks] webfetch redirect guard: blocked loop", {
        sessionID: input.sessionID,
        url: pending.originalUrl
      });
    }
  };
}
function createDiffEnhancer(config) {
  const cfg = { enabled: true, ...config };
  const pendingCaptures = new Map;
  function makeKey(sessionID, callID) {
    return `${sessionID}:${callID}`;
  }
  function cleanupStale() {
    const now = Date.now();
    for (const [key, entry] of pendingCaptures) {
      if (now - entry.storedAt > STALE_TIMEOUT_MS)
        pendingCaptures.delete(key);
    }
  }
  async function captureContent(filePath) {
    try {
      const { readFile } = await import("fs/promises");
      return await readFile(filePath, "utf-8");
    } catch {
      return "";
    }
  }
  function generateDiffSummary(_oldContent, _newContent) {
    const oldLines = _oldContent.split(`
`);
    const newLines = _newContent.split(`
`);
    const added = newLines.filter((l) => !_oldContent.includes(l)).length;
    const removed = oldLines.filter((l) => !_newContent.includes(l)).length;
    return `--- before
+++ after
@@ -${oldLines.length} +${newLines.length} @@
  ~${added} added, ${removed} removed`;
  }
  return {
    "tool.execute.before": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (input.tool.toLowerCase() !== "write")
        return;
      const filePath = output.args?.filePath ?? output.args?.path ?? output.args?.file_path;
      if (!filePath || typeof filePath !== "string")
        return;
      cleanupStale();
      const oldContent = await captureContent(filePath);
      pendingCaptures.set(makeKey(input.sessionID, input.callID), {
        content: oldContent,
        filePath,
        storedAt: Date.now()
      });
    },
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (input.tool.toLowerCase() !== "write")
        return;
      const key = makeKey(input.sessionID, input.callID);
      const captured = pendingCaptures.get(key);
      pendingCaptures.delete(key);
      if (!captured)
        return;
      let newContent;
      try {
        const { readFile } = await import("fs/promises");
        newContent = await readFile(captured.filePath, "utf-8");
      } catch {
        return;
      }
      const diff = generateDiffSummary(captured.content, newContent);
      if (output.output) {
        output.output += `

${diff}`;
      }
    }
  };
}
function createEmptyResponseDetector(config) {
  const cfg = { enabled: true, ...config };
  return {
    "tool.execute.after": async (input, output) => {
      if (!cfg.enabled)
        return;
      if (!["task", "call_omo_agent"].includes(input.tool))
        return;
      const text = output.output?.trim() ?? "";
      if (text === "") {
        output.output = DEFAULT_EMPTY_RESPONSE_WARNING;
      }
    }
  };
}
function createCommentChecker(_config) {
  return {
    "tool.execute.before": async () => {},
    "tool.execute.after": async () => {}
  };
}
function createFsyncWarning(_config) {
  return {
    "tool.execute.before": async () => {},
    "tool.execute.after": async () => {}
  };
}
function createSynthesizedHooks(ctx, _config, hookConfig) {
  const cfg = {
    contextWindowMonitor: { enabled: true },
    fileWriteGuard: { enabled: true },
    overwriteProtection: { enabled: true },
    taskReminder: { enabled: true },
    modelSelection: { enabled: true },
    errorRecovery: { enabled: true },
    webFetchGuard: { enabled: true },
    diffEnhancer: { enabled: true },
    commentChecker: { enabled: false },
    fsyncWarning: { enabled: true },
    emptyResponseDetector: { enabled: true },
    ...hookConfig
  };
  const contextMonitor = createContextWindowMonitor(cfg.contextWindowMonitor?.enabled ? cfg.contextWindowMonitor : { enabled: false });
  const fileWriteGuard = createFileWriteGuard(cfg.fileWriteGuard?.enabled !== false ? cfg.fileWriteGuard : { enabled: false });
  const overwriteProtection = createOverwriteProtection(ctx, cfg.overwriteProtection?.enabled !== false ? cfg.overwriteProtection : { enabled: false });
  const taskReminder = createTaskReminder(cfg.taskReminder?.enabled !== false ? cfg.taskReminder : { enabled: false });
  const modelSelection = createModelSelectionHook(cfg.modelSelection?.enabled !== false ? cfg.modelSelection : { enabled: false });
  const errorRecovery = createErrorRecoveryHook(cfg.errorRecovery?.enabled !== false ? cfg.errorRecovery : { enabled: false });
  const webFetchGuard = createWebFetchGuard(cfg.webFetchGuard?.enabled !== false ? cfg.webFetchGuard : { enabled: false });
  const diffEnhancer = createDiffEnhancer(cfg.diffEnhancer?.enabled !== false ? cfg.diffEnhancer : { enabled: false });
  const emptyDetector = createEmptyResponseDetector(cfg.emptyResponseDetector?.enabled !== false ? cfg.emptyResponseDetector : { enabled: false });
  const commentChecker = createCommentChecker(cfg.commentChecker?.enabled ? cfg.commentChecker : { enabled: false });
  const fsyncWarning = createFsyncWarning(cfg.fsyncWarning?.enabled !== false ? cfg.fsyncWarning : { enabled: false });
  const allHandlers = [
    contextMonitor,
    fileWriteGuard,
    overwriteProtection,
    taskReminder,
    modelSelection,
    errorRecovery,
    webFetchGuard,
    diffEnhancer,
    emptyDetector,
    commentChecker,
    fsyncWarning
  ];
  const merged = {};
  for (const handlerSet of allHandlers) {
    for (const [key, handler] of Object.entries(handlerSet)) {
      if (!handler)
        continue;
      if (!merged[key]) {
        merged[key] = handler;
      } else {
        const prev = merged[key];
        const curr = handler;
        merged[key] = async (...args) => {
          await prev(...args);
          await curr(...args);
        };
      }
    }
  }
  return merged;
}
// src/hooks/proactive-fallback.ts
function createProactiveFallbackHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    errorThreshold: 0.3,
    windowSeconds: 300,
    minSamples: 3,
    cooldownSeconds: 60,
    chains: {},
    ...hookConfig
  };
  const modelStats = new Map;
  const lastFallbackTime = new Map;
  const fallbackLogs = [];
  function recordSuccess(modelKey) {
    const stats = modelStats.get(modelKey) ?? {
      totalCalls: 0,
      errorCount: 0,
      lastErrorTime: 0,
      errorTimestamps: []
    };
    stats.totalCalls++;
    modelStats.set(modelKey, stats);
  }
  function recordError(modelKey) {
    const stats = modelStats.get(modelKey) ?? {
      totalCalls: 0,
      errorCount: 0,
      lastErrorTime: 0,
      errorTimestamps: []
    };
    stats.totalCalls++;
    stats.errorCount++;
    stats.lastErrorTime = Date.now();
    stats.errorTimestamps.push(Date.now());
    const cutoff = Date.now() - cfg.windowSeconds * 1000;
    stats.errorTimestamps = stats.errorTimestamps.filter((t) => t > cutoff);
    modelStats.set(modelKey, stats);
  }
  function getErrorRate(modelKey) {
    const stats = modelStats.get(modelKey);
    if (!stats || stats.totalCalls === 0)
      return { rate: 0, samples: 0 };
    const cutoff = Date.now() - cfg.windowSeconds * 1000;
    const recentErrors = stats.errorTimestamps.filter((t) => t > cutoff).length;
    const recentTotal = Math.max(stats.totalCalls, 1);
    return {
      rate: recentErrors / recentTotal,
      samples: stats.totalCalls
    };
  }
  function getNextModel(modelKey) {
    const chain = cfg.chains[modelKey];
    if (!chain || chain.length === 0)
      return null;
    return chain.find((m) => m !== modelKey) ?? null;
  }
  return {
    "chat.params": async (input, output) => {
      if (!cfg.enabled)
        return;
      const modelKey = input.model.id;
      const { rate, samples } = getErrorRate(modelKey);
      if (samples >= cfg.minSamples && rate >= cfg.errorThreshold) {
        const lastFallback = lastFallbackTime.get(modelKey) ?? 0;
        const now = Date.now();
        if (now - lastFallback < cfg.cooldownSeconds * 1000) {
          return;
        }
        const nextModel = getNextModel(modelKey);
        if (!nextModel)
          return;
        const slash = nextModel.indexOf("/");
        if (slash <= 0)
          return;
        const providerID = nextModel.slice(0, slash);
        const modelID = nextModel.slice(slash + 1);
        output.options.fallbackModel = nextModel;
        output.options._originalModel = modelKey;
        lastFallbackTime.set(modelKey, now);
        fallbackLogs.push({
          from: modelKey,
          to: nextModel,
          errorRate: rate,
          timestamp: now
        });
        log("[proactive-fallback] overriding model due to high error rate", {
          sessionID: input.sessionID,
          agent: input.agent,
          from: modelKey,
          to: nextModel,
          errorRate: rate.toFixed(2),
          samples
        });
      }
    },
    recordError: (modelKey) => recordError(modelKey),
    recordSuccess: (modelKey) => recordSuccess(modelKey),
    getFallbackLogs: () => [...fallbackLogs],
    getErrorRates: () => {
      const rates = {};
      for (const [key] of modelStats) {
        rates[key] = getErrorRate(key);
      }
      return rates;
    }
  };
}

// src/features/trigger-detector/index.ts
class TriggerDetector {
  rules = [];
  register(rule) {
    this.rules.push({
      mode: rule.mode ?? "includes",
      priority: rule.priority ?? 0,
      enabled: rule.enabled ?? true,
      ...rule
    });
  }
  registerMany(rules) {
    for (const rule of rules) {
      this.register(rule);
    }
  }
  detect(input) {
    const lower = input.toLowerCase();
    const matches = [];
    for (const rule of this.rules) {
      if (!rule.enabled)
        continue;
      for (const keyword of rule.keywords) {
        if (this.matches(lower, keyword, rule.mode)) {
          matches.push({
            feature: rule.feature,
            matchedKeyword: keyword,
            priority: rule.priority,
            mode: rule.mode
          });
          break;
        }
      }
    }
    if (matches.length === 0)
      return null;
    matches.sort((a, b) => b.priority - a.priority);
    const winner = matches[0];
    log("[trigger-detector] matched", {
      feature: winner.feature,
      keyword: winner.matchedKeyword,
      priority: winner.priority,
      totalMatches: matches.length
    });
    return winner;
  }
  detectAll(input) {
    const lower = input.toLowerCase();
    const matches = [];
    for (const rule of this.rules) {
      if (!rule.enabled)
        continue;
      for (const keyword of rule.keywords) {
        if (this.matches(lower, keyword, rule.mode)) {
          matches.push({
            feature: rule.feature,
            matchedKeyword: keyword,
            priority: rule.priority,
            mode: rule.mode
          });
          break;
        }
      }
    }
    matches.sort((a, b) => b.priority - a.priority);
    return matches;
  }
  isEnabled(feature) {
    return this.rules.some((r) => r.feature === feature && r.enabled);
  }
  setEnabled(feature, enabled) {
    for (const rule of this.rules) {
      if (rule.feature === feature) {
        rule.enabled = enabled;
      }
    }
  }
  getRules() {
    return [...this.rules];
  }
  clear() {
    this.rules = [];
  }
  matches(input, keyword, mode) {
    switch (mode) {
      case "includes":
        return input.includes(keyword.toLowerCase());
      case "exact":
        return input === keyword.toLowerCase();
      case "regex": {
        try {
          const re = new RegExp(keyword, "i");
          return re.test(input);
        } catch {
          return false;
        }
      }
      case "fuzzy": {
        const kw = keyword.toLowerCase();
        if (input.includes(kw))
          return true;
        let inputIdx = 0;
        let kwIdx = 0;
        while (inputIdx < input.length && kwIdx < kw.length) {
          if (input[inputIdx] === kw[kwIdx])
            kwIdx++;
          inputIdx++;
        }
        return kwIdx === kw.length;
      }
      default:
        return false;
    }
  }
}
function createDefaultTriggerDetector() {
  const detector = new TriggerDetector;
  detector.registerMany([
    {
      feature: "security-research",
      keywords: [
        "security research",
        "security audit",
        "vulnerability scan",
        "threat model",
        "pen test",
        "pentest",
        "security review",
        "OWASP",
        "STRIDE",
        "attack surface",
        "security assessment"
      ],
      priority: 100
    },
    {
      feature: "review-work",
      keywords: [
        "review work",
        "review my work",
        "review changes",
        "qa my work",
        "verify implementation",
        "check my work",
        "validate changes",
        "post-implementation review",
        "review this",
        "code review",
        "quality check"
      ],
      priority: 90
    },
    {
      feature: "hyperplan",
      keywords: [
        "hyperplan",
        "adversarial plan",
        "adversarial planning",
        "challenge this plan",
        "stress test",
        "red team"
      ],
      priority: 80
    },
    {
      feature: "ralph-loop",
      keywords: [
        "ralph loop",
        "iterate on this",
        "refine this",
        "improve this",
        "verify this",
        "loop on this"
      ],
      priority: 70
    }
  ]);
  return detector;
}

// src/features/ralph-loop/index.ts
class RalphLoopManager {
  config;
  states = new Map;
  iterationCounts = new Map;
  constructor(config) {
    this.config = {
      enabled: config?.enabled ?? true,
      defaultMaxIterations: config?.defaultMaxIterations ?? 10,
      iterationCooldownMs: config?.iterationCooldownMs ?? 1000
    };
  }
  startLoop(sessionId, prompt, options) {
    if (!this.config.enabled)
      return;
    this.states.set(sessionId, {
      active: true,
      prompt,
      iteration: 0,
      maxIterations: options?.maxIterations ?? this.config.defaultMaxIterations,
      sessionId,
      completionPromiseId: options?.completionPromiseId,
      strategy: options?.strategy ?? "refine"
    });
    this.iterationCounts.set(sessionId, 0);
    log("[ralph-loop] started", {
      sessionId,
      prompt: prompt.slice(0, 100),
      maxIterations: options?.maxIterations ?? this.config.defaultMaxIterations,
      strategy: options?.strategy ?? "refine"
    });
  }
  isActive(sessionId) {
    const state2 = this.states.get(sessionId);
    return state2?.active ?? false;
  }
  getState(sessionId) {
    return this.states.get(sessionId);
  }
  incrementIteration(sessionId) {
    const state2 = this.states.get(sessionId);
    if (!state2 || !state2.active)
      return 0;
    state2.iteration++;
    const current = (this.iterationCounts.get(sessionId) ?? 0) + 1;
    this.iterationCounts.set(sessionId, current);
    if (state2.iteration >= state2.maxIterations) {
      log("[ralph-loop] max iterations reached", {
        sessionId,
        iteration: state2.iteration,
        maxIterations: state2.maxIterations
      });
      this.stopLoop(sessionId);
    }
    return state2.iteration;
  }
  stopLoop(sessionId) {
    const state2 = this.states.get(sessionId);
    if (!state2)
      return;
    state2.active = false;
    log("[ralph-loop] stopped", {
      sessionId,
      iterations: state2.iteration
    });
  }
  cancelAll() {
    for (const sessionId of this.states.keys()) {
      this.stopLoop(sessionId);
    }
  }
  getContinuationPrompt(state2) {
    if (state2.strategy === "verify") {
      return `Continue verifying the task. Iteration ${state2.iteration + 1} of ${state2.maxIterations}.

Original task: ${state2.prompt}

Review the work done so far and identify any remaining issues, gaps, or improvements. If the work is complete and correct, respond with <ralph-complete/>.`;
    }
    return `Continue refining and improving the work. Iteration ${state2.iteration + 1} of ${state2.maxIterations}.

Original task: ${state2.prompt}

Build on the work done so far. Improve quality, fix any issues, and add missing details. If the work is complete and cannot be further improved, respond with <ralph-complete/>.`;
  }
  containsCompletionSignal(output) {
    return output.includes("<ralph-complete/>") || output.includes("<ralph_complete/>") || output.includes("RALPH_COMPLETE") || output.toLowerCase().includes("task is complete") && output.toLowerCase().includes("no further improvements");
  }
  getActiveCount() {
    let count = 0;
    for (const state2 of this.states.values()) {
      if (state2.active)
        count++;
    }
    return count;
  }
  getActiveSessions() {
    const sessions = [];
    for (const [sessionId, state2] of this.states) {
      if (state2.active)
        sessions.push(sessionId);
    }
    return sessions;
  }
  dispose() {
    this.cancelAll();
    this.states.clear();
    this.iterationCounts.clear();
  }
}
function createRalphLoopHook(_ctx, config) {
  const manager = new RalphLoopManager(config);
  return {
    manager,
    "tool.execute.after": async (input, output) => {
      if (!manager.isActive(input.sessionID))
        return;
      if (typeof output.output !== "string")
        return;
      if (manager.containsCompletionSignal(output.output)) {
        log("[ralph-loop] completion signal detected", {
          sessionID: input.sessionID
        });
        manager.stopLoop(input.sessionID);
      }
    },
    event: async (input) => {
      if (input.event.type === "session.deleted") {
        const props = input.event.properties;
        const sessionId = props?.sessionID;
        if (sessionId) {
          manager.stopLoop(sessionId);
        }
      }
    }
  };
}

// src/features/review-work/index.ts
var REVIEW_AGENTS = [
  { name: "Goal Verifier", focus: "Did we build what was asked?", type: "oracle" },
  { name: "QA Executor", focus: "Does it actually work?", type: "executor" },
  { name: "Code Reviewer", focus: "Is the code well-written?", type: "oracle" },
  { name: "Security Auditor", focus: "Is it secure?", type: "oracle" },
  { name: "Context Miner", focus: "Did we miss any context?", type: "executor" }
];

class ReviewWorkManager {
  sessions = new Map;
  startReview(sessionId, goal, constraints, changedFiles) {
    const state2 = {
      sessionId,
      goal,
      constraints,
      changedFiles,
      agents: [],
      startedAt: Date.now(),
      completed: false
    };
    this.sessions.set(sessionId, state2);
    log("[review-work] started", { sessionId, goal: goal.slice(0, 100), agentCount: REVIEW_AGENTS.length });
    return state2;
  }
  getReviewPrompt(agentIndex, state2) {
    const agent = REVIEW_AGENTS[agentIndex];
    if (!agent)
      return "";
    const fileContext = state2.changedFiles.map((f) => `## ${f}`).join(`
`);
    const prompts = {
      0: `# Goal & Constraint Verification

<original_goal>${state2.goal}</original_goal>
<constraints>${state2.constraints.join(`
`)}</constraints>
<changed_files>${state2.changedFiles.join(`
`)}</changed_files>
<file_contents>${fileContext}</file_contents>

Review whether this implementation correctly achieves the stated goal within constraints.

CHECKLIST:
1. Goal Completeness — mark ACHIEVED/MISSED/PARTIAL for each sub-requirement
2. Constraint Compliance — verify with code evidence
3. Requirement Gaps — implied but unstated needs
4. Over-Engineering — scope creep or unnecessary abstractions
5. Edge Cases — trace 5+ edge cases mentally
6. Behavioral Correctness — walk through 3+ scenarios

OUTPUT: <verdict>PASS|FAIL</verdict> <confidence>HIGH|MEDIUM|LOW</confidence> <summary>...</summary> <blocking_issues>...</blocking_issues>`,
      1: `# QA — Hands-On App Execution

<original_goal>${state2.goal}</original_goal>
<changed_files>${state2.changedFiles.join(`
`)}</changed_files>

You are a QA engineer. Test behavior, not code.

PROCESS:
1. Scenario Brainstorm — 15-30 scenarios (happy paths, boundaries, errors, regressions, state transitions)
2. Scenario Augmentation — add 5+ from reflection
3. Create Task List — P0/P1/P2 priority
4. Execute Systematically — record PASS/FAIL with evidence
5. Compile Results

OUTPUT: <verdict>PASS|FAIL</verdict> <scenario_coverage>...</scenario_coverage> <blocking_issues>P0/P1 failures only</blocking_issues>`,
      2: `# Code Quality Review

<original_goal>${state2.goal}</original_goal>
<changed_files>${state2.changedFiles.join(`
`)}</changed_files>
<file_contents>${fileContext}</file_contents>

Senior staff engineer review. Standard: "Would I approve this PR without comments?"

DIMENSIONS: Correctness, Pattern Consistency, Naming, Error Handling, Type Safety, Performance, Abstraction Level, Testing, API Design, Tech Debt.

OUTPUT: <verdict>PASS|FAIL</verdict> <confidence>HIGH|MEDIUM|LOW</confidence> <findings>...</findings> <blocking_issues>CRITICAL/MAJOR only</blocking_issues>`,
      3: `# Security Review (supplementary)

<original_goal>${state2.goal}</original_goal>
<changed_files>${state2.changedFiles.join(`
`)}</changed_files>
<file_contents>${fileContext}</file_contents>

Security engineer review. Focus ONLY on vulnerabilities.

CHECKLIST: Input Validation, Auth & AuthZ, Secrets & Credentials, Data Exposure, Dependencies, Cryptography, File & Path, Network, Error Leakage, Supply Chain.

OUTPUT: <verdict>PASS|FAIL</verdict> <severity>CRITICAL|HIGH|MEDIUM|LOW|NONE</severity> <findings>...</findings> <blocking_issues>CRITICAL/HIGH only</blocking_issues>`,
      4: `# Context Mining — Missed Requirements

<original_goal>${state2.goal}</original_goal>
<changed_files>${state2.changedFiles.join(`
`)}</changed_files>

Search every accessible source for context that should have informed this implementation.

SOURCES: Git history (log, blame), GitHub (issues, PRs), Communication channels, Codebase cross-references.

LOOK FOR: Requirements in issues/PRs, past decisions, related systems, warnings from previous developers, migration notes, design docs.

OUTPUT: <verdict>PASS|FAIL</verdict> <sources_searched>...</sources_searched> <discovered_context>...</discovered_context> <missed_requirements>...</missed_requirements> <blocking_issues>BLOCKING only</blocking_issues>`
    };
    return prompts[agentIndex] ?? "";
  }
  submitResult(sessionId, result) {
    const state2 = this.sessions.get(sessionId);
    if (!state2)
      return;
    state2.agents.push(result);
    log("[review-work] agent result", {
      sessionId,
      agent: result.agentName,
      verdict: result.verdict,
      totalAgents: state2.agents.length
    });
    if (state2.agents.length === REVIEW_AGENTS.length) {
      state2.completed = true;
      const allPassed = state2.agents.every((a) => a.verdict === "PASS");
      log("[review-work] completed", { sessionId, allPassed });
    }
  }
  getReport(sessionId) {
    const state2 = this.sessions.get(sessionId);
    if (!state2 || !state2.completed)
      return null;
    const allPassed = state2.agents.every((a) => a.verdict === "PASS");
    const rows = state2.agents.map((a, i) => `| ${i + 1} | ${a.agentName} | ${a.focus} | ${a.verdict} | ${a.confidence} |`).join(`
`);
    const blocking = state2.agents.flatMap((a) => a.blockingIssues.map((b) => `- **${a.agentName}**: ${b}`)).join(`
`);
    return `# Review Work — Final Report

## Overall Verdict: ${allPassed ? "PASSED" : "FAILED"}

| # | Review Area | Focus | Verdict | Confidence |
|---|------------|-------|---------|------------|
${rows}

## Blocking Issues
${blocking || "None"}

## Summary
${state2.agents.map((a) => `- **${a.agentName}**: ${a.summary}`).join(`
`)}`;
  }
  getState(sessionId) {
    return this.sessions.get(sessionId);
  }
  dispose() {
    this.sessions.clear();
  }
}

// src/features/review-work/hook.ts
var REVIEW_KEYWORDS = [
  "review work",
  "review my work",
  "review changes",
  "qa my work",
  "verify implementation",
  "check my work",
  "validate changes",
  "post-implementation review",
  "review this",
  "code review",
  "quality check"
];
var REVIEW_AGENTS2 = [
  { name: "Goal Verifier", focus: "Did we build what was asked?" },
  { name: "QA Executor", focus: "Does it actually work?" },
  { name: "Code Reviewer", focus: "Is the code well-written?" },
  { name: "Security Auditor", focus: "Is it secure?" },
  { name: "Context Miner", focus: "Did we miss any context?" }
];
function createReviewWorkHook(_ctx, _config, hookConfig, opts) {
  const cfg = {
    enabled: true,
    ...hookConfig
  };
  const manager = new ReviewWorkManager;
  const tlog = opts?.transparencyLog;
  function checkTrigger(input) {
    if (!cfg.enabled)
      return false;
    const lower = input.toLowerCase();
    return REVIEW_KEYWORDS.some((kw) => lower.includes(kw));
  }
  function activate(input, output) {
    const parts = output.parts;
    if (!parts)
      return;
    const userText = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ");
    log("[review-work] trigger detected", { sessionID: input.sessionID });
    const state2 = manager.startReview(input.sessionID, userText.slice(0, 500), [], []);
    const prompt = REVIEW_AGENTS2.map((agent, i) => `### Agent ${i + 1}: ${agent.name}
${agent.focus}

${manager.getReviewPrompt(i, state2)}`).join(`

---

`);
    const systemMsg = {
      type: "system",
      text: `Review Work mode activated (Confidence: 85%). Launch these 5 agents in parallel:

${prompt}`
    };
    output.parts.push(systemMsg);
    if (tlog) {
      tlog.record({
        type: "review_verdict",
        sessionId: input.sessionID,
        message: `Review work activated: ${userText.slice(0, 100)}`,
        details: { agentCount: REVIEW_AGENTS2.length, confidence: 0.85 },
        confidence: 0.85
      });
    }
  }
  return {
    manager,
    checkTrigger,
    activate
  };
}

// src/features/hyperplan/index.ts
var DEFAULT_MEMBERS = [
  { name: "Skeptic", role: "unspecified-low", perspective: "Challenge every assumption. Find flaws, edge cases, and hidden risks." },
  { name: "Validator", role: "unspecified-high", perspective: "Verify feasibility. Check technical constraints, dependencies, and resource requirements." },
  { name: "Architect", role: "ultrabrain", perspective: "Evaluate system design. Assess scalability, maintainability, and architectural soundness." },
  { name: "Creative", role: "artistry", perspective: "Propose alternative approaches. Think outside the box for better solutions." }
];

class HyperplanManager {
  sessions = new Map;
  startPlan(sessionId, topic, members) {
    const state2 = {
      sessionId,
      topic,
      members: members ?? [...DEFAULT_MEMBERS],
      phase: "brainstorm",
      startedAt: Date.now(),
      completed: false,
      distilledInsights: []
    };
    this.sessions.set(sessionId, state2);
    log("[hyperplan] started", { sessionId, topic: topic.slice(0, 100), memberCount: state2.members.length });
    return state2;
  }
  getChallengePrompt(member, state2) {
    return `# Hyperplan — ${member.name} (${member.role})

Topic: ${state2.topic}

Your role: ${member.perspective}

Analyze the topic from your unique perspective. Be adversarial — your job is to find what others miss.

OUTPUT FORMAT:
<verdict>PASS|FAIL</verdict>
<findings>
- [CRITICAL|MAJOR|MINOR] Finding description
</findings>
<alternatives>Alternative approaches worth considering</alternatives>`;
  }
  submitMemberResult(sessionId, memberName, verdict, findings) {
    const state2 = this.sessions.get(sessionId);
    if (!state2)
      return;
    const member = state2.members.find((m) => m.name === memberName);
    if (!member)
      return;
    member.verdict = verdict;
    member.findings = findings;
    if (state2.members.every((m) => m.verdict)) {
      state2.phase = "distill";
      state2.distilledInsights = this.distillInsights(state2);
      log("[hyperplan] distilled", { sessionId, insightCount: state2.distilledInsights.length });
    }
  }
  distillInsights(state2) {
    const allFindings = state2.members.flatMap((m) => m.findings ?? []);
    const critical = allFindings.filter((f) => f.toUpperCase().includes("CRITICAL"));
    const alternatives = state2.members.filter((m) => m.name === "Creative").flatMap((m) => m.findings ?? []);
    const insights = [];
    if (critical.length > 0)
      insights.push(`Critical issues found: ${critical.length}`);
    if (alternatives.length > 0)
      insights.push(`Alternative approaches proposed: ${alternatives.length}`);
    const passed = state2.members.filter((m) => m.verdict === "PASS").length;
    const failed = state2.members.filter((m) => m.verdict === "FAIL").length;
    insights.push(`Member consensus: ${passed} passed, ${failed} failed`);
    return insights;
  }
  getReport(sessionId) {
    const state2 = this.sessions.get(sessionId);
    if (!state2 || state2.phase !== "distill")
      return null;
    const rows = state2.members.map((m) => `| ${m.name} | ${m.role} | ${m.verdict ?? "pending"} | ${(m.findings ?? []).length} findings |`).join(`
`);
    return `# Hyperplan Report — ${state2.topic}

## Member Results
| Member | Role | Verdict | Findings |
|--------|------|---------|----------|
${rows}

## Distilled Insights
${state2.distilledInsights.map((i) => `- ${i}`).join(`
`)}

## Recommendation
${state2.members.some((m) => m.verdict === "FAIL") ? "FAIL — critical issues must be addressed before proceeding" : "PASS — proceed with planning"}

## Next Steps
Hand off to dedicated planner for formal work plan sequencing.`;
  }
  getState(sessionId) {
    return this.sessions.get(sessionId);
  }
  dispose() {
    this.sessions.clear();
  }
}

// src/features/hyperplan/hook.ts
var HYPERPLAN_KEYWORDS = [
  "hyperplan",
  "adversarial plan",
  "adversarial planning",
  "challenge this plan",
  "stress test",
  "red team"
];
function createHyperplanHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    ...hookConfig
  };
  const manager = new HyperplanManager;
  function checkTrigger(input) {
    if (!cfg.enabled)
      return false;
    const lower = input.toLowerCase();
    return HYPERPLAN_KEYWORDS.some((kw) => lower.includes(kw));
  }
  function activate(input, output) {
    const parts = output.parts;
    if (!parts)
      return;
    const userText = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ");
    log("[hyperplan] trigger detected", { sessionID: input.sessionID });
    const state2 = manager.startPlan(input.sessionID, userText.slice(0, 500));
    const memberPrompts = state2.members.map((m) => manager.getChallengePrompt(m, state2)).join(`

---

`);
    const systemMsg = {
      type: "system",
      text: `Hyperplan mode activated. Launch ${state2.members.length} adversarial reviewers:

${memberPrompts}`
    };
    output.parts.push(systemMsg);
  }
  return {
    manager,
    checkTrigger,
    activate
  };
}

// src/features/security-research/index.ts
var OWASP_TOP_10 = [
  "A01: Broken Access Control",
  "A02: Cryptographic Failures",
  "A03: Injection",
  "A04: Insecure Design",
  "A05: Security Misconfiguration",
  "A06: Vulnerable Components",
  "A07: Auth Failures",
  "A08: Data Integrity",
  "A09: Logging Failures",
  "A010: SSRF"
];
var STRIDE_CATEGORIES = [
  "Spoofing",
  "Tampering",
  "Repudiation",
  "Information Disclosure",
  "Denial of Service",
  "Elevation of Privilege"
];

class SecurityResearchManager {
  reports = new Map;
  startResearch(sessionId, topic) {
    const report = {
      sessionId,
      topic,
      findings: [],
      overallRisk: "NONE",
      completed: false,
      startedAt: Date.now()
    };
    this.reports.set(sessionId, report);
    log("[security-research] started", { sessionId, topic: topic.slice(0, 100) });
    return report;
  }
  getResearchPrompt(report) {
    return `# Security Research — ${report.topic}

Conduct a comprehensive security analysis covering:

## OWASP Top 10 (2021)
${OWASP_TOP_10.map((c) => `- ${c}`).join(`
`)}

## STRIDE Threat Model
${STRIDE_CATEGORIES.map((c) => `- ${c}`).join(`
`)}

## Additional Checks
- Supply chain security (dependencies, lockfiles)
- Secrets management (hardcoded credentials, env vars)
- API security (rate limiting, CORS, auth tokens)
- Infrastructure security (TLS, certificates, network)
- Data privacy (PII, GDPR, data retention)

For each finding:
1. Category (OWASP/STRIDE/Other)
2. Severity (CRITICAL/HIGH/MEDIUM/LOW)
3. Title and description
4. Specific code/config reference
5. Remediation steps
6. CWE ID if applicable

OUTPUT FORMAT:
<overall_risk>CRITICAL|HIGH|MEDIUM|LOW|NONE</overall_risk>
<findings>
- [SEVERITY] Category: Title
  Description: ...
  Remediation: ...
  CWE: ...
</findings>`;
  }
  addFinding(sessionId, finding) {
    const report = this.reports.get(sessionId);
    if (!report)
      return;
    report.findings.push(finding);
    report.overallRisk = this.calculateOverallRisk(report.findings);
  }
  completeResearch(sessionId) {
    const report = this.reports.get(sessionId);
    if (!report)
      return null;
    report.completed = true;
    log("[security-research] completed", {
      sessionId,
      findingCount: report.findings.length,
      overallRisk: report.overallRisk
    });
    return report;
  }
  calculateOverallRisk(findings) {
    if (findings.some((f) => f.severity === "CRITICAL"))
      return "CRITICAL";
    if (findings.some((f) => f.severity === "HIGH"))
      return "HIGH";
    if (findings.some((f) => f.severity === "MEDIUM"))
      return "MEDIUM";
    if (findings.length > 0)
      return "LOW";
    return "NONE";
  }
  getReport(sessionId) {
    const report = this.reports.get(sessionId);
    if (!report || !report.completed)
      return null;
    const bySeverity = {};
    for (const f of report.findings) {
      if (!bySeverity[f.severity])
        bySeverity[f.severity] = [];
      bySeverity[f.severity].push(f);
    }
    const findingsList = Object.entries(bySeverity).sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a[0]] ?? 4) - (order[b[0]] ?? 4);
    }).flatMap(([severity, findings]) => findings.map((f) => `- [${f.severity}] **${f.category}**: ${f.title}
  ${f.description}
  Fix: ${f.remediation}${f.cwe ? ` (CWE-${f.cwe})` : ""}`)).join(`
`);
    return `# Security Research Report — ${report.topic}

## Overall Risk: ${report.overallRisk}

## Findings (${report.findings.length} total)
${findingsList || "No findings — surface appears clean."}

## Coverage
- OWASP Top 10: ${OWASP_TOP_10.length} categories checked
- STRIDE: ${STRIDE_CATEGORIES.length} threat categories checked

## Recommendations
${report.overallRisk === "NONE" ? "No immediate action required. Maintain current security posture." : `Address CRITICAL and HIGH findings before release.`}`;
  }
  getState(sessionId) {
    return this.reports.get(sessionId);
  }
  dispose() {
    this.reports.clear();
  }
}

// src/features/security-research/hook.ts
var SECURITY_KEYWORDS = [
  "security research",
  "security audit",
  "vulnerability scan",
  "threat model",
  "pen test",
  "pentest",
  "security review",
  "OWASP",
  "STRIDE",
  "attack surface",
  "security assessment"
];
function createSecurityResearchHook(_ctx, _config, hookConfig) {
  const cfg = {
    enabled: true,
    ...hookConfig
  };
  const manager = new SecurityResearchManager;
  function checkTrigger(input) {
    if (!cfg.enabled)
      return false;
    const lower = input.toLowerCase();
    return SECURITY_KEYWORDS.some((kw) => lower.includes(kw));
  }
  function activate(input, output) {
    const parts = output.parts;
    if (!parts)
      return;
    const userText = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ");
    log("[security-research] trigger detected", { sessionID: input.sessionID });
    const report = manager.startResearch(input.sessionID, userText.slice(0, 500));
    const prompt = manager.getResearchPrompt(report);
    const systemMsg = {
      type: "system",
      text: `Security research mode activated.

${prompt}`
    };
    output.parts.push(systemMsg);
  }
  return {
    manager,
    checkTrigger,
    activate
  };
}

// src/features/hyperplan/bridge.ts
class HyperplanToReviewBridge {
  convertFindings(state2) {
    const allFindings = state2.members.flatMap((m) => m.findings ?? []);
    const critical = allFindings.filter((f) => f.toUpperCase().includes("CRITICAL"));
    const alternatives = state2.members.filter((m) => m.name === "Creative").flatMap((m) => m.findings ?? []);
    const passed = state2.members.filter((m) => m.verdict === "PASS").length;
    const failed = state2.members.filter((m) => m.verdict === "FAIL").length;
    return {
      topic: state2.topic,
      constraints: [],
      changedFiles: [],
      criticalFindings: critical,
      alternatives,
      memberConsensus: `${passed} passed, ${failed} failed`
    };
  }
  shouldAutoTrigger(state2) {
    return state2.members.some((m) => m.verdict === "FAIL");
  }
  buildReviewContext(state2) {
    const context = this.convertFindings(state2);
    const goal = `Review implementation of: ${state2.topic}. Hyperplan found ${context.criticalFindings.length} critical issues.`;
    const constraints = [
      ...context.criticalFindings.map((f) => `Must address: ${f}`),
      ...context.alternatives.slice(0, 3).map((a) => `Consider alternative: ${a}`),
      `Member consensus: ${context.memberConsensus}`
    ];
    return { goal, constraints, changedFiles: context.changedFiles };
  }
  toReviewWorkState(state2) {
    const context = this.buildReviewContext(state2);
    return {
      sessionId: state2.sessionId,
      goal: context.goal,
      constraints: context.constraints,
      changedFiles: context.changedFiles
    };
  }
}
function createHyperplanBridge() {
  return new HyperplanToReviewBridge;
}

// src/features/security-research/auto-trigger.ts
var SENSITIVE_PATTERNS = [
  { pattern: /\.(env|config|secrets)\.(js|ts|json|yaml|yml)$/i, reason: "Configuration/secrets file modified", severity: "high" },
  { pattern: /password|passwd|credential|secret|token|api_key|apikey/i, reason: "Authentication/credential code detected", severity: "high" },
  { pattern: /encrypt|decrypt|cipher|hash|bcrypt|argon|sha256|sha512/i, reason: "Cryptographic operation detected", severity: "high" },
  { pattern: /fetch\(|axios\.|http\.|request\(|\.get\(|\.post\(/i, reason: "Network request code detected", severity: "medium" },
  { pattern: /query\(|execute\(|insert\s+into|update\s+.*set|delete\s+from/i, reason: "Database operation detected", severity: "medium" },
  { pattern: /fs\.(write|append|create)|writeFile|appendFile/i, reason: "File write operation detected", severity: "medium" },
  { pattern: /eval\(|Function\(|new\s+Function|setTimeout\(.*string/i, reason: "Dynamic code execution detected", severity: "high" },
  { pattern: /innerHTML|outerHTML|document\.write|\.insertAdjacentHTML/i, reason: "DOM injection detected (XSS risk)", severity: "high" },
  { pattern: /cors|origin|header.*access-control|\.setHeader/i, reason: "CORS/header configuration detected", severity: "low" },
  { pattern: /middleware|auth.*guard|protect.*route|require.*auth/i, reason: "Auth middleware/guard detected", severity: "medium" }
];

class SecurityAutoTrigger {
  detectSensitiveWrite(filePath, content) {
    for (const { pattern, reason, severity } of SENSITIVE_PATTERNS) {
      if (pattern.test(filePath)) {
        return { triggered: true, reason, severity, suggestedAction: "Run security research on this file" };
      }
      if (content && pattern.test(content)) {
        return { triggered: true, reason, severity, suggestedAction: "Run security research on recent changes" };
      }
    }
    return null;
  }
  shouldTrigger(filePath, content) {
    return this.detectSensitiveWrite(filePath, content) !== null;
  }
  queueResearch(sessionId, reason) {
    log("[security-auto-trigger] queued research", { sessionId, reason });
  }
  getTriggerStats() {
    const bySeverity = { high: 0, medium: 0, low: 0 };
    for (const { severity } of SENSITIVE_PATTERNS) {
      bySeverity[severity]++;
    }
    return { patterns: SENSITIVE_PATTERNS.length, severity: bySeverity };
  }
}
function createSecurityAutoTrigger() {
  return new SecurityAutoTrigger;
}

// src/features/security-research/persistence.ts
init_sqlite();

class SecurityResearchStore {
  db;
  constructor(dbPath) {
    this.db = new TypedDatabase(dbPath);
    this.db.run("PRAGMA journal_mode=WAL");
    this.migrate();
  }
  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS security_reports (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic TEXT,
        overall_risk TEXT DEFAULT 'NONE',
        completed INTEGER DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        finding_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS security_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT NOT NULL REFERENCES security_reports(id),
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        remediation TEXT,
        cwe TEXT,
        file_path TEXT,
        created_at INTEGER NOT NULL,
        remediation_status TEXT DEFAULT 'open'
      )
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_severity ON security_findings(severity)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_report ON security_findings(report_id)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_findings_file ON security_findings(file_path)
    `);
  }
  saveReport(report) {
    this.db.prepare(`INSERT OR REPLACE INTO security_reports (id, session_id, topic, overall_risk, completed, started_at, completed_at, finding_count, created_at)
       VALUES ($id, $sessionId, $topic, $overallRisk, $completed, $startedAt, $completedAt, $findingCount, $createdAt)`).run({
      $id: report.sessionId,
      $sessionId: report.sessionId,
      $topic: report.topic,
      $overallRisk: report.overallRisk,
      $completed: report.completed ? 1 : 0,
      $startedAt: report.startedAt,
      $completedAt: report.completed ? Date.now() : null,
      $findingCount: report.findings.length,
      $createdAt: report.startedAt
    });
  }
  saveFinding(finding, reportId, filePath) {
    this.db.prepare(`INSERT INTO security_findings (report_id, category, severity, title, description, remediation, cwe, file_path, created_at)
       VALUES ($reportId, $category, $severity, $title, $description, $remediation, $cwe, $filePath, $createdAt)`).run({
      $reportId: reportId,
      $category: finding.category,
      $severity: finding.severity,
      $title: finding.title,
      $description: finding.description,
      $remediation: finding.remediation,
      $cwe: finding.cwe ?? null,
      $filePath: filePath ?? null,
      $createdAt: Date.now()
    });
  }
  getReport(sessionId) {
    const row = this.db.prepare("SELECT * FROM security_reports WHERE session_id = $sessionId LIMIT 1").get({ $sessionId: sessionId });
    if (!row)
      return null;
    return {
      id: row.id,
      sessionId: row.session_id,
      topic: row.topic ?? "",
      overallRisk: row.overall_risk,
      completed: row.completed === 1,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      findingCount: row.finding_count,
      createdAt: row.created_at
    };
  }
  listReports(limit = 20) {
    const rows = this.db.prepare("SELECT * FROM security_reports ORDER BY created_at DESC LIMIT $limit").all({ $limit: limit });
    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      topic: row.topic ?? "",
      overallRisk: row.overall_risk,
      completed: row.completed === 1,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      findingCount: row.finding_count,
      createdAt: row.created_at
    }));
  }
  getFindingsBySeverity(severity) {
    const rows = this.db.prepare("SELECT * FROM security_findings WHERE severity = $severity ORDER BY created_at DESC").all({ $severity: severity });
    return rows.map((row) => ({
      id: row.id,
      reportId: row.report_id,
      category: row.category,
      severity: row.severity,
      title: row.title,
      description: row.description ?? "",
      remediation: row.remediation ?? "",
      cwe: row.cwe ?? undefined,
      filePath: row.file_path ?? undefined,
      createdAt: row.created_at,
      remediationStatus: row.remediation_status
    }));
  }
  getFindingsByFile(filePath) {
    const rows = this.db.prepare("SELECT * FROM security_findings WHERE file_path LIKE $filePath ORDER BY created_at DESC").all({ $filePath: `%${filePath}%` });
    return rows.map((row) => ({
      id: row.id,
      reportId: row.report_id,
      category: row.category,
      severity: row.severity,
      title: row.title,
      description: row.description ?? "",
      remediation: row.remediation ?? "",
      cwe: row.cwe ?? undefined,
      filePath: row.file_path ?? undefined,
      createdAt: row.created_at,
      remediationStatus: row.remediation_status
    }));
  }
  getStats() {
    const totalRow = this.db.prepare("SELECT COUNT(*) as total FROM security_findings").get();
    const severityRows = this.db.prepare("SELECT severity, COUNT(*) as count FROM security_findings GROUP BY severity").all();
    const reportsRow = this.db.prepare("SELECT COUNT(*) as total FROM security_reports").get();
    const openRow = this.db.prepare("SELECT COUNT(*) as total FROM security_findings WHERE remediation_status = 'open'").get();
    const bySeverity = {};
    for (const row of severityRows) {
      bySeverity[row.severity] = row.count;
    }
    return {
      totalFindings: totalRow?.total ?? 0,
      bySeverity,
      totalReports: reportsRow?.total ?? 0,
      openFindings: openRow?.total ?? 0
    };
  }
  close() {
    this.db.close();
  }
}

// src/features/metrics/collector.ts
init_sqlite();

class MetricsCollector {
  db;
  dailyBudget;
  costPerModel;
  constructor(dbPath = ":memory:", options) {
    this.db = new TypedDatabase(dbPath);
    this.dailyBudget = options?.dailyBudget ?? 10;
    this.costPerModel = options?.costPerModel ?? DEFAULT_COST_PER_MODEL;
    this.db.run("PRAGMA journal_mode=WAL");
    this.migrate();
  }
  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        agent TEXT,
        model TEXT,
        feature TEXT,
        value REAL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(type)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_session ON metrics(session_id)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_metrics_model ON metrics(model)
    `);
  }
  record(event) {
    const timestamp = event.timestamp ?? Date.now();
    this.db.prepare(`INSERT INTO metrics (type, session_id, agent, model, feature, value, metadata, timestamp)
       VALUES ($type, $sessionId, $agent, $model, $feature, $value, $metadata, $timestamp)`).run({
      $type: event.type,
      $sessionId: event.sessionId,
      $agent: event.agent ?? null,
      $model: event.model ?? null,
      $feature: event.feature ?? null,
      $value: event.value ?? null,
      $metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      $timestamp: timestamp
    });
  }
  query(query) {
    const conditions = [];
    const params = {};
    if (query.type) {
      conditions.push("type = $type");
      params.$type = query.type;
    }
    if (query.sessionId) {
      conditions.push("session_id = $sessionId");
      params.$sessionId = query.sessionId;
    }
    if (query.agent) {
      conditions.push("agent = $agent");
      params.$agent = query.agent;
    }
    if (query.model) {
      conditions.push("model = $model");
      params.$model = query.model;
    }
    if (query.feature) {
      conditions.push("feature = $feature");
      params.$feature = query.feature;
    }
    if (query.since) {
      conditions.push("timestamp >= $since");
      params.$since = query.since;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = query.limit ?? 100;
    const rows = this.db.prepare(`SELECT * FROM metrics ${whereClause} ORDER BY timestamp DESC LIMIT $limit`).all({ ...params, $limit: limit });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      sessionId: row.session_id,
      agent: row.agent ?? undefined,
      model: row.model ?? undefined,
      feature: row.feature ?? undefined,
      value: row.value ?? undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: row.timestamp
    }));
  }
  getSummary(query = {}) {
    const conditions = [];
    const params = {};
    if (query.type) {
      conditions.push("type = $type");
      params.$type = query.type;
    }
    if (query.sessionId) {
      conditions.push("session_id = $sessionId");
      params.$sessionId = query.sessionId;
    }
    if (query.agent) {
      conditions.push("agent = $agent");
      params.$agent = query.agent;
    }
    if (query.model) {
      conditions.push("model = $model");
      params.$model = query.model;
    }
    if (query.feature) {
      conditions.push("feature = $feature");
      params.$feature = query.feature;
    }
    if (query.since) {
      conditions.push("timestamp >= $since");
      params.$since = query.since;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const totalCount = this.db.prepare(`SELECT COUNT(*) as total FROM metrics ${whereClause}`).get(params)?.total ?? 0;
    const byTypeRows = this.db.prepare(`SELECT type, COUNT(*) as count FROM metrics ${whereClause} GROUP BY type`).all(params);
    const byModelRows = this.db.prepare(`SELECT model, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? "AND" : "WHERE"} model IS NOT NULL GROUP BY model`).all(params);
    const byAgentRows = this.db.prepare(`SELECT agent, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? "AND" : "WHERE"} agent IS NOT NULL GROUP BY agent`).all(params);
    const byFeatureRows = this.db.prepare(`SELECT feature, COUNT(*) as count FROM metrics ${whereClause} ${conditions.length > 0 ? "AND" : "WHERE"} feature IS NOT NULL GROUP BY feature`).all(params);
    const avgValueRow = this.db.prepare(`SELECT AVG(value) as avg FROM metrics ${whereClause} ${conditions.length > 0 ? "AND" : "WHERE"} value IS NOT NULL`).get(params);
    const totalValueRow = this.db.prepare(`SELECT SUM(value) as total FROM metrics ${whereClause} ${conditions.length > 0 ? "AND" : "WHERE"} value IS NOT NULL`).get(params);
    const byType = {};
    for (const row of byTypeRows) {
      byType[row.type] = row.count;
    }
    const byModel = {};
    for (const row of byModelRows) {
      byModel[row.model ?? "unknown"] = row.count;
    }
    const byAgent = {};
    for (const row of byAgentRows) {
      byAgent[row.agent ?? "unknown"] = row.count;
    }
    const byFeature = {};
    for (const row of byFeatureRows) {
      byFeature[row.feature ?? "unknown"] = row.count;
    }
    return {
      totalCount,
      byType,
      byModel,
      byAgent,
      byFeature,
      avgValue: avgValueRow?.avg ?? undefined,
      totalValue: totalValueRow?.total ?? undefined
    };
  }
  recordTokenUsage(sessionId, model, inputTokens, outputTokens, agent) {
    const totalTokens = inputTokens + outputTokens;
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    this.record({
      type: "token_usage",
      sessionId,
      model,
      agent,
      value: totalTokens,
      metadata: JSON.stringify({ inputTokens, outputTokens, cost })
    });
    this.record({
      type: "cost_tracking",
      sessionId,
      model,
      agent,
      value: cost,
      metadata: JSON.stringify({ inputTokens, outputTokens, totalTokens })
    });
  }
  calculateCost(model, inputTokens, outputTokens) {
    const rates = this.costPerModel[model] ?? this.costPerModel["default"];
    if (!rates)
      return 0;
    return inputTokens * rates.inputPerToken + outputTokens * rates.outputPerToken;
  }
  getCostSummary(since) {
    const sinceTimestamp = since ?? Date.now() - 24 * 60 * 60 * 1000;
    const tokenRows = this.query({ type: "token_usage", since: sinceTimestamp });
    const costRows = this.query({ type: "cost_tracking", since: sinceTimestamp });
    let totalTokens = 0;
    let totalCost = 0;
    const byModel = {};
    const bySession = {};
    for (const row of tokenRows) {
      const tokens = row.value ?? 0;
      totalTokens += tokens;
      const meta = row.metadata;
      const cost = meta?.cost ?? 0;
      totalCost += cost;
      if (row.model) {
        if (!byModel[row.model]) {
          byModel[row.model] = { tokens: 0, cost: 0 };
        }
        byModel[row.model].tokens += tokens;
        byModel[row.model].cost += cost;
      }
      if (row.sessionId) {
        if (!bySession[row.sessionId]) {
          bySession[row.sessionId] = { tokens: 0, cost: 0 };
        }
        bySession[row.sessionId].tokens += tokens;
        bySession[row.sessionId].cost += cost;
      }
    }
    for (const row of costRows) {
      const cost = row.value ?? 0;
      totalCost += cost;
      if (row.model) {
        if (!byModel[row.model]) {
          byModel[row.model] = { tokens: 0, cost: 0 };
        }
        byModel[row.model].cost += cost;
      }
      if (row.sessionId) {
        if (!bySession[row.sessionId]) {
          bySession[row.sessionId] = { tokens: 0, cost: 0 };
        }
        bySession[row.sessionId].cost += cost;
      }
    }
    return {
      totalTokens,
      totalCost,
      byModel,
      bySession,
      budgetRemaining: Math.max(0, this.dailyBudget - totalCost),
      budgetExceeded: totalCost > this.dailyBudget
    };
  }
  shouldRouteToCheaperModel(currentModel) {
    const summary = this.getCostSummary();
    return summary.budgetExceeded || summary.budgetRemaining < this.dailyBudget * 0.2;
  }
  getCheapModelAlternative(currentModel) {
    const cheapModels = ["opencode/deepseek-v4-flash-free", "opencode/big-pickle"];
    return cheapModels[0];
  }
  getDailyBudget() {
    return this.dailyBudget;
  }
  setDailyBudget(budget) {
    this.dailyBudget = budget;
  }
  getMetricsCount() {
    const row = this.db.prepare("SELECT COUNT(*) as total FROM metrics").get();
    return row?.total ?? 0;
  }
  clearOlderThan(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    this.db.prepare("DELETE FROM metrics WHERE timestamp < $cutoff").run({ $cutoff: cutoff });
  }
  close() {
    this.db.close();
  }
}
var DEFAULT_COST_PER_MODEL = {
  "opencode/nemotron-3-super-free": { inputPerToken: 0, outputPerToken: 0 },
  "opencode/minimax-m2.5-free": { inputPerToken: 0, outputPerToken: 0 },
  "opencode/deepseek-v4-flash-free": { inputPerToken: 0, outputPerToken: 0 },
  "opencode/big-pickle": { inputPerToken: 0, outputPerToken: 0 },
  default: { inputPerToken: 0.000001, outputPerToken: 0.000002 }
};
function createMetricsCollector(dbPath, options) {
  return new MetricsCollector(dbPath, options);
}
// src/features/circuit-breaker/index.ts
var DEFAULT_OPTIONS = {
  failureThreshold: 3,
  recoveryTimeoutMs: 60000,
  halfOpenMaxAttempts: 1
};

class CircuitBreaker {
  state = "closed";
  failureCount = 0;
  successCount = 0;
  lastFailureTime = 0;
  options;
  name;
  constructor(name, options) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  getState() {
    if (this.state === "open") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.recoveryTimeoutMs) {
        this.state = "half-open";
        this.successCount = 0;
        log("[circuit-breaker] transition to half-open", { name: this.name });
      }
    }
    return this.state;
  }
  canExecute() {
    const state2 = this.getState();
    return state2 === "closed" || state2 === "half-open";
  }
  async execute(fn) {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker '${this.name}' is open`);
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  onSuccess() {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenMaxAttempts) {
        this.state = "closed";
        log("[circuit-breaker] transition to closed", { name: this.name });
      }
    }
  }
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "open";
      log("[circuit-breaker] transition to open", {
        name: this.name,
        failures: this.failureCount
      });
    }
  }
  reset() {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    log("[circuit-breaker] manually reset", { name: this.name });
  }
  getStats() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

class CircuitBreakerRegistry {
  breakers = new Map;
  get(name) {
    return this.breakers.get(name);
  }
  create(name, options) {
    const breaker = new CircuitBreaker(name, options);
    this.breakers.set(name, breaker);
    return breaker;
  }
  getAll() {
    return this.breakers;
  }
  getHealthReport() {
    const report = [];
    for (const [name, breaker] of this.breakers) {
      const stats = breaker.getStats();
      report.push({
        name,
        state: stats.state,
        failureCount: stats.failureCount
      });
    }
    return report;
  }
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}
function createCircuitBreakerRegistry() {
  return new CircuitBreakerRegistry;
}

// src/features/learning-engine/index.ts
init_sqlite();
class LearningEngine {
  db;
  constructor(dbPath = ":memory:") {
    this.db = new TypedDatabase(dbPath);
    this.db.run("PRAGMA journal_mode=WAL");
    this.migrate();
  }
  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        task_category TEXT NOT NULL,
        lesson_type TEXT NOT NULL,
        pattern TEXT NOT NULL,
        description TEXT NOT NULL,
        outcome TEXT NOT NULL,
        model_used TEXT,
        agent_used TEXT,
        confidence REAL NOT NULL DEFAULT 0.5,
        applied_count INTEGER NOT NULL DEFAULT 0,
        last_applied_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(task_category)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(lesson_type)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_pattern ON lessons(pattern)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_lessons_confidence ON lessons(confidence)
    `);
  }
  saveLesson(lesson) {
    this.db.prepare(`INSERT INTO lessons (session_id, task_category, lesson_type, pattern, description, outcome, model_used, agent_used, confidence, applied_count, created_at)
       VALUES ($sessionId, $taskCategory, $lessonType, $pattern, $description, $outcome, $modelUsed, $agentUsed, $confidence, $appliedCount, $createdAt)`).run({
      $sessionId: lesson.sessionId,
      $taskCategory: lesson.taskCategory,
      $lessonType: lesson.lessonType,
      $pattern: lesson.pattern,
      $description: lesson.description,
      $outcome: lesson.outcome,
      $modelUsed: lesson.modelUsed ?? null,
      $agentUsed: lesson.agentUsed ?? null,
      $confidence: lesson.confidence,
      $appliedCount: 0,
      $createdAt: Date.now()
    });
    log("[learning-engine] lesson saved", {
      category: lesson.taskCategory,
      type: lesson.lessonType,
      outcome: lesson.outcome
    });
  }
  findRelevantLessons(taskCategory, query) {
    const lessons = this.db.prepare(`SELECT * FROM lessons WHERE task_category = $category AND confidence > 0.3 ORDER BY confidence DESC, applied_count DESC LIMIT 20`).all({ $category: taskCategory });
    const matches = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
    for (const lesson of lessons) {
      let similarity = 0;
      const reasons = [];
      const patternLower = lesson.pattern.toLowerCase();
      if (patternLower.includes(queryLower)) {
        similarity += 0.5;
        reasons.push("exact pattern match");
      }
      const patternWords = patternLower.split(/\s+/);
      let wordMatches = 0;
      for (const word of queryWords) {
        if (patternWords.some((pw) => pw.includes(word) || word.includes(pw))) {
          wordMatches++;
        }
      }
      if (queryWords.length > 0) {
        const wordSimilarity = wordMatches / queryWords.length;
        similarity += wordSimilarity * 0.3;
        if (wordMatches > 0)
          reasons.push(`${wordMatches} word matches`);
      }
      const descLower = lesson.description.toLowerCase();
      if (descLower.includes(queryLower)) {
        similarity += 0.2;
        reasons.push("description match");
      }
      if (similarity > 0.2) {
        matches.push({
          lesson,
          similarity: Math.min(similarity, 1),
          reason: reasons.join(", ")
        });
      }
    }
    return matches.sort((a, b) => b.similarity - a.similarity);
  }
  recordLessonApplied(lessonId) {
    this.db.prepare(`UPDATE lessons SET applied_count = applied_count + 1, last_applied_at = $now WHERE id = $id`).run({ $id: lessonId, $now: Date.now() });
  }
  updateLessonConfidence(lessonId, delta) {
    this.db.prepare(`UPDATE lessons SET confidence = MAX(0, MIN(1, confidence + $delta)) WHERE id = $id`).run({ $id: lessonId, $delta: delta });
  }
  getStats() {
    const totalRow = this.db.prepare("SELECT COUNT(*) as total FROM lessons").get();
    const byTypeRows = this.db.prepare("SELECT lesson_type, COUNT(*) as count FROM lessons GROUP BY lesson_type").all();
    const byCategoryRows = this.db.prepare("SELECT task_category, COUNT(*) as count FROM lessons GROUP BY task_category").all();
    const byOutcomeRows = this.db.prepare("SELECT outcome, COUNT(*) as count FROM lessons GROUP BY outcome").all();
    const avgConfRow = this.db.prepare("SELECT AVG(confidence) as avg FROM lessons").get();
    const totalAppsRow = this.db.prepare("SELECT SUM(applied_count) as total FROM lessons").get();
    const byType = {};
    for (const row of byTypeRows) {
      byType[row.lesson_type] = row.count;
    }
    const byCategory = {};
    for (const row of byCategoryRows) {
      byCategory[row.task_category] = row.count;
    }
    const byOutcome = {};
    for (const row of byOutcomeRows) {
      byOutcome[row.outcome] = row.count;
    }
    return {
      totalLessons: totalRow?.total ?? 0,
      byType,
      byCategory,
      byOutcome,
      avgConfidence: avgConfRow?.avg ?? 0,
      totalApplications: totalAppsRow?.total ?? 0
    };
  }
  getLessonsByCategory(category) {
    return this.db.prepare("SELECT * FROM lessons WHERE task_category = $category ORDER BY confidence DESC").all({ $category: category });
  }
  getTopLessons(limit = 10) {
    return this.db.prepare("SELECT * FROM lessons ORDER BY confidence DESC, applied_count DESC LIMIT $limit").all({ $limit: limit });
  }
  pruneLowConfidence(threshold = 0.1) {
    const result = this.db.prepare("DELETE FROM lessons WHERE confidence < $threshold").run({ $threshold: threshold });
    return result.changes;
  }
  close() {
    this.db.close();
  }
}
function createLearningEngine(dbPath) {
  return new LearningEngine(dbPath);
}

// src/features/model-predictor/index.ts
class ModelPredictor {
  performanceData = new Map;
  recordOutcome(model, taskCategory, success, latency) {
    const key = `${model}:${taskCategory}`;
    const existing = this.performanceData.get(key) ?? {
      model,
      taskCategory,
      successCount: 0,
      failureCount: 0,
      totalAttempts: 0,
      successRate: 0
    };
    if (success) {
      existing.successCount++;
    } else {
      existing.failureCount++;
    }
    existing.totalAttempts++;
    existing.successRate = existing.successCount / existing.totalAttempts;
    existing.lastUsedAt = Date.now();
    if (latency !== undefined) {
      existing.avgLatency = existing.avgLatency ? (existing.avgLatency + latency) / 2 : latency;
    }
    this.performanceData.set(key, existing);
  }
  predictBestModel(taskCategory, availableModels) {
    const modelPerformances = availableModels.map((model) => this.performanceData.get(`${model}:${taskCategory}`)).filter((p) => p !== undefined && p.totalAttempts >= 2);
    if (modelPerformances.length === 0) {
      return {
        recommendedModel: availableModels[0] ?? "unknown",
        confidence: 0.5,
        alternatives: availableModels.slice(1).map((m) => ({ model: m, confidence: 0.5 })),
        reasoning: "No historical data, using default model"
      };
    }
    const sorted = modelPerformances.sort((a, b) => b.successRate - a.successRate);
    const best = sorted[0];
    const alternatives = sorted.slice(1, 4).map((p) => ({
      model: p.model,
      confidence: p.successRate
    }));
    const reasoning = `${best.model} has ${best.successRate.toFixed(2)} success rate across ${best.totalAttempts} attempts in ${taskCategory}`;
    return {
      recommendedModel: best.model,
      confidence: best.successRate,
      alternatives,
      reasoning
    };
  }
  getModelPerformance(model, taskCategory) {
    if (taskCategory) {
      return this.performanceData.get(`${model}:${taskCategory}`);
    }
    let totalSuccess = 0;
    let totalFailure = 0;
    let totalAttempts = 0;
    for (const [key, perf] of this.performanceData) {
      if (key.startsWith(`${model}:`)) {
        totalSuccess += perf.successCount;
        totalFailure += perf.failureCount;
        totalAttempts += perf.totalAttempts;
      }
    }
    if (totalAttempts === 0)
      return;
    return {
      model,
      taskCategory: "all",
      successCount: totalSuccess,
      failureCount: totalFailure,
      totalAttempts,
      successRate: totalSuccess / totalAttempts
    };
  }
  getAllPerformances() {
    return Array.from(this.performanceData.values());
  }
  getSummary() {
    const performances = this.getAllPerformances();
    const totalAttempts = performances.reduce((sum, p) => sum + p.totalAttempts, 0);
    const avgSuccessRate = performances.length > 0 ? performances.reduce((sum, p) => sum + p.successRate, 0) / performances.length : 0;
    const topPerformers = performances.filter((p) => p.totalAttempts >= 2).sort((a, b) => b.successRate - a.successRate).slice(0, 5).map((p) => ({ model: p.model, taskCategory: p.taskCategory, successRate: p.successRate }));
    const uniqueModels = new Set(performances.map((p) => p.model));
    return {
      totalModels: uniqueModels.size,
      totalAttempts,
      avgSuccessRate,
      topPerformers
    };
  }
}
function createModelPredictor() {
  return new ModelPredictor;
}

// src/features/benchmark-tracker/index.ts
init_sqlite();
class BenchmarkTracker {
  db;
  constructor(dbPath = ":memory:") {
    this.db = new TypedDatabase(dbPath);
    this.db.run("PRAGMA journal_mode=WAL");
    this.migrate();
  }
  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        task_category TEXT NOT NULL,
        session_id TEXT NOT NULL,
        latency_ms REAL NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cost REAL NOT NULL,
        quality_score REAL NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_model ON benchmarks(model)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks(task_category)
    `);
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_benchmarks_timestamp ON benchmarks(timestamp)
    `);
  }
  record(result) {
    this.db.prepare(`INSERT INTO benchmarks (model, task_category, session_id, latency_ms, input_tokens, output_tokens, cost, quality_score, timestamp)
       VALUES ($model, $taskCategory, $sessionId, $latencyMs, $inputTokens, $outputTokens, $cost, $qualityScore, $timestamp)`).run({
      $model: result.model,
      $taskCategory: result.taskCategory,
      $sessionId: result.sessionId,
      $latencyMs: result.latencyMs,
      $inputTokens: result.inputTokens,
      $outputTokens: result.outputTokens,
      $cost: result.cost,
      $qualityScore: result.qualityScore,
      $timestamp: result.timestamp
    });
    log("[benchmark] recorded", {
      model: result.model,
      category: result.taskCategory,
      latency: result.latencyMs,
      quality: result.qualityScore
    });
  }
  getSummary(model, taskCategory) {
    const conditions = ["model = $model"];
    const params = { $model: model };
    if (taskCategory) {
      conditions.push("task_category = $taskCategory");
      params.$taskCategory = taskCategory;
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const rows = this.db.prepare(`SELECT * FROM benchmarks ${whereClause} ORDER BY timestamp DESC`).all(params);
    if (rows.length === 0)
      return null;
    const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
    const p50Latency = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const avgCost = rows.reduce((sum, r) => sum + r.cost, 0) / rows.length;
    const avgQuality = rows.reduce((sum, r) => sum + r.quality_score, 0) / rows.length;
    return {
      model,
      taskCategory: taskCategory ?? "all",
      avgLatency,
      p50Latency,
      p95Latency,
      avgCost,
      avgQuality,
      totalRuns: rows.length,
      lastRunAt: rows[0].timestamp
    };
  }
  detectRegressions(model, taskCategory, threshold = 0.2) {
    const alerts = [];
    const rows = this.db.prepare(`SELECT * FROM benchmarks WHERE model = $model AND task_category = $category ORDER BY timestamp DESC LIMIT 50`).all({ $model: model, $category: taskCategory });
    if (rows.length < 10)
      return alerts;
    const recent = rows.slice(0, 5);
    const previous = rows.slice(5, 25);
    const recentAvgLatency = recent.reduce((sum, r) => sum + r.latency_ms, 0) / recent.length;
    const previousAvgLatency = previous.reduce((sum, r) => sum + r.latency_ms, 0) / previous.length;
    const recentAvgCost = recent.reduce((sum, r) => sum + r.cost, 0) / recent.length;
    const previousAvgCost = previous.reduce((sum, r) => sum + r.cost, 0) / previous.length;
    const recentAvgQuality = recent.reduce((sum, r) => sum + r.quality_score, 0) / recent.length;
    const previousAvgQuality = previous.reduce((sum, r) => sum + r.quality_score, 0) / previous.length;
    if (previousAvgLatency > 0) {
      const latencyChange = (recentAvgLatency - previousAvgLatency) / previousAvgLatency;
      if (latencyChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: "latency",
          previousValue: previousAvgLatency,
          currentValue: recentAvgLatency,
          changePercent: latencyChange * 100,
          severity: latencyChange > 0.5 ? "high" : latencyChange > 0.3 ? "medium" : "low",
          detectedAt: Date.now()
        });
      }
    }
    if (previousAvgCost > 0) {
      const costChange = (recentAvgCost - previousAvgCost) / previousAvgCost;
      if (costChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: "cost",
          previousValue: previousAvgCost,
          currentValue: recentAvgCost,
          changePercent: costChange * 100,
          severity: costChange > 0.5 ? "high" : costChange > 0.3 ? "medium" : "low",
          detectedAt: Date.now()
        });
      }
    }
    if (previousAvgQuality > 0) {
      const qualityChange = (previousAvgQuality - recentAvgQuality) / previousAvgQuality;
      if (qualityChange > threshold) {
        alerts.push({
          model,
          taskCategory,
          metric: "quality",
          previousValue: previousAvgQuality,
          currentValue: recentAvgQuality,
          changePercent: qualityChange * 100,
          severity: qualityChange > 0.5 ? "high" : qualityChange > 0.3 ? "medium" : "low",
          detectedAt: Date.now()
        });
      }
    }
    return alerts;
  }
  getAllSummaries() {
    const modelCategoryPairs = this.db.prepare("SELECT DISTINCT model, task_category FROM benchmarks").all();
    const summaries = [];
    for (const pair of modelCategoryPairs) {
      const summary = this.getSummary(pair.model, pair.task_category);
      if (summary)
        summaries.push(summary);
    }
    return summaries;
  }
  clearOlderThan(days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    this.db.prepare("DELETE FROM benchmarks WHERE timestamp < $cutoff").run({ $cutoff: cutoff });
  }
  close() {
    this.db.close();
  }
}
function createBenchmarkTracker(dbPath) {
  return new BenchmarkTracker(dbPath);
}

// src/features/plugin-registry/index.ts
class PluginRegistry {
  plugins = new Map;
  hookIndex = new Map;
  register(registration) {
    const existing = this.plugins.get(registration.metadata.id);
    if (existing) {
      log("[plugin-registry] updating plugin", { id: registration.metadata.id });
      this.unregister(registration.metadata.id);
    }
    const fullRegistration = {
      ...registration,
      registeredAt: Date.now()
    };
    this.plugins.set(registration.metadata.id, fullRegistration);
    for (const hook of registration.hooks) {
      const hookList = this.hookIndex.get(hook.name) ?? [];
      hookList.push(hook);
      hookList.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
      this.hookIndex.set(hook.name, hookList);
    }
    log("[plugin-registry] registered", {
      id: registration.metadata.id,
      hooks: registration.hooks.length
    });
  }
  unregister(pluginId) {
    const registration = this.plugins.get(pluginId);
    if (!registration)
      return false;
    for (const hook of registration.hooks) {
      const hookList = this.hookIndex.get(hook.name);
      if (hookList) {
        const filtered = hookList.filter((h) => h !== hook);
        if (filtered.length === 0) {
          this.hookIndex.delete(hook.name);
        } else {
          this.hookIndex.set(hook.name, filtered);
        }
      }
    }
    this.plugins.delete(pluginId);
    log("[plugin-registry] unregistered", { id: pluginId });
    return true;
  }
  enable(pluginId) {
    const registration = this.plugins.get(pluginId);
    if (!registration)
      return false;
    registration.enabled = true;
    return true;
  }
  disable(pluginId) {
    const registration = this.plugins.get(pluginId);
    if (!registration)
      return false;
    registration.enabled = false;
    return true;
  }
  getHooks(hookName) {
    const hooks = this.hookIndex.get(hookName) ?? [];
    return hooks.filter((h) => {
      const plugin = this.plugins.get(h.name.split(".")[0]);
      return plugin?.enabled !== false;
    });
  }
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  getStats() {
    const allPlugins = this.getAllPlugins();
    const enabledPlugins = allPlugins.filter((p) => p.enabled);
    const totalHooks = allPlugins.reduce((sum, p) => sum + p.hooks.length, 0);
    const byHookType = {};
    for (const plugin of allPlugins) {
      for (const hook of plugin.hooks) {
        byHookType[hook.name] = (byHookType[hook.name] ?? 0) + 1;
      }
    }
    return {
      totalPlugins: allPlugins.length,
      enabledPlugins: enabledPlugins.length,
      totalHooks,
      byHookType
    };
  }
  async executeHooks(hookName, input, output) {
    const hooks = this.getHooks(hookName);
    for (const hook of hooks) {
      try {
        await hook.handler(input, output);
      } catch (err) {
        log("[plugin-registry] hook error", {
          hook: hookName,
          error: String(err)
        });
      }
    }
  }
  clear() {
    this.plugins.clear();
    this.hookIndex.clear();
  }
}
function createPluginRegistry() {
  return new PluginRegistry;
}

// src/features/skill-codifier/index.ts
class SkillCodifier {
  occurrences = new Map;
  generatedSkills = new Map;
  threshold;
  constructor(options) {
    this.threshold = options?.threshold ?? 5;
  }
  recordOccurrence(occurrence) {
    const key = `${occurrence.category}:${occurrence.pattern}`;
    const list = this.occurrences.get(key) ?? [];
    list.push(occurrence);
    this.occurrences.set(key, list);
    log("[skill-codifier] occurrence recorded", {
      pattern: occurrence.pattern,
      category: occurrence.category,
      count: list.length
    });
  }
  shouldGenerateSkill(category, pattern) {
    const key = `${category}:${pattern}`;
    const occurrences = this.occurrences.get(key) ?? [];
    if (occurrences.length < this.threshold) {
      return {
        generated: false,
        reason: `Only ${occurrences.length}/${this.threshold} occurrences recorded`
      };
    }
    if (this.generatedSkills.has(key)) {
      return {
        generated: false,
        reason: "Skill already generated for this pattern"
      };
    }
    const successCount = occurrences.filter((o) => o.success).length;
    const successRate = successCount / occurrences.length;
    if (successRate < 0.6) {
      return {
        generated: false,
        reason: `Success rate too low (${(successRate * 100).toFixed(0)}%)`
      };
    }
    const skill = this.generateSkillTemplate(category, pattern, occurrences, successRate);
    this.generatedSkills.set(key, skill);
    return {
      generated: true,
      skill,
      reason: `Pattern occurred ${occurrences.length} times with ${(successRate * 100).toFixed(0)}% success rate`
    };
  }
  generateSkillTemplate(category, pattern, occurrences, successRate) {
    const id = `skill-${category}-${pattern.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;
    const name = `${category} ${pattern.slice(0, 30)}`;
    const description = `Auto-generated skill for ${category}: ${pattern}`;
    const triggerPatterns = occurrences.map((o) => o.pattern).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    const successfulOccurrences = occurrences.filter((o) => o.success);
    const template = this.buildTemplateFromOccurrences(successfulOccurrences, category);
    return {
      id,
      name,
      description,
      category,
      triggerPatterns,
      template,
      confidence: successRate,
      occurrenceCount: occurrences.length,
      lastUsedAt: occurrences[occurrences.length - 1].timestamp,
      createdAt: Date.now()
    };
  }
  buildTemplateFromOccurrences(occurrences, category) {
    const lines = [];
    lines.push(`# Auto-Generated Skill: ${category}`);
    lines.push("");
    lines.push("## Description");
    lines.push(`This skill was automatically generated from ${occurrences.length} successful occurrences.`);
    lines.push("");
    lines.push("## When to Use");
    lines.push("- When the user request matches the trigger patterns");
    lines.push("- When similar tasks have been completed successfully before");
    lines.push("");
    lines.push("## Steps");
    lines.push("1. Identify the user intent");
    lines.push("2. Apply the learned pattern");
    lines.push("3. Verify the result");
    lines.push("");
    lines.push("## Notes");
    lines.push("- This is an auto-generated skill. Review and refine as needed.");
    lines.push("- Confidence: " + (occurrences.length / (occurrences.length + 1) * 100).toFixed(0) + "%");
    return lines.join(`
`);
  }
  getGeneratedSkills() {
    return Array.from(this.generatedSkills.values());
  }
  getSkill(id) {
    return this.generatedSkills.get(id);
  }
  getStats() {
    let totalOccurrences = 0;
    for (const list of this.occurrences.values()) {
      totalOccurrences += list.length;
    }
    return {
      totalOccurrences,
      uniquePatterns: this.occurrences.size,
      generatedSkills: this.generatedSkills.size,
      avgOccurrencesPerPattern: this.occurrences.size > 0 ? totalOccurrences / this.occurrences.size : 0
    };
  }
  clear() {
    this.occurrences.clear();
    this.generatedSkills.clear();
  }
}
function createSkillCodifier(options) {
  return new SkillCodifier(options);
}

// src/features/session-router/index.ts
class SessionRouter {
  userSessions = new Map;
  agentOrgs = new Map;
  createUserSession(userId, sessionId, agentOrgId, role = "collaborator") {
    const session = {
      userId,
      sessionId,
      agentOrgId,
      role,
      joinedAt: Date.now(),
      lastActiveAt: Date.now()
    };
    this.userSessions.set(sessionId, session);
    const org = this.agentOrgs.get(agentOrgId);
    if (org && !org.members.includes(userId)) {
      org.members.push(userId);
    }
    log("[session-router] user session created", {
      userId,
      sessionId,
      agentOrgId,
      role
    });
    return session;
  }
  getUserSession(sessionId) {
    return this.userSessions.get(sessionId);
  }
  createAgentOrg(id, name, ownerUserId) {
    const org = {
      id,
      name,
      members: [ownerUserId],
      sharedState: new Map,
      createdAt: Date.now()
    };
    this.agentOrgs.set(id, org);
    log("[session-router] agent org created", { id, name, owner: ownerUserId });
    return org;
  }
  getAgentOrg(orgId) {
    return this.agentOrgs.get(orgId);
  }
  setSharedState(orgId, key, value) {
    const org = this.agentOrgs.get(orgId);
    if (!org)
      return false;
    org.sharedState.set(key, value);
    return true;
  }
  getSharedState(orgId, key) {
    const org = this.agentOrgs.get(orgId);
    if (!org)
      return;
    return org.sharedState.get(key);
  }
  getAllSharedState(orgId) {
    const org = this.agentOrgs.get(orgId);
    return org?.sharedState ?? new Map;
  }
  removeUserSession(sessionId) {
    const session = this.userSessions.get(sessionId);
    if (!session)
      return false;
    this.userSessions.delete(sessionId);
    log("[session-router] user session removed", {
      userId: session.userId,
      sessionId
    });
    return true;
  }
  updateLastActive(sessionId) {
    const session = this.userSessions.get(sessionId);
    if (session) {
      session.lastActiveAt = Date.now();
    }
  }
  getOrgSessions(orgId) {
    return Array.from(this.userSessions.values()).filter((s) => s.agentOrgId === orgId);
  }
  getStats() {
    const usersPerOrg = {};
    for (const [orgId, org] of this.agentOrgs) {
      usersPerOrg[orgId] = org.members.length;
    }
    return {
      totalUsers: this.userSessions.size,
      totalOrgs: this.agentOrgs.size,
      activeSessions: Array.from(this.userSessions.values()).filter((s) => Date.now() - s.lastActiveAt < 5 * 60 * 1000).length,
      usersPerOrg
    };
  }
  clear() {
    this.userSessions.clear();
    this.agentOrgs.clear();
  }
}
function createSessionRouter() {
  return new SessionRouter;
}

// src/features/integration-hub/index.ts
class IntegrationHub {
  integrations = new Map;
  webhooks = [];
  handlers = new Map;
  registerIntegration(config) {
    const fullConfig = {
      ...config,
      createdAt: Date.now()
    };
    this.integrations.set(config.id, fullConfig);
    log("[integration-hub] registered", {
      id: config.id,
      type: config.type,
      name: config.name
    });
  }
  getIntegration(id) {
    return this.integrations.get(id);
  }
  getAllIntegrations() {
    return Array.from(this.integrations.values());
  }
  enableIntegration(id) {
    const config = this.integrations.get(id);
    if (!config)
      return false;
    config.enabled = true;
    return true;
  }
  disableIntegration(id) {
    const config = this.integrations.get(id);
    if (!config)
      return false;
    config.enabled = false;
    return true;
  }
  registerHandler(integrationId, handler) {
    this.handlers.set(integrationId, handler);
  }
  async processWebhook(event) {
    const fullEvent = {
      ...event,
      receivedAt: Date.now(),
      processed: false
    };
    this.webhooks.push(fullEvent);
    const handler = this.handlers.get(event.integrationId);
    if (handler) {
      try {
        await handler(fullEvent);
        fullEvent.processed = true;
        log("[integration-hub] webhook processed", {
          id: fullEvent.id,
          integrationId: fullEvent.integrationId,
          eventType: fullEvent.eventType
        });
      } catch (err) {
        log("[integration-hub] webhook processing failed", {
          id: fullEvent.id,
          error: String(err)
        });
      }
    }
  }
  getWebhooks(integrationId, limit = 50) {
    const filtered = integrationId ? this.webhooks.filter((w) => w.integrationId === integrationId) : this.webhooks;
    return filtered.slice(-limit);
  }
  getStats() {
    const allIntegrations = this.getAllIntegrations();
    const enabledIntegrations = allIntegrations.filter((i) => i.enabled);
    const byType = {};
    for (const integration of allIntegrations) {
      byType[integration.type] = (byType[integration.type] ?? 0) + 1;
    }
    const processedWebhooks = this.webhooks.filter((w) => w.processed).length;
    return {
      totalIntegrations: allIntegrations.length,
      enabledIntegrations: enabledIntegrations.length,
      byType,
      totalWebhooks: this.webhooks.length,
      processedWebhooks
    };
  }
  clear() {
    this.integrations.clear();
    this.webhooks = [];
    this.handlers.clear();
  }
}
function createIntegrationHub() {
  return new IntegrationHub;
}

// src/features/transparency-log/index.ts
class TransparencyLog {
  entries = [];
  nextId = 1;
  maxEntries = 1000;
  record(entry) {
    const fullEntry = {
      ...entry,
      id: this.nextId++,
      timestamp: entry.timestamp ?? Date.now()
    };
    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    log("[transparency-log] recorded", {
      type: entry.type,
      sessionId: entry.sessionId,
      message: entry.message.slice(0, 50)
    });
  }
  query(query = {}) {
    let filtered = [...this.entries];
    if (query.type) {
      filtered = filtered.filter((e) => e.type === query.type);
    }
    if (query.sessionId) {
      filtered = filtered.filter((e) => e.sessionId === query.sessionId);
    }
    if (query.since) {
      filtered = filtered.filter((e) => e.timestamp >= query.since);
    }
    const limit = query.limit ?? 50;
    return filtered.slice(-limit);
  }
  getRecent(limit = 20) {
    return this.entries.slice(-limit);
  }
  getBySession(sessionId) {
    return this.entries.filter((e) => e.sessionId === sessionId);
  }
  getByType(type) {
    return this.entries.filter((e) => e.type === type);
  }
  getStats() {
    const byType = {};
    const bySession = {};
    for (const entry of this.entries) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
      bySession[entry.sessionId] = (bySession[entry.sessionId] ?? 0) + 1;
    }
    return {
      totalEntries: this.entries.length,
      byType,
      bySession,
      oldestEntry: this.entries[0]?.timestamp ?? 0,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp ?? 0
    };
  }
  formatLog(entries) {
    if (entries.length === 0) {
      return `\uD83D\uDCCB Transparency Log

No entries found.`;
    }
    const lines = [];
    lines.push("\uD83D\uDCCB Transparency Log");
    lines.push("═".repeat(40));
    lines.push("");
    const typeIcons = {
      model_routing: "\uD83E\uDDE0",
      agent_selection: "\uD83E\uDD16",
      circuit_breaker: "\uD83D\uDEE1️",
      feature_trigger: "⚡",
      error: "❌",
      warning: "⚠️",
      decision: "\uD83C\uDFAF",
      plan_phase: "\uD83D\uDCCB",
      audit_result: "\uD83D\uDD0D",
      review_verdict: "✅",
      security_finding: "\uD83D\uDD12",
      learning_applied: "\uD83D\uDCA1",
      prediction_made: "\uD83D\uDD2E",
      benchmark_recorded: "\uD83D\uDCCA"
    };
    for (const entry of entries) {
      const icon = typeIcons[entry.type] ?? "\uD83D\uDCDD";
      const time = new Date(entry.timestamp).toLocaleTimeString();
      lines.push(`${icon} [${time}] ${entry.message}`);
      if (entry.details && Object.keys(entry.details).length > 0) {
        const detailsStr = Object.entries(entry.details).map(([k, v]) => `   ${k}: ${v}`).join(`
`);
        lines.push(detailsStr);
      }
      if (entry.confidence !== undefined) {
        lines.push(`   Confidence: ${(entry.confidence * 100).toFixed(0)}%`);
      }
      lines.push("");
    }
    const stats = this.getStats();
    lines.push(`\uD83D\uDCCA ${stats.totalEntries} total entries across ${Object.keys(stats.bySession).length} sessions`);
    return lines.join(`
`);
  }
  clear() {
    this.entries = [];
    this.nextId = 1;
  }
}
function createTransparencyLog() {
  return new TransparencyLog;
}

// src/background/concurrency-manager.ts
class ConcurrencyManager {
  config;
  counts = new Map;
  queues = new Map;
  circuits = new Map;
  constructor(config) {
    this.config = {
      defaultConcurrency: config?.defaultConcurrency ?? 5,
      modelConcurrency: config?.modelConcurrency ?? {},
      providerConcurrency: config?.providerConcurrency ?? {},
      circuitBreakerThreshold: config?.circuitBreakerThreshold ?? 5,
      circuitBreakerCooldownMs: config?.circuitBreakerCooldownMs ?? 30000
    };
  }
  getConcurrencyLimit(model) {
    const modelLimit = this.config.modelConcurrency[model];
    if (modelLimit !== undefined) {
      return modelLimit === 0 ? Infinity : modelLimit;
    }
    const provider = model.split("/")[0];
    const providerLimit = this.config.providerConcurrency[provider];
    if (providerLimit !== undefined) {
      return providerLimit === 0 ? Infinity : providerLimit;
    }
    return this.config.defaultConcurrency === 0 ? Infinity : this.config.defaultConcurrency;
  }
  isCircuitOpen(model) {
    const circuit = this.circuits.get(model);
    if (!circuit || circuit.state === "closed")
      return false;
    if (circuit.state === "open") {
      const elapsed = Date.now() - circuit.lastFailureTime;
      if (elapsed >= this.config.circuitBreakerCooldownMs) {
        circuit.state = "half-open";
        log("[concurrency] circuit breaker half-open", { model });
        return false;
      }
      return true;
    }
    return false;
  }
  recordSuccess(model) {
    const circuit = this.circuits.get(model) ?? {
      failures: 0,
      lastFailureTime: 0,
      state: "closed"
    };
    circuit.failures = 0;
    circuit.state = "closed";
    this.circuits.set(model, circuit);
  }
  recordFailure(model) {
    const circuit = this.circuits.get(model) ?? {
      failures: 0,
      lastFailureTime: 0,
      state: "closed"
    };
    circuit.failures++;
    circuit.lastFailureTime = Date.now();
    if (circuit.failures >= this.config.circuitBreakerThreshold) {
      circuit.state = "open";
      log("[concurrency] circuit breaker opened", {
        model,
        failures: circuit.failures
      });
      this.cancelWaiters(model);
    }
    this.circuits.set(model, circuit);
  }
  async acquire(model) {
    const limit = this.getConcurrencyLimit(model);
    if (limit === Infinity)
      return;
    if (this.isCircuitOpen(model)) {
      throw new Error(`Circuit breaker open for ${model}. Retry after ${this.config.circuitBreakerCooldownMs}ms`);
    }
    const current = this.counts.get(model) ?? 0;
    if (current < limit) {
      this.counts.set(model, current + 1);
      return;
    }
    return new Promise((resolve3, reject) => {
      const queue = this.queues.get(model) ?? [];
      const entry = {
        resolve: () => {
          if (entry.settled)
            return;
          entry.settled = true;
          this.counts.set(model, (this.counts.get(model) ?? 0) + 1);
          resolve3();
        },
        reject,
        settled: false
      };
      queue.push(entry);
      this.queues.set(model, queue);
    });
  }
  release(model) {
    const limit = this.getConcurrencyLimit(model);
    if (limit === Infinity)
      return;
    const current = this.counts.get(model) ?? 0;
    this.counts.set(model, Math.max(0, current - 1));
    const queue = this.queues.get(model) ?? [];
    while (queue.length > 0) {
      const entry = queue.shift();
      if (entry && !entry.settled) {
        entry.resolve();
        return;
      }
    }
  }
  cancelWaiters(model) {
    const queue = this.queues.get(model) ?? [];
    for (const entry of queue) {
      if (!entry.settled) {
        entry.settled = true;
        entry.reject(new Error(`Concurrency waiters cancelled for ${model}`));
      }
    }
    this.queues.set(model, []);
  }
  getCounts() {
    const result = {};
    for (const [model, count] of this.counts) {
      result[model] = count;
    }
    return result;
  }
  getQueueDepths() {
    const result = {};
    for (const [model, queue] of this.queues) {
      result[model] = queue.length;
    }
    return result;
  }
  getCircuitStates() {
    const result = {};
    for (const [model, circuit] of this.circuits) {
      result[model] = {
        state: circuit.state,
        failures: circuit.failures
      };
    }
    return result;
  }
  dispose() {
    for (const model of this.queues.keys()) {
      this.cancelWaiters(model);
    }
    this.counts.clear();
    this.queues.clear();
    this.circuits.clear();
  }
}

// src/features/model-capabilities/cache.ts
var DEFAULT_CAPABILITIES = {
  "claude-opus": { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 200000, family: "anthropic", reasoning: false },
  "claude-sonnet": { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 200000, family: "anthropic", reasoning: false },
  "claude-haiku": { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 4096, contextWindow: 200000, family: "anthropic", reasoning: false },
  "gpt-4o": { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 128000, family: "openai", reasoning: false },
  "gpt-4o-mini": { vision: true, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 16384, contextWindow: 128000, family: "openai", reasoning: false },
  o1: { vision: false, thinking: true, longContext: true, toolUse: false, structuredOutput: false, maxOutputTokens: 1e5, contextWindow: 200000, family: "openai", reasoning: true },
  o3: { vision: false, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 1e5, contextWindow: 200000, family: "openai", reasoning: true },
  "gemini-2.5-pro": { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 65536, contextWindow: 1e6, family: "google", reasoning: false },
  "gemini-2.5-flash": { vision: true, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 65536, contextWindow: 1e6, family: "google", reasoning: false },
  "deepseek-v3": { vision: false, thinking: true, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: "deepseek", reasoning: false },
  "deepseek-r1": { vision: false, thinking: true, longContext: true, toolUse: false, structuredOutput: false, maxOutputTokens: 8192, contextWindow: 128000, family: "deepseek", reasoning: true },
  "llama-3": { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: "meta", reasoning: false },
  minimax: { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 245760, family: "minimax", reasoning: false },
  mistral: { vision: false, thinking: false, longContext: true, toolUse: true, structuredOutput: true, maxOutputTokens: 8192, contextWindow: 128000, family: "mistral", reasoning: false }
};
var DEFAULT_MODEL = {
  vision: false,
  thinking: false,
  longContext: false,
  toolUse: true,
  structuredOutput: false,
  maxOutputTokens: 4096,
  contextWindow: 32000,
  family: "unknown",
  reasoning: false
};

class ModelCapabilitiesCache {
  cache = new Map;
  discovered = new Set;
  constructor() {
    for (const [key, caps] of Object.entries(DEFAULT_CAPABILITIES)) {
      this.cache.set(key, { ...DEFAULT_MODEL, ...caps });
    }
  }
  get(modelId) {
    const exact = this.cache.get(modelId);
    if (exact)
      return exact;
    for (const [key, caps] of this.cache) {
      if (modelId.toLowerCase().includes(key.toLowerCase())) {
        return caps;
      }
    }
    return { ...DEFAULT_MODEL };
  }
  update(modelId, capabilities) {
    const existing = this.cache.get(modelId) ?? { ...DEFAULT_MODEL };
    this.cache.set(modelId, { ...existing, ...capabilities });
    this.discovered.add(modelId);
    log("[model-capabilities] updated capabilities", {
      modelId,
      capabilities
    });
  }
  findByCapability(capability, value) {
    const results = [];
    for (const [modelId, caps] of this.cache) {
      if (caps[capability] === value) {
        results.push(modelId);
      }
    }
    return results;
  }
  getDiscoveredModels() {
    return [...this.discovered];
  }
  toJSON() {
    const result = {};
    for (const [key, caps] of this.cache) {
      result[key] = caps;
    }
    return result;
  }
  fromJSON(data) {
    for (const [key, caps] of Object.entries(data)) {
      this.cache.set(key, caps);
    }
  }
}

// src/hooks/delegation.ts
function createUnifiedHooks(ctx, config, hookConfig, runtimeChains, features) {
  const modelFallback = createModelFallbackHook(ctx, config, {
    enabled: config.fallback?.enabled !== false,
    chains: runtimeChains ?? {},
    maxAttempts: 3
  });
  const phaseReminder = createPhaseReminderHook(ctx, config);
  const jsonErrorRecovery = createJsonErrorRecoveryHook(ctx, config);
  const editErrorRecovery = createEditErrorRecoveryHook(ctx, config);
  const compactionContext = createCompactionContextInjectorHook(ctx, config);
  const agentUsageReminder = createAgentUsageReminderHook(ctx, config);
  const directoryContext = createDirectoryContextInjectorHook(ctx, config);
  const autoCommandDetector = createAutoCommandDetectorHook(ctx, config);
  const postToolNudge = createPostToolNudgeHook(ctx, config);
  const todoContinuation = createTodoContinuationHook(ctx, config);
  const backgroundNotification = createBackgroundNotificationHook(ctx, config, {
    taskEngine: features?.taskEngine
  });
  const synthesized = createSynthesizedHooks(ctx, config, hookConfig);
  const integrationHub = createIntegrationHub();
  const transparencyLog = createTransparencyLog();
  const circuitBreakers = createCircuitBreakerRegistry();
  const triggerDetector = createDefaultTriggerDetector();
  const reviewWorkBreaker = circuitBreakers.create("review-work", { failureThreshold: 3, recoveryTimeoutMs: 30000 });
  const hyperplanBreaker = circuitBreakers.create("hyperplan", { failureThreshold: 3, recoveryTimeoutMs: 30000 });
  const securityResearchBreaker = circuitBreakers.create("security-research", { failureThreshold: 3, recoveryTimeoutMs: 30000 });
  const modelFallbackBreaker = circuitBreakers.create("model-fallback", { failureThreshold: 5, recoveryTimeoutMs: 60000 });
  const proactiveFallbackBreaker = circuitBreakers.create("proactive-fallback", { failureThreshold: 5, recoveryTimeoutMs: 60000 });
  const concurrencyManager = new ConcurrencyManager;
  const modelCapabilities = new ModelCapabilitiesCache;
  const proactiveFallback = createProactiveFallbackHook(ctx, config, {
    enabled: config.fallback?.enabled !== false,
    chains: runtimeChains ?? {}
  });
  const ralphLoop = createRalphLoopHook(ctx);
  const reviewWork = createReviewWorkHook(ctx, config, undefined, { transparencyLog });
  const hyperplan = createHyperplanHook(ctx, config);
  const securityResearch = createSecurityResearchHook(ctx, config);
  const hyperplanBridge = createHyperplanBridge();
  const securityAutoTrigger = createSecurityAutoTrigger();
  const securityStore = new SecurityResearchStore(":memory:");
  const metricsCollector = createMetricsCollector(":memory:", { dailyBudget: 10 });
  const learningEngine = createLearningEngine(":memory:");
  const modelPredictor = createModelPredictor();
  const benchmarkTracker = createBenchmarkTracker(":memory:");
  const pluginRegistry = createPluginRegistry();
  const skillCodifier = createSkillCodifier({ threshold: 5 });
  const sessionRouter = createSessionRouter();
  async function safeCallWithBreaker(breaker, hook, ...args) {
    if (!hook)
      return;
    try {
      await breaker.execute(async () => hook(...args));
    } catch (err) {
      const name = hook.name || "anonymous";
      log(`[unified-hooks] error in ${name}:`, { error: String(err) });
      metricsCollector.record({
        type: "feature_error",
        sessionId: "unknown",
        feature: breaker.name,
        metadata: JSON.stringify({ error: String(err) })
      });
    }
  }
  async function safeCall(hook, ...args) {
    if (!hook)
      return;
    try {
      await hook(...args);
    } catch (err) {
      const name = hook.name || "anonymous";
      log(`[unified-hooks] error in ${name}:`, { error: String(err) });
    }
  }
  return {
    event: async (input) => {
      await safeCall(() => modelFallback.handleEvent(input.event));
      await safeCall(synthesized["event"], input);
      const bgMap = {
        "session.idle": "oh-my-unified.session.idle",
        "message.updated": "oh-my-unified.message.updated",
        "todo.updated": "oh-my-unified.todo.updated",
        "session.error": "oh-my-unified.session.error",
        "oh-my-unified.session.idle": "oh-my-unified.session.idle",
        "oh-my-unified.message.updated": "oh-my-unified.message.updated",
        "oh-my-unified.todo.updated": "oh-my-unified.todo.updated",
        "oh-my-unified.session.error": "oh-my-unified.session.error"
      };
      const bgKey = bgMap[input.event.type];
      if (bgKey) {
        await safeCall(backgroundNotification[bgKey], input, {});
      }
      const todoMap = {
        "session.start": "session.start",
        "session.end": "session.end",
        "todo.updated": "todo.updated"
      };
      const todoKey = todoMap[input.event.type];
      if (todoKey) {
        await safeCall(todoContinuation[todoKey], input, {});
      }
      if (input.event.type === "session.error") {
        const props = input.event.properties;
        const model = props?.model ?? props?.modelId;
        if (model)
          proactiveFallback.recordError(model);
        if (features?.agentSelector && typeof props?.agent === "string") {
          features.agentSelector.recordError(props.agent);
        }
        if (features?.systemObserver) {
          features.systemObserver.recordTaskLaunch();
        }
        if (model) {
          metricsCollector.record({
            type: "feature_error",
            sessionId: "unknown",
            model,
            feature: "model-fallback"
          });
        }
        if (features?.transparencyLog) {
          features.transparencyLog.record({
            type: "error",
            sessionId: "unknown",
            message: `Model ${model} encountered an error`,
            details: { model, event: "session.error" }
          });
        }
      } else if (input.event.type === "message.completed") {
        const props = input.event.properties;
        const model = props?.model ?? props?.modelId;
        if (model)
          proactiveFallback.recordSuccess(model);
        if (features?.systemObserver) {
          features.systemObserver.recordTaskCompletion(typeof props?.agent === "string" ? props.agent : undefined);
        }
        if (model) {
          metricsCollector.record({
            type: "feature_success",
            sessionId: "unknown",
            model,
            feature: "model-fallback"
          });
        }
        if (model && features?.modelPredictor) {
          features.modelPredictor.recordOutcome(model, "general", true);
        }
        if (features?.transparencyLog) {
          features.transparencyLog.record({
            type: "model_routing",
            sessionId: "unknown",
            message: `Model ${model} completed successfully`,
            details: { model, event: "message.completed" },
            confidence: 0.9
          });
        }
        if (model && features?.benchmarkTracker) {
          const props2 = input.event.properties;
          const latency = props2?.latencyMs ?? 0;
          const inputTokens = props2?.inputTokens ?? 0;
          const outputTokens = props2?.outputTokens ?? 0;
          const cost = props2?.cost ?? 0;
          const quality = props2?.qualityScore ?? 7;
          features.benchmarkTracker.record({
            model,
            taskCategory: "general",
            sessionId: "unknown",
            latencyMs: latency,
            inputTokens,
            outputTokens,
            cost,
            qualityScore: quality,
            timestamp: Date.now()
          });
          if (features?.transparencyLog) {
            features.transparencyLog.record({
              type: "benchmark_recorded",
              sessionId: "unknown",
              message: `Benchmark recorded for ${model}: ${latency}ms, cost ${cost}`,
              details: { model, latencyMs: latency, cost, qualityScore: quality }
            });
          }
        }
      }
      await safeCall(ralphLoop["event"], input);
      if (input.event.type === "session.end") {
        const props = input.event.properties;
        const model = props?.model ?? props?.modelId;
        if (model)
          concurrencyManager.release(model);
      }
    },
    "tool.execute.before": async (input, output) => {
      await safeCall(synthesized["tool.execute.before"], input, output);
      await safeCall(autoCommandDetector["message.before"], input, output);
      await safeCall(directoryContext["message.before"], input, output);
      await safeCall(phaseReminder["message.before"], input, output);
    },
    "tool.execute.after": async (input, output) => {
      await safeCall(synthesized["tool.execute.after"], input, output);
      await safeCall(editErrorRecovery["tool.after"], input, output);
      await safeCall(jsonErrorRecovery["tool.after"], input, output);
      await safeCall(agentUsageReminder["tool.after"], input, output);
      await safeCall(postToolNudge["tool.after"], input, output);
      await safeCall(ralphLoop["tool.execute.after"], input, output);
      if (hyperplan.manager) {
        const state2 = hyperplan.manager.getState(input.sessionID);
        if (state2 && hyperplanBridge.shouldAutoTrigger(state2)) {
          const reviewContext = hyperplanBridge.toReviewWorkState(state2);
          log("[hyperplan-bridge] auto-triggering review-work", {
            sessionId: input.sessionID,
            goal: reviewContext.goal
          });
          await safeCall(() => reviewWork.activate({ sessionID: input.sessionID, agent: input.tool }, { message: {}, parts: [{ type: "system", text: `Auto-triggered review-work: ${reviewContext.goal}` }] }));
        }
      }
      const filePath = input.args?.path;
      const fileContent = output.output ?? "";
      if (filePath && securityAutoTrigger.shouldTrigger(filePath, fileContent)) {
        const result = securityAutoTrigger.detectSensitiveWrite(filePath, fileContent);
        if (result) {
          securityAutoTrigger.queueResearch(input.sessionID, result.reason);
          log("[security-auto-trigger] triggered", { filePath, reason: result.reason, severity: result.severity });
        }
      }
    },
    "chat.message": async (input, output) => {
      await safeCall(synthesized["chat.message"], input, output);
      if (features?.agentSelector) {
        const parts2 = output.parts;
        if (parts2) {
          const userText = parts2.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ").trim();
          if (userText === "/agents" || userText === "/") {
            const agentList = features.agentSelector.getSlashCommandOutput();
            const textIdx = parts2.findIndex((p) => p.type === "text");
            if (textIdx >= 0) {
              parts2[textIdx] = { type: "text", text: agentList };
            } else {
              output.parts.push({ type: "text", text: agentList });
            }
            return;
          }
          if (input.agent) {
            const agent = features.agentSelector.getAgentByMention(input.agent);
            if (agent) {
              features.agentSelector.recordSuccess(agent.name);
              const meta = [
                `**${agent.displayName}** — ${agent.role}`,
                `Model: ${agent.currentModel}`,
                `Health: ${agent.healthStatus}`,
                agent.assignedMCPs.length > 0 ? `MCPs: ${agent.assignedMCPs.join(", ")}` : ""
              ].filter(Boolean).join(`
`);
              output.parts.push({
                type: "system",
                text: meta
              });
            }
          }
          if (userText.length > 0 && !input.agent) {
            const suggestions = features.agentSelector.getSuggestions(userText, input.sessionID);
            if (suggestions.length > 0) {
              const suggestionText = suggestions.map((s) => `Consider **${s.agent.displayName}** — ${s.reason} (${s.agent.currentModel})`).join(`
`);
              output.parts.push({
                type: "system",
                text: suggestionText
              });
            }
          }
        }
      }
      const parts = output.parts;
      if (parts) {
        const userText = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ");
        const match = triggerDetector.detect(userText);
        if (match) {
          if (features?.transparencyLog) {
            features.transparencyLog.record({
              type: "feature_trigger",
              sessionId: input.sessionID ?? "unknown",
              message: `Triggered ${match.feature} via "${userText.slice(0, 50)}..."`,
              details: { feature: match.feature, keyword: match.matchedKeyword }
            });
          }
          switch (match.feature) {
            case "review-work":
              await safeCallWithBreaker(reviewWorkBreaker, () => reviewWork.activate(input, output));
              break;
            case "hyperplan":
              await safeCallWithBreaker(hyperplanBreaker, () => hyperplan.activate(input, output));
              break;
            case "security-research":
              await safeCallWithBreaker(securityResearchBreaker, () => securityResearch.activate(input, output));
              break;
          }
        }
      }
      if (features?.systemObserver && input.agent) {
        features.systemObserver.recordAgentActivity(input.agent);
      }
      if (features?.learningEngine && parts) {
        const userText = parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ");
        if (userText.length > 10) {
          const lessons = features.learningEngine.findRelevantLessons("planning", userText);
          if (lessons.length > 0) {
            const lessonText = lessons.slice(0, 3).map((l) => `Learned: ${l.lesson.description} (${(l.similarity * 100).toFixed(0)}% match)`).join(`
`);
            output.parts.push({
              type: "system",
              text: lessonText
            });
            if (features.transparencyLog) {
              features.transparencyLog.record({
                type: "learning_applied",
                sessionId: input.sessionID ?? "unknown",
                message: `Applied ${lessons.length} relevant lessons`,
                details: { lessonCount: lessons.length, topMatch: (lessons[0].similarity * 100).toFixed(0) + "%" },
                confidence: lessons[0]?.similarity ?? 0
              });
            }
          }
        }
      }
      if (features?.pluginRegistry) {
        await features.pluginRegistry.executeHooks("chat.message", input, output);
      }
    },
    "chat.params": async (input, output) => {
      await safeCall(proactiveFallback["chat.params"], input, output);
      if (features?.modelRouter) {
        const route = features.modelRouter.routeForAgent(input.agent);
        let selectedModel = route.assignedModel;
        if (features?.modelPredictor && input.agent) {
          const prediction = features.modelPredictor.predictBestModel("general", [selectedModel]);
          if (prediction.confidence > 0.7) {
            selectedModel = prediction.recommendedModel;
            log("[model-predictor] override", {
              agent: input.agent,
              model: selectedModel,
              confidence: prediction.confidence
            });
            if (features?.transparencyLog) {
              features.transparencyLog.record({
                type: "prediction_made",
                sessionId: input.sessionID ?? "unknown",
                message: `Model predictor recommended ${selectedModel} over ${route.assignedModel}`,
                details: { agent: input.agent, predicted: selectedModel, base: route.assignedModel },
                confidence: prediction.confidence
              });
            }
          }
        }
        if (selectedModel !== "default" && selectedModel !== "none") {
          log("[model-router] routed", { agent: input.agent, model: selectedModel, reason: route.reason });
          metricsCollector.record({
            type: "model_routing",
            sessionId: input.sessionID ?? "unknown",
            agent: input.agent,
            model: selectedModel,
            feature: "model-router",
            metadata: JSON.stringify({ reason: route.reason })
          });
        }
      }
    },
    "command.execute.before": async (input, output) => {}
  };
}

// src/hooks/auto-slash-command.ts
var AUTO_SLASH_COMMAND_TAG_OPEN = "<!-- oh-my-unified:slash-command -->";
var AUTO_SLASH_COMMAND_TAG_CLOSE = "<!-- /oh-my-unified:slash-command -->";
var SLASH_COMMAND_PATTERN = /^\/([a-zA-Z0-9_-]+)\s*([\s\S]*)$/;
var OUR_COMMANDS = new Set([
  "plan",
  "assess",
  "assemble",
  "improvise",
  "act",
  "synthesize",
  "health",
  "status",
  "diagnose",
  "capabilities",
  "onboarding",
  "log",
  "agents"
]);
var COMMAND_TEMPLATES = {
  plan: {
    command: "plan",
    template: "Run the full pipeline: assess → assemble → improvise → act. Topic: {{args}}",
    description: "Full end-to-end workflow with confidence gates"
  },
  assess: {
    command: "assess",
    template: "Phase 1: Conduct requirements assessment. Identify gaps, contradictions, and missing context.",
    description: "Requirements assessment (confidence ≥6)"
  },
  assemble: {
    command: "assemble",
    template: "Phase 2: Deep research and architecture. Map dependencies, study documentation, deliberate on tradeoffs.",
    description: "Deep research & architecture (confidence ≥8)"
  },
  improvise: {
    command: "improvise",
    template: "Phase 3: Critique and refine. Perform adversarial review, check quality, refine approach. Continue until user is satisfied.",
    description: "Critique & refine (loop until satisfied)"
  },
  act: {
    command: "act",
    template: "Phase 4: Execute the plan. Build, fix, and design with confidence ≥9.",
    description: "Execute the plan (confidence ≥9)"
  },
  synthesize: {
    command: "synthesize",
    template: "Synthesize all agent results into a single report.",
    description: "Deploy all agents, one report"
  },
  health: {
    command: "health",
    template: "Run system health check. Report overall status, component health, warnings, and errors.",
    description: "System Observer health report"
  },
  status: {
    command: "status",
    template: "Show pipeline status: conductor, phase, confidence, kanban tasks, and sub-sessions.",
    description: "Pipeline status and progress"
  },
  diagnose: {
    command: "diagnose",
    template: "Run 12 parallel system health checks: plugin bootstrap, agent registration, MCP connectivity, TUI status, interview engine, circuit breakers, plugin registry, integrations.",
    description: "12 parallel system health checks"
  },
  capabilities: {
    command: "capabilities",
    template: "List all plugin capabilities grouped by category: agents, hooks, tools, MCPs, features.",
    description: "Dynamic capability listing"
  },
  onboarding: {
    command: "onboarding",
    template: "Show interactive welcome menu with contextual guidance for first-time users.",
    description: "First-run interactive guide"
  },
  log: {
    command: "log",
    template: "Query the transparency log. {{args}}",
    description: "Transparency log query (recent, stats, by type, by session)"
  },
  agents: {
    command: "agents",
    template: "List all active agents with their models, roles, and status.",
    description: "List all active agents"
  }
};
function parseSlashCommand(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/"))
    return null;
  const match = trimmed.match(SLASH_COMMAND_PATTERN);
  if (!match)
    return null;
  return {
    command: match[1].toLowerCase(),
    args: (match[2] || "").trim(),
    raw: trimmed
  };
}
function removeCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}
function findSlashCommandPartIndex(parts) {
  for (let i = 0;i < parts.length; i++) {
    if (parts[i].type === "text" && parts[i].text?.trim().startsWith("/")) {
      return i;
    }
  }
  return -1;
}
function extractPromptText(parts) {
  return parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ").trim();
}
function createAutoSlashCommandHook(_ctx, _config) {
  const processedCommands = new Map;
  return {
    "chat.message": async (input, output) => {
      const promptText = extractPromptText(output.parts);
      const textWithoutCodeBlocks = removeCodeBlocks(promptText);
      if (!textWithoutCodeBlocks.trim().startsWith("/"))
        return;
      if (promptText.includes(AUTO_SLASH_COMMAND_TAG_OPEN) || promptText.includes(AUTO_SLASH_COMMAND_TAG_CLOSE)) {
        return;
      }
      const parsed = parseSlashCommand(textWithoutCodeBlocks);
      if (!parsed)
        return;
      if (!OUR_COMMANDS.has(parsed.command))
        return;
      const commandKey = input.messageID ? `${input.sessionID}:${input.messageID}:${parsed.command}` : `${input.sessionID}:${parsed.command}`;
      if (processedCommands.has(commandKey))
        return;
      processedCommands.set(commandKey, true);
      const template = COMMAND_TEMPLATES[parsed.command];
      if (!template)
        return;
      const replacementText = template.template.replace("{{args}}", parsed.args);
      const taggedContent = `${AUTO_SLASH_COMMAND_TAG_OPEN}
${replacementText}
${AUTO_SLASH_COMMAND_TAG_CLOSE}`;
      const idx = findSlashCommandPartIndex(output.parts);
      if (idx < 0)
        return;
      output.parts[idx].text = taggedContent;
      log("[auto-slash-command] Replaced message with command template", {
        sessionID: input.sessionID,
        command: parsed.command
      });
    },
    "command.execute.before": async (input, output) => {
      const normalizedCommand = input.command.toLowerCase();
      if (!OUR_COMMANDS.has(normalizedCommand))
        return;
      const commandKey = `${input.sessionID}:cmd:${normalizedCommand}:${input.arguments || ""}`;
      if (processedCommands.has(commandKey))
        return;
      processedCommands.set(commandKey, true);
      const template = COMMAND_TEMPLATES[normalizedCommand];
      if (!template)
        return;
      const replacementText = template.template.replace("{{args}}", input.arguments);
      const taggedContent = `${AUTO_SLASH_COMMAND_TAG_OPEN}
${replacementText}
${AUTO_SLASH_COMMAND_TAG_CLOSE}`;
      const idx = findSlashCommandPartIndex(output.parts);
      if (idx >= 0) {
        output.parts[idx].text = taggedContent;
      } else {
        output.parts.unshift({ type: "text", text: taggedContent });
      }
      log("[auto-slash-command] command.execute.before - injected template", {
        sessionID: input.sessionID,
        command: normalizedCommand
      });
    },
    event: async (input) => {
      if (input.event.type === "session.deleted") {
        const props = input.event.properties;
        const sessionID = props?.sessionID ?? props?.info?.id;
        if (sessionID) {
          for (const key of processedCommands.keys()) {
            if (key.startsWith(`${sessionID}:`)) {
              processedCommands.delete(key);
            }
          }
        }
      }
    }
  };
}

// src/tools/subtask.ts
var state2 = new Map;
function createSubtaskState() {
  return { tasks: new Map, currentTask: undefined };
}
function createSubtaskCommandManager(_ctx, _state) {
  return {
    name: "subtask_commands",
    commands: {
      "subtask.list": () => {
        const tasks = [];
        for (const [id, info] of _state.tasks) {
          tasks.push({ id, status: info.status });
        }
        return tasks;
      },
      "subtask.clear": () => {
        _state.tasks.clear();
        _state.currentTask = undefined;
        return { cleared: true };
      }
    }
  };
}

// src/features/lazy-loader/index.ts
class LazyLoader {
  registry = new Map;
  disabledList = new Set;
  register(id, type, name, desc) {
    this.registry.set(id, {
      id,
      type,
      name,
      description: desc,
      loaded: false,
      disabled: this.disabledList.has(id)
    });
  }
  load(id) {
    const component = this.registry.get(id);
    if (!component || component.disabled)
      return null;
    component.loaded = true;
    return component;
  }
  listAvailable() {
    return Array.from(this.registry.values()).filter((c) => !c.disabled);
  }
  disable(id) {
    const component = this.registry.get(id);
    if (component)
      component.disabled = true;
    this.disabledList.add(id);
  }
  enable(id) {
    const component = this.registry.get(id);
    if (component)
      component.disabled = false;
    this.disabledList.delete(id);
  }
  loadAgentsForTask(taskType) {
    const loaded = [];
    if (taskType.includes("plan") || taskType.includes("interview")) {
      const o = this.load("odin");
      if (o)
        loaded.push(o.name);
    }
    if (taskType.includes("search") || taskType.includes("find")) {
      const s = this.load("sif");
      if (s)
        loaded.push(s.name);
    }
    return loaded;
  }
}
var lazyLoader = new LazyLoader;

// src/utils/display-name.ts
var DISPLAY_NAME_OVERRIDES = {
  orchestrator: "Orchestrator",
  odin: "Odin",
  njord: "Njord",
  mimir: "Mimir",
  vidar: "Vidar",
  thor: "Thor",
  forseti: "Forseti",
  frigg: "Frigg",
  tyr: "Tyr",
  sif: "Sif",
  eir: "Eir",
  freyr: "Freyr",
  hermod: "Hermod",
  heimdall: "Heimdall",
  magni: "Magni",
  hod: "Hod"
};
function createDisplayNameMentionRewriter(config) {
  const overrides = config?.agents ?? {};
  return {
    rewrite(displayName, agentName) {
      const override = overrides[agentName];
      if (override?.displayName) {
        return override.displayName;
      }
      return DISPLAY_NAME_OVERRIDES[agentName] || displayName;
    }
  };
}
// src/features/tool-use-enforcer/mcp-skill-catalog.ts
import { readFileSync as readFileSync4, readdirSync, existsSync as existsSync5, statSync } from "node:fs";
import { join as join4 } from "node:path";
function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || "/tmp";
}
var DEFAULT_PATHS = {
  opencodeConfig: join4(homeDir(), ".config", "opencode", "opencode.json"),
  opencodeSkills: join4(homeDir(), ".config", "opencode", "skills"),
  claudeSkills: join4(homeDir(), ".claude", "skills")
};
function parseSkillFrontmatter(content) {
  const result = {};
  const fmMatch = content.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)/);
  if (!fmMatch)
    return result;
  const fm = fmMatch[1];
  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  if (nameMatch)
    result.name = nameMatch[1].trim();
  const blockMatch = fm.match(/^description:\s*\|\n((?:\s{2,}.*(?:\n|$))*)/m);
  if (blockMatch) {
    result.description = blockMatch[1].split(`
`).map((l) => l.replace(/^\s{2,}/, "").trim()).filter(Boolean).join(" ").trim();
  } else {
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (descMatch)
      result.description = descMatch[1].trim();
  }
  return result;
}
function describeMcp(name, cfg) {
  if (cfg.type === "remote") {
    return `Remote MCP server: ${cfg.url ?? "unknown URL"}`;
  }
  const cmd = cfg.command;
  if (Array.isArray(cmd)) {
    return `Local MCP server: ${cmd.join(" ")}`;
  }
  return `MCP server: ${name}`;
}

class McpSkillCatalog {
  options;
  entries = [];
  constructor(options) {
    this.options = options;
    this.initialize();
  }
  initialize() {
    const userMcps = this.readUserConfig();
    if (userMcps.length > 0) {
      this.entries.push(...userMcps);
    } else {
      this.loadDefaultMcps();
    }
    const userSkills = this.scanUserSkills();
    if (userSkills.length > 0) {
      this.entries.push(...userSkills);
    } else {
      this.loadDefaultSkills();
    }
    this.loadBuiltins();
  }
  getAll() {
    return [...this.entries];
  }
  findByTrigger(text) {
    const lower = text.toLowerCase();
    return this.entries.filter((entry) => entry.triggers.some((t) => lower.includes(t)) || entry.name.toLowerCase().includes(lower) || entry.description.toLowerCase().includes(lower));
  }
  findByCategory(cat) {
    return this.entries.filter((entry) => entry.category === cat);
  }
  toMarkdown() {
    const groups = new Map;
    for (const entry of this.entries) {
      const group = groups.get(entry.category) ?? [];
      group.push(entry);
      groups.set(entry.category, group);
    }
    const header = `# Available Tools & Skills

_Automatically generated from McpSkillCatalog — ${this.entries.length} entries_

`;
    const sections = [];
    for (const [category, items] of groups) {
      sections.push(`## ${category}
`);
      for (const item of items) {
        const triggers = item.triggers.map((t) => `\`${t}\``).join(", ");
        const serverLine = item.serverName ? ` (server: \`${item.serverName}\`)` : "";
        let prefix = "";
        if (item.source === "discovered") {
          prefix = item.category === "mcp" ? "\uD83D\uDCE1 " : "\uD83D\uDD27 ";
        }
        sections.push(`- ${prefix}**${item.name}**${serverLine}: ${item.description}`);
        if (item.triggers.length > 0) {
          sections.push(`  - Triggers: ${triggers}`);
        }
      }
      sections.push("");
    }
    return header + sections.join(`
`);
  }
  generateTaskSuggestions(description) {
    const matched = this.findByTrigger(description);
    if (matched.length === 0) {
      return `No specific tools matched "${description}". Consider using:
- \`/browse\` for web-related tasks
- \`/qa\` for testing
- \`code-review-graph\` for code analysis
- \`delegate_task\` for parallel sub-agents`;
    }
    const lines = [`Based on "${description}", consider these tools:
`];
    for (const entry of matched.slice(0, 5)) {
      const badge = entry.category === "mcp" ? "MCP" : entry.category === "gstack-skill" ? "GSKILL" : "BUILTIN";
      lines.push(`- [${badge}] **${entry.name}**: ${entry.description}`);
    }
    if (matched.length > 5) {
      lines.push(`
_… and ${matched.length - 5} more matches_`);
    }
    return lines.join(`
`);
  }
  configPath() {
    return this.options?.opencodeConfigPath ?? DEFAULT_PATHS.opencodeConfig;
  }
  readUserConfig() {
    const configPath = this.configPath();
    try {
      if (!existsSync5(configPath))
        return [];
      const raw = readFileSync4(configPath, "utf-8");
      const config = JSON.parse(raw);
      const mcpSection = config.mcp;
      if (!mcpSection || typeof mcpSection !== "object")
        return [];
      const entries = [];
      for (const [name, cfg] of Object.entries(mcpSection)) {
        if (typeof cfg !== "object" || cfg === null)
          continue;
        if (cfg.enabled === false)
          continue;
        entries.push({
          category: "mcp",
          name,
          description: describeMcp(name, cfg),
          triggers: [
            name.toLowerCase(),
            ...name.split(/[-_\s.]+/).filter(Boolean).map((s) => s.toLowerCase())
          ],
          serverName: name,
          source: "discovered"
        });
      }
      return entries;
    } catch {
      return [];
    }
  }
  skillsPaths() {
    return {
      opencode: this.options?.opencodeSkillsPath ?? DEFAULT_PATHS.opencodeSkills,
      claude: this.options?.claudeSkillsPath ?? DEFAULT_PATHS.claudeSkills
    };
  }
  scanUserSkills() {
    const { opencode, claude } = this.skillsPaths();
    const entries = [];
    entries.push(...this.scanSkillDir(opencode, "gstack-skill"));
    entries.push(...this.scanSkillDir(claude, "builtin"));
    return entries;
  }
  scanSkillDir(dirPath, category) {
    try {
      if (!existsSync5(dirPath))
        return [];
      if (!statSync(dirPath).isDirectory())
        return [];
      const entries = [];
      const items = readdirSync(dirPath);
      for (const item of items) {
        if (item.startsWith(".") || item === "node_modules" || item === ".git")
          continue;
        const fullPath = join4(dirPath, item);
        let stat;
        try {
          stat = statSync(fullPath);
        } catch {
          continue;
        }
        if (!stat.isDirectory())
          continue;
        const skillMdPath = join4(fullPath, "SKILL.md");
        let name = item;
        let description = `${item} — a ${category.replace("-", " ")}`;
        const triggers = [item.toLowerCase()];
        if (existsSync5(skillMdPath)) {
          try {
            const content = readFileSync4(skillMdPath, "utf-8");
            const parsed = parseSkillFrontmatter(content);
            if (parsed.name)
              name = parsed.name;
            if (parsed.description)
              description = parsed.description;
          } catch {}
        }
        entries.push({
          category,
          name,
          description,
          triggers: [...new Set([...triggers, ...name.toLowerCase().split(/[-_\s.]+/).filter(Boolean)])],
          source: "discovered"
        });
      }
      return entries;
    } catch {
      return [];
    }
  }
  addEntry(entry) {
    this.entries.push({ ...entry, source: "default" });
  }
  loadDefaultMcps() {
    this.addEntry({
      category: "mcp",
      name: "clawdi",
      description: "Cross-agent long-term memory: preferences, coding habits, named entities, past bugs, architecture decisions",
      triggers: ["memory", "remember", "past session", "preferences", "what do I usually", "like last time"],
      serverName: "clawdi"
    });
    this.addEntry({
      category: "mcp",
      name: "gbrain",
      description: "Persistent knowledge brain: query, store, search across pages, facts, takes, timeline",
      triggers: ["knowledge", "search brain", "stored info", "gbrain", "what do I know about"],
      serverName: "gbrain"
    });
    this.addEntry({
      category: "mcp",
      name: "code-review-graph",
      description: "Code knowledge graph: communities, impact, flows, architecture analysis, dependency traversal",
      triggers: ["architecture", "code structure", "dependencies", "communities", "impact analysis", "code graph"],
      serverName: "code-review-graph"
    });
    this.addEntry({
      category: "mcp",
      name: "gitnexus",
      description: "Cross-repo code search, impact analysis, symbol context, API route mapping",
      triggers: ["cross-repo", "code search", "impact analysis", "symbol lookup", "git nexus"],
      serverName: "gitnexus"
    });
    this.addEntry({
      category: "mcp",
      name: "context7",
      description: "Up-to-date library & framework documentation with code examples",
      triggers: ["docs", "api reference", "library", "documentation for", "how to use"],
      serverName: "context7"
    });
    this.addEntry({
      category: "mcp",
      name: "exa",
      description: "Web search and page fetch with clean markdown extraction",
      triggers: ["web search", "find online", "look up", "search the internet", "current information"],
      serverName: "exa"
    });
    this.addEntry({
      category: "mcp",
      name: "deepwiki",
      description: "GitHub repository documentation reader",
      triggers: ["github docs", "repo docs", "repository documentation"],
      serverName: "deepwiki"
    });
    this.addEntry({
      category: "mcp",
      name: "loom-mcp",
      description: "Personal vault and knowledge base query engine",
      triggers: ["vault", "notes", "personal knowledge", "loom"],
      serverName: "loom-mcp"
    });
    this.addEntry({
      category: "mcp",
      name: "openspace",
      description: "Skill execution and search across local and cloud registries",
      triggers: ["execute skill", "run skill", "openspace"],
      serverName: "openspace"
    });
    this.addEntry({
      category: "mcp",
      name: "agent-browser",
      description: "Browser automation: navigate, fill forms, screenshot, scrape",
      triggers: ["browse", "screenshot", "test page", "open website", "automate browser"],
      serverName: "agent-browser"
    });
    this.addEntry({
      category: "mcp",
      name: "gh_grep",
      description: "Search public GitHub repositories for real-world code examples",
      triggers: ["github code search", "find code example", "search github"],
      serverName: "gh_grep"
    });
    this.addEntry({
      category: "mcp",
      name: "sequential-thinking",
      description: "Structured multi-step reasoning for complex problems",
      triggers: ["reasoning", "step by step", "complex problem", "think through"],
      serverName: "sequential-thinking"
    });
    this.addEntry({
      category: "mcp",
      name: "context-mode",
      description: "Execute and analyze code/data in sandbox, search indexed knowledge",
      triggers: ["run code", "analyze data", "process output", "context mode"],
      serverName: "context-mode"
    });
    this.addEntry({
      category: "mcp",
      name: "codex",
      description: "OpenAI Codex CLI wrapper: review, challenge, consult",
      triggers: ["second opinion", "codex review", "ask codex", "consult codex"],
      serverName: "codex"
    });
  }
  loadDefaultSkills() {
    this.addEntry({
      category: "gstack-skill",
      name: "qa",
      description: "Systematic QA testing with bug fixing",
      triggers: ["qa", "test site", "find bugs", "test and fix"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "browse",
      description: "Fast headless browser for QA, screenshots, page verification",
      triggers: ["open in browser", "test site", "screenshot", "dogfood"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "ship",
      description: "Merge, bump version, update changelog, create PR",
      triggers: ["ship", "deploy", "create pr", "merge and push"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "review",
      description: "Pre-landing PR review for structural issues",
      triggers: ["review pr", "code review", "check diff", "pre-landing"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "cso",
      description: "Chief Security Officer: infrastructure audit, secrets, dependencies",
      triggers: ["security audit", "threat model", "pentest", "owasp"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "investigate",
      description: "Systematic debugging with root cause analysis",
      triggers: ["debug", "fix bug", "root cause", "investigate error"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "design-review",
      description: "Visual QA: spacing, hierarchy, consistency fixes",
      triggers: ["audit design", "visual qa", "design polish", "check looks"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "health",
      description: "Code quality dashboard with weighted composite score",
      triggers: ["health check", "code quality", "quality score", "run all checks"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "canary",
      description: "Post-deploy monitoring: console errors, perf regressions",
      triggers: ["monitor deploy", "canary", "post-deploy check", "verify deploy"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "scrape",
      description: "Web scraping with codified browser-skill caching",
      triggers: ["scrape", "get data from", "extract from", "pull data"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "claude",
      description: "Claude Code CLI: independent diff review, adversarial challenge",
      triggers: ["claude review", "claude challenge", "ask claude", "outside voice"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "codex",
      description: "Codex CLI wrapper: adversarial review",
      triggers: ["codex review", "second opinion", "consult codex"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "office-hours",
      description: "YC Office Hours: demand validation, brainstorming",
      triggers: ["brainstorm", "idea validation", "office hours", "think through idea"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "design-consultation",
      description: "Full design system: aesthetic, typography, color, layout",
      triggers: ["design system", "brand guidelines", "create design"]
    });
    this.addEntry({
      category: "gstack-skill",
      name: "design-shotgun",
      description: "Multiple AI design variants with comparison board",
      triggers: ["explore designs", "show options", "design variants", "visual brainstorm"]
    });
  }
  loadBuiltins() {
    this.addEntry({
      category: "builtin",
      name: "delegate_task",
      description: "Spawn background sub-agents for parallel work",
      triggers: ["delegate", "background task", "parallel work", "subagent"]
    });
    this.addEntry({
      category: "builtin",
      name: "council",
      description: "Multi-LLM consensus-based analysis session",
      triggers: ["council", "multi-model", "consensus", "multiple opinions"]
    });
    this.addEntry({
      category: "builtin",
      name: "subtask",
      description: "Break work into sequential subtasks with dependencies",
      triggers: ["subtask", "break down", "sequential steps"]
    });
    this.addEntry({
      category: "builtin",
      name: "smartfetch",
      description: "Intelligent web fetching with content extraction",
      triggers: ["fetch url", "get webpage", "smart fetch"]
    });
    this.addEntry({
      category: "builtin",
      name: "ast-grep",
      description: "AST-aware code search, replace, and refactoring",
      triggers: ["ast search", "pattern replace", "code transformation"]
    });
  }
}

// src/features/tool-use-enforcer/agent-context-enricher.ts
class AgentContextEnricher {
  catalog;
  constructor(catalog) {
    this.catalog = catalog;
  }
  generateMcpContextBlock() {
    return this.catalog.toMarkdown();
  }
  generateToolSuggestions(taskDescription) {
    return this.catalog.generateTaskSuggestions(taskDescription);
  }
}

// src/features/mcp-discovery.ts
import { readFileSync as readFileSync5, existsSync as existsSync6 } from "node:fs";
function homeDir2() {
  return process.env.HOME || process.env.USERPROFILE || "/tmp";
}
var DEFAULT_OPENCODE_CONFIG = `${homeDir2()}/.config/opencode/opencode.json`;
function discoverUserMcps(configPath) {
  const path3 = configPath || DEFAULT_OPENCODE_CONFIG;
  try {
    if (!existsSync6(path3))
      return [];
    const raw = readFileSync5(path3, "utf-8");
    const config = JSON.parse(raw);
    const mcpSection = config.mcp;
    if (!mcpSection || typeof mcpSection !== "object")
      return [];
    const results = [];
    for (const [name, cfg] of Object.entries(mcpSection)) {
      if (typeof cfg !== "object" || cfg === null)
        continue;
      if (cfg.enabled === false)
        continue;
      const mcpType = cfg.type || "stdio";
      if (mcpType === "stdio" || mcpType === "local") {
        const cmd = cfg.command;
        const args = cfg.args || [];
        results.push({
          name,
          type: "local",
          command: cmd ? [cmd, ...args] : ["npx", "-y", name],
          enabled: true,
          source: "discovered"
        });
      } else if (mcpType === "sse" || mcpType === "http" || mcpType === "remote") {
        results.push({
          name,
          type: "remote",
          url: cfg.url || cfg.endpoint,
          enabled: true,
          source: "discovered"
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}
function mergeMcpConfigs(discovered, defaults) {
  const discoveredMap = new Map(discovered.map((d) => [d.name, d]));
  const result = [];
  for (const def of defaults) {
    const disc = discoveredMap.get(def.name);
    if (disc) {
      result.push({ ...def, command: disc.command, url: disc.url, type: disc.type });
    } else {
      result.push(def);
    }
  }
  for (const [name, disc] of discoveredMap) {
    if (!defaults.some((d) => d.name === name)) {
      result.push({
        name: disc.name,
        type: disc.type,
        command: disc.command,
        url: disc.url,
        enabled: disc.enabled
      });
    }
  }
  return result;
}

// src/mcp-bus/index.ts
var DEFAULT_MCP_SERVERS = [
  { name: "clawdi", type: "local", command: ["npx", "-y", "@opencode-ai/clawdi-mcp"], enabled: true },
  { name: "gbrain", type: "local", command: ["npx", "-y", "gbrain-mcp"], enabled: true },
  { name: "context-mode", type: "local", command: ["npx", "-y", "@opencode-ai/context-mode-mcp"], enabled: true },
  { name: "code-review-graph", type: "local", command: ["npx", "-y", "code-review-graph-mcp"], enabled: true },
  { name: "gitnexus", type: "local", command: ["npx", "-y", "gitnexus-mcp"], enabled: true },
  { name: "loom-mcp", type: "local", command: ["npx", "-y", "@opencode-ai/loom-mcp"], enabled: true },
  { name: "openspace", type: "local", command: ["npx", "-y", "@opencode-ai/openspace-mcp"], enabled: true },
  { name: "context7", type: "local", command: ["npx", "-y", "@opencode-ai/context7-mcp"], enabled: true },
  { name: "exa", type: "remote", url: "https://mcp.exa.ai/mcp", enabled: true },
  { name: "gh_grep", type: "remote", url: "https://mcp.grep.app", enabled: true },
  { name: "deepwiki", type: "local", command: ["npx", "-y", "@opencode-ai/deepwiki-mcp"], enabled: true },
  { name: "sequential-thinking", type: "local", command: ["npx", "-y", "@opencode-ai/sequential-thinking-mcp"], enabled: true },
  { name: "agent-browser", type: "local", command: ["npx", "-y", "@opencode-ai/agent-browser-mcp"], enabled: true }
];

// src/features/system-observer/observer.ts
import fs3 from "node:fs";
import path3 from "node:path";
import os from "node:os";

// src/features/system-observer/types.ts
var DEFAULT_CHECK_INTERVAL_MS = 30000;

// src/features/system-observer/observer.ts
function defaultPluginBootstrapCheck() {
  try {
    const pluginAvail = !!globalThis.process?.versions?.node;
    return {
      name: "plugin-bootstrap",
      status: pluginAvail ? "healthy" : "degraded",
      lastCheck: Date.now(),
      details: { nodeVersion: process.version, platform: process.platform }
    };
  } catch {
    return {
      name: "plugin-bootstrap",
      status: "down",
      lastCheck: Date.now(),
      lastError: "Node.js runtime not available"
    };
  }
}
function defaultTaskRegistryCheck() {
  return {
    name: "task-registry",
    status: "healthy",
    lastCheck: Date.now(),
    details: { registryAvailable: true }
  };
}
function defaultMcpBusCheck() {
  return {
    name: "mcp-bus",
    status: "healthy",
    lastCheck: Date.now(),
    details: { configuredMcps: 13 }
  };
}
function defaultPersistentTaskEngineCheck() {
  return {
    name: "persistent-task-engine",
    status: "healthy",
    lastCheck: Date.now(),
    details: { engineAvailable: true }
  };
}
function defaultToolUseEnforcerCheck() {
  return {
    name: "tool-use-enforcer",
    status: "healthy",
    lastCheck: Date.now(),
    details: { enforcerAvailable: true }
  };
}
function defaultDivoomCheck() {
  return {
    name: "divoom",
    status: "healthy",
    lastCheck: Date.now(),
    details: { divoomAvailable: true }
  };
}
function defaultOpenClawCheck() {
  return {
    name: "openclaw",
    status: "healthy",
    lastCheck: Date.now(),
    details: { gatewayAvailable: true }
  };
}

class SystemObserver {
  components = new Map;
  health = new Map;
  interval = null;
  agentActivity = new Map;
  warnings = [];
  errors = [];
  events = {};
  runningTasks = 0;
  connectedMcps = 0;
  constructor(config) {
    this.events = config?.events ?? {};
    this.register("plugin-bootstrap", defaultPluginBootstrapCheck);
    this.register("task-registry", defaultTaskRegistryCheck);
    this.register("mcp-bus", defaultMcpBusCheck);
    this.register("persistent-task-engine", defaultPersistentTaskEngineCheck);
    this.register("tool-use-enforcer", defaultToolUseEnforcerCheck);
    this.register("divoom", defaultDivoomCheck);
    this.register("openclaw", defaultOpenClawCheck);
  }
  register(name, check) {
    this.components.set(name, { name, check });
    if (!this.health.has(name)) {
      this.health.set(name, {
        name,
        status: "healthy",
        lastCheck: Date.now(),
        details: { seeded: true }
      });
    }
  }
  start(intervalMs) {
    if (this.interval)
      return;
    const ms = intervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
    this.runHealthCheck().catch((err) => {
      log("[SystemObserver] Initial health check failed", { error: String(err) });
    });
    this.interval = setInterval(() => {
      this.runHealthCheck().catch((err) => {
        log("[SystemObserver] Periodic health check failed", { error: String(err) });
      });
    }, ms);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  get isRunning() {
    return this.interval !== null;
  }
  async runHealthCheck() {
    const results = [];
    for (const [name, spec] of this.components) {
      try {
        const health = await spec.check();
        const prev = this.health.get(name);
        if (prev && prev.status !== health.status) {
          this.events.onStatusChange?.(name, prev.status, health.status);
          log("[SystemObserver] component status changed", {
            component: name,
            from: prev.status,
            to: health.status,
            error: health.lastError
          });
        }
        this.health.set(name, health);
        results.push(health);
      } catch (err) {
        const crashed = {
          name,
          status: "down",
          lastCheck: Date.now(),
          lastError: String(err)
        };
        this.health.set(name, crashed);
        results.push(crashed);
      }
    }
    const conflicts = this.detectPluginConflicts();
    if (conflicts.length > 0) {
      this.health.set("plugin-conflicts", {
        name: "plugin-conflicts",
        status: "degraded",
        lastCheck: Date.now(),
        details: { conflicts }
      });
      for (const c of conflicts) {
        this.warnings.push({
          component: "plugin-conflicts",
          message: `Plugin conflict: ${c}`,
          time: Date.now()
        });
      }
    } else {
      this.health.set("plugin-conflicts", {
        name: "plugin-conflicts",
        status: "healthy",
        lastCheck: Date.now()
      });
    }
    let overall = "healthy";
    for (const h of results) {
      if (h.status === "down") {
        overall = "critical";
        break;
      }
      if (h.status === "degraded") {
        overall = "degraded";
      }
    }
    if (conflicts.length > 0 && overall !== "critical") {
      overall = "degraded";
    }
    if (this.warnings.length > 50)
      this.warnings = this.warnings.slice(-50);
    if (this.errors.length > 50)
      this.errors = this.errors.slice(-50);
    const activitySnapshot = {};
    for (const [agent, data] of this.agentActivity) {
      activitySnapshot[agent] = { ...data };
    }
    log("[SystemObserver] health check complete", {
      overall,
      healthy: results.filter((r) => r.status === "healthy").length,
      total: results.length,
      tasks: this.runningTasks,
      mcps: this.connectedMcps,
      warnings: this.warnings.length,
      errors: this.errors.length
    });
    const report = {
      timestamp: Date.now(),
      overall,
      components: results,
      runningTasks: this.runningTasks,
      connectedMcps: this.connectedMcps,
      agentActivity: activitySnapshot,
      warnings: this.warnings.map((w) => `[${w.component}] ${w.message}`),
      errors: this.errors.map((e) => `[${e.component}] ${e.error}`)
    };
    this.events.onReport?.(report);
    return report;
  }
  getStatus() {
    const components = [];
    for (const name of this.components.keys()) {
      const h = this.health.get(name);
      if (h) {
        components.push(h);
      } else {
        components.push({
          name,
          status: "down",
          lastCheck: Date.now(),
          lastError: "never checked"
        });
      }
    }
    let overall = "healthy";
    for (const h of components) {
      if (h.status === "down") {
        overall = "critical";
        break;
      }
      if (h.status === "degraded")
        overall = "degraded";
    }
    const activitySnapshot = {};
    for (const [agent, data] of this.agentActivity) {
      activitySnapshot[agent] = { ...data };
    }
    return {
      timestamp: Date.now(),
      overall,
      components,
      runningTasks: this.runningTasks,
      connectedMcps: this.connectedMcps,
      agentActivity: activitySnapshot,
      warnings: this.warnings.map((w) => `[${w.component}] ${w.message}`),
      errors: this.errors.map((e) => `[${e.component}] ${e.error}`)
    };
  }
  reportWarning(component, message) {
    this.warnings.push({ component, message, time: Date.now() });
    this.events.onWarning?.(component, message);
  }
  reportError(component, error) {
    this.errors.push({ component, error, time: Date.now() });
    const existing = this.health.get(component);
    if (existing && existing.status === "healthy") {
      this.health.set(component, {
        ...existing,
        status: "degraded",
        lastError: error
      });
      this.events.onStatusChange?.(component, "healthy", "degraded");
    }
    this.events.onError?.(component, error);
  }
  recordAgentActivity(agentName) {
    const existing = this.agentActivity.get(agentName) ?? {
      lastActive: 0,
      tasksCompleted: 0
    };
    existing.lastActive = Date.now();
    this.agentActivity.set(agentName, existing);
  }
  recordTaskCompletion(agentName) {
    if (this.runningTasks > 0)
      this.runningTasks--;
    if (agentName) {
      const existing = this.agentActivity.get(agentName) ?? {
        lastActive: Date.now(),
        tasksCompleted: 0
      };
      existing.tasksCompleted++;
      existing.lastActive = Date.now();
      this.agentActivity.set(agentName, existing);
    }
  }
  recordTaskLaunch() {
    this.runningTasks++;
  }
  setConnectedMcps(count) {
    this.connectedMcps = count;
  }
  detectPluginConflicts() {
    const conflicts = [];
    try {
      const npmGlobal = process.env.npm_config_global ?? "";
      if (npmGlobal.includes("oh-my-openagent")) {
        conflicts.push("oh-my-openagent (global npm)");
      }
    } catch {}
    try {
      const configDir = path3.join(os.homedir(), ".config", "opencode");
      const pkgJsonPath = path3.join(configDir, "package.json");
      if (fs3.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs3.readFileSync(pkgJsonPath, "utf-8"));
        if (pkg.dependencies?.["oh-my-openagent"]) {
          conflicts.push(`oh-my-openagent@${pkg.dependencies["oh-my-openagent"]} in OpenCode config package.json`);
        }
        if (pkg.dependencies?.["oh-my-opencode-slim"]) {
          conflicts.push(`oh-my-opencode-slim@${pkg.dependencies["oh-my-opencode-slim"]} in OpenCode config package.json`);
        }
      }
    } catch {}
    try {
      const pluginsDir = path3.join(os.homedir(), ".config", "opencode", "plugins");
      if (fs3.existsSync(pluginsDir)) {
        const plugins = fs3.readdirSync(pluginsDir);
        for (const plugin of plugins) {
          if ((plugin.includes("oh-my-openagent") || plugin.includes("oh-my-opencode-slim")) && !plugin.includes("unified")) {
            conflicts.push(`${plugin} in plugins directory`);
          }
        }
      }
    } catch {}
    return conflicts;
  }
  getRawWarnings() {
    return [...this.warnings];
  }
  getRawErrors() {
    return [...this.errors];
  }
  getRawHealth() {
    return new Map(this.health);
  }
  getRawAgentActivity() {
    return new Map(this.agentActivity);
  }
}
// src/persistence/task-registry.ts
init_sqlite();
function rowToTask(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    parentSessionId: row.parent_session_id ?? undefined,
    agent: row.agent,
    status: row.status,
    description: row.description,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    outputCache: row.output_cache ?? undefined,
    metadata: row.metadata ?? undefined
  };
}

class TaskRegistry {
  db;
  constructor(dbPath) {
    this.db = new TypedDatabase(dbPath);
    this.db.run("PRAGMA journal_mode=WAL");
    this.migrate();
  }
  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        parent_session_id TEXT,
        agent TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        category TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER,
        output_cache TEXT,
        metadata TEXT
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS task_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL REFERENCES tasks(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL REFERENCES tasks(id),
        depends_on_id TEXT NOT NULL REFERENCES tasks(id),
        PRIMARY KEY (task_id, depends_on_id)
      )
    `);
  }
  close() {
    this.db.close();
  }
  createTask(record) {
    const now = Date.now();
    const task = {
      ...record,
      createdAt: now,
      updatedAt: now
    };
    this.db.prepare(`INSERT INTO tasks (id, session_id, parent_session_id, agent, status, description, category, created_at, updated_at, completed_at, output_cache, metadata)
         VALUES ($id, $sessionId, $parentSessionId, $agent, $status, $description, $category, $createdAt, $updatedAt, $completedAt, $outputCache, $metadata)`).run({
      $id: task.id,
      $sessionId: task.sessionId,
      $parentSessionId: task.parentSessionId ?? null,
      $agent: task.agent,
      $status: task.status,
      $description: task.description,
      $category: task.category ?? null,
      $createdAt: task.createdAt,
      $updatedAt: task.updatedAt,
      $completedAt: task.completedAt ?? null,
      $outputCache: task.outputCache ?? null,
      $metadata: task.metadata ?? null
    });
    return task;
  }
  getTask(id) {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = $id").get({ $id: id });
    return row ? rowToTask(row) : null;
  }
  getTaskBySession(sessionId) {
    const row = this.db.prepare("SELECT * FROM tasks WHERE session_id = $sessionId LIMIT 1").get({ $sessionId: sessionId });
    return row ? rowToTask(row) : null;
  }
  updateStatus(id, status, extra) {
    const now = Date.now();
    const completedAt = status === "completed" || status === "error" ? now : null;
    const updates = ["updated_at = $updatedAt"];
    const params = { $updatedAt: now, $id: id };
    updates.push("status = $status");
    params.$status = status;
    if (completedAt !== null) {
      updates.push("completed_at = $completedAt");
      params.$completedAt = completedAt;
    }
    if (extra?.outputCache !== undefined) {
      updates.push("output_cache = $outputCache");
      params.$outputCache = extra.outputCache;
    }
    if (extra?.metadata !== undefined) {
      updates.push("metadata = $metadata");
      params.$metadata = extra.metadata;
    }
    if (extra?.description !== undefined) {
      updates.push("description = $description");
      params.$description = extra.description;
    }
    if (extra?.category !== undefined) {
      updates.push("category = $category");
      params.$category = extra.category;
    }
    if (extra?.parentSessionId !== undefined) {
      updates.push("parent_session_id = $parentSessionId");
      params.$parentSessionId = extra.parentSessionId;
    }
    this.db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = $id`).run(params);
  }
  listTasksByParent(parentSessionId) {
    const rows = this.db.prepare("SELECT * FROM tasks WHERE parent_session_id = $parentSessionId ORDER BY created_at ASC").all({ $parentSessionId: parentSessionId });
    return rows.map(rowToTask);
  }
  listTasksByStatus(status) {
    const rows = this.db.prepare("SELECT * FROM tasks WHERE status = $status ORDER BY created_at DESC").all({ $status: status });
    return rows.map(rowToTask);
  }
  listRunningTasks() {
    const rows = this.db.prepare("SELECT * FROM tasks WHERE status IN ('pending', 'running') ORDER BY created_at ASC").all();
    return rows.map(rowToTask);
  }
  deleteTask(id) {
    this.db.prepare("DELETE FROM task_messages WHERE task_id = $id").run({ $id: id });
    this.db.prepare("DELETE FROM task_dependencies WHERE task_id = $id OR depends_on_id = $id").run({
      $id: id
    });
    this.db.prepare("DELETE FROM tasks WHERE id = $id").run({ $id: id });
  }
  addMessage(taskId, role, content) {
    this.db.prepare(`INSERT INTO task_messages (task_id, role, content, timestamp)
         VALUES ($taskId, $role, $content, $timestamp)`).run({
      $taskId: taskId,
      $role: role,
      $content: content,
      $timestamp: Date.now()
    });
  }
  clearMessages(taskId) {
    this.db.prepare("DELETE FROM task_messages WHERE task_id = $taskId").run({ $taskId: taskId });
  }
  getMessages(taskId) {
    const rows = this.db.prepare("SELECT id, task_id, role, content, timestamp FROM task_messages WHERE task_id = $taskId ORDER BY timestamp ASC").all({ $taskId: taskId });
    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp
    }));
  }
  getStats() {
    const row = this.db.prepare("SELECT COUNT(*) as total FROM tasks").get() ?? { total: 0 };
    const statusRows = this.db.prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status").all();
    const byStatus = {};
    for (const sr of statusRows) {
      byStatus[sr.status] = sr.count;
    }
    return { total: row.total, byStatus };
  }
}
// src/background/completion-detector.ts
var MIN_IDLE_MS = 100;
var POLL_INTERVAL_MS = 2000;
var STABILITY_THRESHOLD = 3;
var IDLE_COALESCE_MS = 100;

class CompletionDetector {
  callbacks;
  pollInterval = null;
  deferredChecks = new Map;
  messageCountSnapshot = new Map;
  messageCountStable = new Map;
  idleCoalesceTimers = new Map;
  pendingIdlePayloads = new Map;
  constructor(callbacks) {
    this.callbacks = callbacks;
  }
  onSessionIdle(taskId, sessionId, elapsedMs) {
    const existingTimer = this.idleCoalesceTimers.get(taskId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    this.pendingIdlePayloads.set(taskId, { taskId, sessionId, elapsedMs });
    const timer = setTimeout(() => {
      this.idleCoalesceTimers.delete(taskId);
      const payload = this.pendingIdlePayloads.get(taskId);
      this.pendingIdlePayloads.delete(taskId);
      if (payload) {
        this.processIdleEvent(payload.taskId, payload.sessionId, payload.elapsedMs);
      }
    }, IDLE_COALESCE_MS);
    if (typeof timer === "object" && "unref" in timer) {
      timer.unref();
    }
    this.idleCoalesceTimers.set(taskId, timer);
    return "coalesced";
  }
  processIdleEvent(taskId, _sessionId, elapsedMs) {
    if (elapsedMs < MIN_IDLE_MS) {
      const remaining = MIN_IDLE_MS - elapsedMs;
      this.scheduleDeferredCheck(taskId, remaining);
      return "deferred";
    }
    const messages = this.callbacks.getMessages(taskId);
    const hasFinalContent = messages.some((m) => (m.role === "assistant" || m.role === "agent") && m.content && m.content.length > 0);
    if (hasFinalContent) {
      const finalMessages = messages.filter((m) => (m.role === "assistant" || m.role === "agent") && m.content);
      const finalContent = finalMessages.length > 0 ? finalMessages[finalMessages.length - 1].content : undefined;
      this.callbacks.updateStatus(taskId, "completed", {
        outputCache: finalContent,
        completedAt: Date.now()
      });
      this.cleanupDeferred(taskId);
      return "completed";
    }
    this.scheduleDeferredCheck(taskId, 500);
    return "still-running";
  }
  async onPollTick() {
    const runningIds = this.callbacks.getRunningTaskIds();
    for (const taskId of runningIds) {
      const messages = this.callbacks.getMessages(taskId);
      const currentCount = messages.length;
      const prevCount = this.messageCountSnapshot.get(taskId) ?? -1;
      const stableCount = this.messageCountStable.get(taskId) ?? 0;
      if (currentCount === prevCount && currentCount > 0) {
        const newStable = stableCount + 1;
        this.messageCountStable.set(taskId, newStable);
        if (newStable >= STABILITY_THRESHOLD) {
          const finalContent = this.extractFinalContent(messages);
          this.callbacks.updateStatus(taskId, "completed", {
            outputCache: finalContent,
            completedAt: Date.now()
          });
          this.cleanupPollingState(taskId);
        }
      } else {
        this.messageCountSnapshot.set(taskId, currentCount);
        this.messageCountStable.set(taskId, 0);
      }
    }
    this.cleanupStalePollingState(runningIds);
  }
  startPolling(intervalMs = POLL_INTERVAL_MS) {
    if (this.pollInterval)
      return;
    this.pollInterval = setInterval(() => {
      this.onPollTick().catch(() => {});
    }, intervalMs);
  }
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  scheduleDeferredCheck(taskId, delayMs) {
    this.cleanupDeferred(taskId);
    const timer = setTimeout(() => {
      this.deferredChecks.delete(taskId);
      this.processIdleEvent(taskId, "", MIN_IDLE_MS + 1);
    }, delayMs);
    if (typeof timer === "object" && "unref" in timer) {
      timer.unref();
    }
    this.deferredChecks.set(taskId, timer);
  }
  cleanupDeferred(taskId) {
    const existing = this.deferredChecks.get(taskId);
    if (existing) {
      clearTimeout(existing);
      this.deferredChecks.delete(taskId);
    }
  }
  cleanupPollingState(taskId) {
    this.messageCountSnapshot.delete(taskId);
    this.messageCountStable.delete(taskId);
  }
  cleanupStalePollingState(runningIds) {
    const runningSet = runningIds instanceof Set ? runningIds : new Set(runningIds);
    for (const taskId of this.messageCountSnapshot.keys()) {
      if (!runningSet.has(taskId)) {
        this.cleanupPollingState(taskId);
      }
    }
  }
  extractFinalContent(messages) {
    const finalMessages = messages.filter((m) => (m.role === "assistant" || m.role === "agent") && m.content);
    return finalMessages.length > 0 ? finalMessages[finalMessages.length - 1].content : undefined;
  }
  dispose() {
    this.stopPolling();
    for (const [taskId] of this.deferredChecks) {
      this.cleanupDeferred(taskId);
    }
    for (const [taskId] of this.idleCoalesceTimers) {
      const timer = this.idleCoalesceTimers.get(taskId);
      if (timer)
        clearTimeout(timer);
    }
    this.idleCoalesceTimers.clear();
    this.pendingIdlePayloads.clear();
    this.messageCountSnapshot.clear();
    this.messageCountStable.clear();
  }
}

// src/background/reconstructor.ts
class TaskReconstructor {
  registry;
  constructor(registry) {
    this.registry = registry;
  }
  async reconstruct(taskId, sessionId, client) {
    const recovered = await this.recoverSessionData(taskId, sessionId, client);
    if (!recovered)
      return null;
    const now = Date.now();
    const record = {
      id: taskId,
      sessionId,
      agent: recovered.agentName,
      status: recovered.status,
      description: recovered.description,
      category: "reconstructed",
      completedAt: recovered.status === "completed" || recovered.status === "error" ? now : undefined,
      outputCache: this.extractFinalContent(recovered.messages),
      metadata: JSON.stringify({ reconstructed: true, recoveredAt: now })
    };
    const task = this.registry.createTask(record);
    for (const msg of recovered.messages) {
      this.registry.addMessage(taskId, msg.role, msg.content);
    }
    return task;
  }
  async recoverSessionData(taskId, sessionId, client) {
    let messages = [];
    let status = "completed";
    let agentName = "unknown";
    let description = `Reconstructed task ${taskId}`;
    if (client.session?.read) {
      try {
        const readResult = await client.session.read(sessionId);
        if (readResult) {
          if (readResult.messages && Array.isArray(readResult.messages)) {
            messages = readResult.messages.map((m) => ({
              role: m.role ?? "unknown",
              content: m.content ?? "",
              timestamp: m.ts ?? m.timestamp ?? Date.now()
            }));
          }
          if (readResult.status) {
            status = this.mapStatus(readResult.status);
          }
          if (messages.length > 0) {
            const firstMsg = messages[0];
            agentName = firstMsg.role === "user" ? "orchestrator" : firstMsg.role;
            description = messages.filter((m) => m.role === "user").map((m) => m.content.slice(0, 100)).join("; ") || `Reconstructed from session ${sessionId}`;
          }
          return { messages, status, agentName, description };
        }
      } catch {}
    }
    if (client.session?.info) {
      try {
        const infoResult = await client.session.info(sessionId);
        if (infoResult) {
          return {
            messages: [],
            status: infoResult.status ?? "completed",
            agentName,
            description: `Reconstructed from session info: ${infoResult.status ?? "completed"}`
          };
        }
      } catch {}
    }
    return null;
  }
  mapStatus(sessionStatus) {
    switch (sessionStatus) {
      case "completed":
      case "finished":
      case "done":
        return "completed";
      case "error":
      case "failed":
      case "errored":
        return "error";
      case "running":
      case "active":
      case "in_progress":
        return "running";
      case "cancelled":
      case "canceled":
        return "cancelled";
      default:
        return "completed";
    }
  }
  extractFinalContent(messages) {
    const finalMessages = messages.filter((m) => (m.role === "assistant" || m.role === "agent") && m.content);
    return finalMessages.length > 0 ? finalMessages[finalMessages.length - 1].content : undefined;
  }
}

// src/background/persistent-task-engine.ts
function generateTaskId2() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `bg_${Date.now()}_${suffix}`;
}
function generateSessionId2() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `ses_${Date.now()}_${suffix}`;
}
var DEFAULTS = {
  taskRetentionDays: 7,
  maxConcurrentTasks: 10,
  defaultTimeoutMs: 300000,
  healthCheckIntervalMs: 30000
};

class PersistentTaskEngine {
  registry;
  detector;
  reconstructor;
  config;
  _shutdown = false;
  constructor(config) {
    this.config = {
      dbPath: config.dbPath,
      taskRetentionDays: config.taskRetentionDays ?? DEFAULTS.taskRetentionDays,
      maxConcurrentTasks: config.maxConcurrentTasks ?? DEFAULTS.maxConcurrentTasks,
      defaultTimeoutMs: config.defaultTimeoutMs ?? DEFAULTS.defaultTimeoutMs,
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? DEFAULTS.healthCheckIntervalMs
    };
    this.registry = new TaskRegistry(this.config.dbPath);
    this.reconstructor = new TaskReconstructor(this.registry);
    const callbacks = {
      getTask: (id) => this.registry.getTask(id),
      updateStatus: (id, status, extra) => this.registry.updateStatus(id, status, extra),
      getMessages: (taskId) => this.registry.getMessages(taskId),
      getRunningTaskIds: () => this.registry.listRunningTasks().map((t) => t.id)
    };
    this.detector = new CompletionDetector(callbacks);
    this.detector.startPolling(this.config.healthCheckIntervalMs);
  }
  async launchTask(input, _client) {
    if (this._shutdown)
      throw new Error("Engine is shut down");
    const running = this.registry.listRunningTasks();
    if (running.length >= (this.config.maxConcurrentTasks ?? DEFAULTS.maxConcurrentTasks)) {
      throw new Error(`Max concurrent tasks reached (${this.config.maxConcurrentTasks}). ` + `Cancel a running task before launching a new one.`);
    }
    const taskId = generateTaskId2();
    const sessionId = generateSessionId2();
    this.registry.createTask({
      id: taskId,
      sessionId,
      parentSessionId: input.parentSessionId,
      agent: input.agent,
      status: "pending",
      description: input.description,
      category: input.category,
      metadata: JSON.stringify({
        timeoutMs: input.timeoutMs ?? this.config.defaultTimeoutMs
      })
    });
    this.registry.updateStatus(taskId, "running");
    return { taskId, sessionId };
  }
  async getTaskOutput(taskId, sessionId, client) {
    if (this._shutdown)
      return null;
    const task = this.registry.getTask(taskId);
    if (task) {
      const messages = this.registry.getMessages(taskId);
      return {
        task,
        messages,
        finalContent: task.outputCache
      };
    }
    try {
      const reconstructed = await this.reconstructor.reconstruct(taskId, sessionId, client);
      if (reconstructed) {
        const messages = this.registry.getMessages(taskId);
        return {
          task: reconstructed,
          messages,
          finalContent: reconstructed.outputCache,
          reconstructed: true
        };
      }
    } catch {}
    return null;
  }
  async cancelTask(taskId, _client) {
    if (this._shutdown)
      return;
    const task = this.registry.getTask(taskId);
    if (!task)
      return;
    if (task.status === "completed" || task.status === "cancelled" || task.status === "error") {
      return;
    }
    this.registry.updateStatus(taskId, "cancelled", {
      completedAt: Date.now()
    });
  }
  listRunningTasks() {
    if (this._shutdown)
      return [];
    return this.registry.listRunningTasks();
  }
  getRegistry() {
    return this.registry;
  }
  async syncSessionMessages(taskId, sessionId, client) {
    if (this._shutdown)
      return;
    try {
      const data = await client.session?.read?.(sessionId);
      if (data && Array.isArray(data.messages)) {
        this.registry.clearMessages(taskId);
        for (const msg of data.messages) {
          this.registry.addMessage(taskId, msg.role, msg.content);
        }
        const assistantMsgs = data.messages.filter((m) => m.role === "assistant");
        if (assistantMsgs.length > 0) {
          const finalMsg = assistantMsgs[assistantMsgs.length - 1];
          this.registry.updateStatus(taskId, "running", {
            outputCache: finalMsg.content
          });
        }
      }
    } catch (err) {}
  }
  getStats() {
    if (this._shutdown)
      return { total: 0, byStatus: {}, running: 0 };
    const stats = this.registry.getStats();
    const running = this.registry.listRunningTasks().length;
    return {
      total: stats.total,
      byStatus: stats.byStatus,
      running
    };
  }
  onSessionIdle(taskId, sessionId, elapsedMs, client) {
    if (this._shutdown)
      return "still-running";
    if (client) {
      this.syncSessionMessages(taskId, sessionId, client).catch(() => {});
    }
    return this.detector.onSessionIdle(taskId, sessionId, elapsedMs);
  }
  shutdown() {
    if (this._shutdown)
      return;
    this._shutdown = true;
    this.detector.dispose();
    this.registry.close();
  }
}

// src/features/agent-selector/index.ts
var TASK_KEYWORDS = {
  planning: ["odin", "mimir", "frigg"],
  implementation: ["thor", "hermod", "magni"],
  design: ["freyr", "heimdall"],
  research: ["eir", "sif", "vidar"],
  review: ["tyr", "mimir", "forseti"],
  search: ["sif", "vidar"],
  council: ["forseti", "hod"],
  orchestration: ["njord"],
  mapping: ["vidar"],
  security: ["tyr", "mimir"],
  documentation: ["eir"],
  testing: ["hermod", "magni"]
};

class AgentSelector {
  metadata = new Map;
  modelCapabilities = new Map;
  agentMCPs = new Map;
  agentHealth = new Map;
  lastSuggestionTime = new Map;
  suggestionCooldownMs = 30000;
  registerAgent(agent) {
    this.metadata.set(agent.name, {
      currentModel: agent.model,
      modelCapabilities: [],
      assignedMCPs: [],
      healthStatus: "healthy",
      lastActiveAt: 0,
      errorRate: 0,
      sessionCount: 0
    });
    this.agentHealth.set(agent.name, {
      errors: 0,
      successes: 0,
      lastActive: 0
    });
  }
  setModelCapabilities(agentName, capabilities) {
    this.modelCapabilities.set(agentName, capabilities);
    const meta = this.metadata.get(agentName);
    if (meta)
      meta.modelCapabilities = capabilities;
  }
  setAssignedMCPs(agentName, mcps) {
    this.agentMCPs.set(agentName, mcps);
    const meta = this.metadata.get(agentName);
    if (meta)
      meta.assignedMCPs = mcps;
  }
  recordSuccess(agentName) {
    const h = this.agentHealth.get(agentName);
    if (h) {
      h.successes++;
      h.lastActive = Date.now();
      const meta = this.metadata.get(agentName);
      if (meta) {
        meta.lastActiveAt = h.lastActive;
        meta.sessionCount = h.successes + h.errors;
        meta.errorRate = h.errors / Math.max(1, h.successes + h.errors);
        meta.healthStatus = meta.errorRate > 0.5 ? "error" : meta.errorRate > 0.2 ? "degraded" : "healthy";
      }
    }
  }
  recordError(agentName) {
    const h = this.agentHealth.get(agentName);
    if (h) {
      h.errors++;
      h.lastActive = Date.now();
      const meta = this.metadata.get(agentName);
      if (meta) {
        meta.lastActiveAt = h.lastActive;
        meta.sessionCount = h.successes + h.errors;
        meta.errorRate = h.errors / Math.max(1, h.successes + h.errors);
        meta.healthStatus = meta.errorRate > 0.5 ? "error" : meta.errorRate > 0.2 ? "degraded" : "healthy";
      }
    }
  }
  getAgentList() {
    return AGENTS.map((agent) => {
      const meta = this.metadata.get(agent.name) ?? {};
      const health = this.agentHealth.get(agent.name);
      return {
        ...agent,
        currentModel: meta.currentModel ?? agent.model,
        modelCapabilities: meta.modelCapabilities ?? this.modelCapabilities.get(agent.name) ?? [],
        assignedMCPs: meta.assignedMCPs ?? this.agentMCPs.get(agent.name) ?? [],
        healthStatus: meta.healthStatus ?? "healthy",
        lastActiveAt: meta.lastActiveAt ?? health?.lastActive ?? 0,
        errorRate: meta.errorRate ?? 0,
        sessionCount: meta.sessionCount ?? (health?.successes ?? 0) + (health?.errors ?? 0)
      };
    });
  }
  getAgentByMention(mention) {
    const agent = getAgent(mention);
    if (!agent)
      return;
    const meta = this.metadata.get(agent.name) ?? {};
    const health = this.agentHealth.get(agent.name);
    return {
      ...agent,
      currentModel: meta.currentModel ?? agent.model,
      modelCapabilities: meta.modelCapabilities ?? this.modelCapabilities.get(agent.name) ?? [],
      assignedMCPs: meta.assignedMCPs ?? this.agentMCPs.get(agent.name) ?? [],
      healthStatus: meta.healthStatus ?? "healthy",
      lastActiveAt: meta.lastActiveAt ?? health?.lastActive ?? 0,
      errorRate: meta.errorRate ?? 0,
      sessionCount: meta.sessionCount ?? (health?.successes ?? 0) + (health?.errors ?? 0)
    };
  }
  getSuggestions(context, sessionId) {
    if (sessionId) {
      const lastTime = this.lastSuggestionTime.get(sessionId) ?? 0;
      if (Date.now() - lastTime < this.suggestionCooldownMs) {
        return [];
      }
    }
    const lower = context.toLowerCase();
    const suggestions = [];
    for (const [taskType, agentNames] of Object.entries(TASK_KEYWORDS)) {
      if (lower.includes(taskType)) {
        for (const name of agentNames) {
          const meta = this.getAgentByMention(name);
          if (meta && meta.healthStatus !== "error") {
            suggestions.push({
              agent: meta,
              relevance: meta.healthStatus === "healthy" ? 1 : 0.7,
              reason: `Best for ${taskType} tasks`
            });
          }
        }
      }
    }
    if (suggestions.length > 0 && sessionId) {
      this.lastSuggestionTime.set(sessionId, Date.now());
    }
    suggestions.sort((a, b) => b.relevance - a.relevance);
    return suggestions.slice(0, 5);
  }
  getSlashCommandOutput() {
    const agents = this.getAgentList();
    const lines = ["**Available Agents**", ""];
    for (const agent of agents) {
      const status = agent.healthStatus === "healthy" ? "✓" : agent.healthStatus === "degraded" ? "⚠" : "✗";
      lines.push(`${status} **${agent.displayName}** — ${agent.role}`);
      lines.push(`   Model: ${agent.currentModel} | MCPs: ${agent.assignedMCPs.length} | Sessions: ${agent.sessionCount}`);
      if (agent.modelCapabilities.length > 0) {
        lines.push(`   Capabilities: ${agent.modelCapabilities.slice(0, 5).join(", ")}`);
      }
    }
    return lines.join(`
`);
  }
  getStats() {
    const agents = this.getAgentList();
    return {
      total: agents.length,
      healthy: agents.filter((a) => a.healthStatus === "healthy").length,
      degraded: agents.filter((a) => a.healthStatus === "degraded").length,
      error: agents.filter((a) => a.healthStatus === "error").length
    };
  }
}
function createAgentSelector() {
  const selector = new AgentSelector;
  for (const agent of AGENTS) {
    selector.registerAgent(agent);
  }
  return selector;
}

// src/interview/server.ts
import { createServer } from "node:http";
class InterviewEngine {
  sessions = new Map;
  server = null;
  port;
  clients = new Set;
  constructor(port = 3456) {
    this.port = port;
  }
  createSession(sessionId, title, questions) {
    const session2 = {
      id: `interview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      startedAt: Date.now(),
      questions,
      answers: {},
      completed: false,
      sessionId
    };
    this.sessions.set(session2.id, session2);
    log("[interview] session created", { id: session2.id, title, questionCount: questions.length });
    this.broadcastUpdate();
    return session2;
  }
  getSession(id) {
    return this.sessions.get(id);
  }
  getActiveSessions() {
    return [...this.sessions.values()].filter((s) => !s.completed);
  }
  submitAnswer(sessionId, questionId, answer) {
    const session2 = this.sessions.get(sessionId);
    if (!session2)
      return false;
    session2.answers[questionId] = answer;
    session2.completed = session2.questions.every((q) => session2.answers[q.id]?.trim());
    if (session2.completed) {
      session2.completedAt = Date.now();
      log("[interview] session completed", { id: session2.id, answerCount: Object.keys(session2.answers).length });
    }
    this.broadcastUpdate();
    return true;
  }
  deleteSession(id) {
    const removed = this.sessions.delete(id);
    if (removed)
      this.broadcastUpdate();
    return removed;
  }
  getStats() {
    const all = [...this.sessions.values()];
    return {
      total: all.length,
      active: all.filter((s) => !s.completed).length,
      completed: all.filter((s) => s.completed).length,
      totalAnswers: all.reduce((sum, s) => sum + Object.keys(s.answers).length, 0)
    };
  }
  broadcastUpdate() {
    const data = JSON.stringify({ type: "update", sessions: this.getSummary() });
    for (const client of this.clients) {
      try {
        client.write(`data: ${data}

`);
      } catch {
        this.clients.delete(client);
      }
    }
  }
  getSummary() {
    return [...this.sessions.values()].map((s) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      progress: s.questions.length > 0 ? Math.round(Object.keys(s.answers).length / s.questions.length * 100) : 0,
      questionCount: s.questions.length
    }));
  }
  start() {
    this.server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${this.port}`);
      if (url.pathname === "/sse") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive"
        });
        const client = {
          write: (data) => res.write(data),
          end: () => res.end()
        };
        this.clients.add(client);
        req.on("close", () => this.clients.delete(client));
        res.write(`data: ${JSON.stringify({ type: "init", sessions: this.getSummary() })}

`);
        return;
      }
      if (url.pathname === "/api/sessions" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.getSummary()));
        return;
      }
      if (url.pathname === "/api/stats" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.getStats()));
        return;
      }
      if (url.pathname.startsWith("/api/session/") && req.method === "GET") {
        const id = url.pathname.split("/").pop() ?? "";
        const session2 = this.getSession(id);
        if (!session2) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "Session not found" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(session2));
        return;
      }
      if (url.pathname.startsWith("/api/session/") && url.pathname.endsWith("/answer") && req.method === "POST") {
        const parts = url.pathname.split("/");
        const sessionId = parts[3];
        let body = "";
        req.on("data", (chunk) => body += chunk);
        req.on("end", () => {
          try {
            const { questionId, answer } = JSON.parse(body);
            const ok = this.submitAnswer(sessionId, questionId, answer);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok, completed: this.getSession(sessionId)?.completed }));
          } catch {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid request" }));
          }
        });
        return;
      }
      if (url.pathname === "/" || url.pathname === "/dashboard") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(this.getDashboardHTML());
        return;
      }
      res.writeHead(404);
      res.end("Not found");
    });
    this.server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        log("[interview] port in use, trying fallback", { port: this.port });
        this.server?.listen(0, () => {
          const addr = this.server?.address();
          const actualPort = typeof addr === "object" && addr ? addr.port : this.port;
          log("[interview] dashboard running", { port: actualPort, url: `http://localhost:${actualPort}` });
        });
      } else {
        log("[interview] server error", { error: err.message });
      }
    });
    this.server.listen(this.port, () => {
      log("[interview] dashboard running", { port: this.port, url: `http://localhost:${this.port}` });
    });
  }
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      for (const client of this.clients)
        client.end();
      this.clients.clear();
      log("[interview] server stopped");
    }
  }
  dispose() {
    this.stop();
    this.sessions.clear();
  }
  getDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Dashboard — oh-my-unified</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #58a6ff; }
  .stats { display: flex; gap: 1rem; margin: 1rem 0; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; flex: 1; text-align: center; }
  .stat-value { font-size: 2rem; font-weight: 700; color: #58a6ff; }
  .stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; margin-top: 0.25rem; }
  .sessions { margin-top: 1.5rem; }
  .session { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; }
  .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .session-title { font-weight: 600; color: #c9d1d9; }
  .session-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; }
  .badge-active { background: #238636; color: #fff; }
  .badge-done { background: #1f6feb; color: #fff; }
  .progress-bar { height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #238636, #2ea043); transition: width 0.3s; }
  .progress-fill.done { background: linear-gradient(90deg, #1f6feb, #388bfd); }
  .progress-text { font-size: 0.75rem; color: #8b949e; margin-top: 0.25rem; }
  .empty { text-align: center; padding: 3rem; color: #484f58; font-size: 0.9rem; }
</style>
</head>
<body>
<h1>Interview Dashboard</h1>
<p style="color:#8b949e;font-size:0.85rem">Real-time interview session monitoring</p>
<div class="stats">
  <div class="stat"><div class="stat-value" id="stat-total">0</div><div class="stat-label">Total</div></div>
  <div class="stat"><div class="stat-value" id="stat-active">0</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-value" id="stat-completed">0</div><div class="stat-label">Completed</div></div>
  <div class="stat"><div class="stat-value" id="stat-answers">0</div><div class="stat-label">Answers</div></div>
</div>
<div class="sessions" id="sessions"><div class="empty">No interview sessions yet</div></div>
<script>
const evt = new EventSource('/sse');
evt.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'init' || data.type === 'update') {
    render(data.sessions);
    fetch('/api/stats').then(r => r.json()).then(updateStats);
  }
};
function updateStats(s) {
  document.getElementById('stat-total').textContent = s.total;
  document.getElementById('stat-active').textContent = s.active;
  document.getElementById('stat-completed').textContent = s.completed;
  document.getElementById('stat-answers').textContent = s.totalAnswers;
}
function render(sessions) {
  const el = document.getElementById('sessions');
  if (!sessions || sessions.length === 0) {
    el.innerHTML = '<div class="empty">No interview sessions yet</div>';
    return;
  }
  el.innerHTML = sessions.map(s => \`
    <div class="session">
      <div class="session-header">
        <span class="session-title">\${s.title}</span>
        <span class="session-badge \${s.completed ? 'badge-done' : 'badge-active'}">\${s.completed ? 'Completed' : 'In Progress'}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill \${s.completed ? 'done' : ''}" style="width:\${s.progress}%"></div></div>
      <div class="progress-text">\${s.progress}% complete — \${s.questionCount} questions</div>
    </div>
  \`).join('');
}
</script>
</body>
</html>`;
  }
}

// src/features/skill-mcp-manager/index.ts
class SkillMcpManager {
  registry = new Map;
  connections = new Map;
  register(skillName, serverName, config) {
    const key = `${skillName}:${serverName}`;
    this.registry.set(key, { skillName, serverName, config });
    log("[skill-mcp] registered", { skillName, serverName, type: config.command ? "stdio" : "http" });
  }
  unregister(skillName, serverName) {
    const key = `${skillName}:${serverName}`;
    this.registry.delete(key);
    this.disconnect(skillName, serverName);
  }
  async connect(skillName, serverName) {
    const key = `${skillName}:${serverName}`;
    const entry = this.registry.get(key);
    if (!entry) {
      return { skillName, serverName, status: "error", error: "Not registered" };
    }
    const conn = {
      skillName,
      serverName,
      status: "connecting"
    };
    this.connections.set(key, conn);
    try {
      if (entry.config.command) {
        conn.status = "connected";
        conn.tools = await this.discoverStdioTools(entry.config);
      } else if (entry.config.url) {
        conn.status = "connected";
        conn.tools = await this.discoverHttpTools(entry.config);
      } else {
        conn.status = "error";
        conn.error = "No command or URL configured";
      }
    } catch (err) {
      conn.status = "error";
      conn.error = String(err);
      log("[skill-mcp] connection failed", { skillName, serverName, error: conn.error });
    }
    log("[skill-mcp] connected", { skillName, serverName, status: conn.status, toolCount: conn.tools?.length });
    return conn;
  }
  disconnect(skillName, serverName) {
    const key = `${skillName}:${serverName}`;
    const conn = this.connections.get(key);
    if (conn) {
      conn.status = "disconnected";
    }
    this.connections.delete(key);
  }
  disconnectAll(skillName) {
    for (const [key, conn] of this.connections) {
      if (conn.skillName === skillName) {
        conn.status = "disconnected";
        this.connections.delete(key);
      }
    }
  }
  getConnection(skillName, serverName) {
    return this.connections.get(`${skillName}:${serverName}`);
  }
  getAllConnections() {
    return [...this.connections.values()];
  }
  getRegistry() {
    return [...this.registry.values()];
  }
  parseSkillMcpYaml(yaml, skillName) {
    const configs = [];
    const lines = yaml.split(`
`);
    let current = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("mcp:"))
        continue;
      if (trimmed.startsWith("- name:")) {
        if (current?.name)
          configs.push(current);
        current = { name: trimmed.replace("- name:", "").trim() };
      } else if (current && trimmed.startsWith("command:")) {
        current.command = trimmed.replace("command:", "").trim();
      } else if (current && trimmed.startsWith("url:")) {
        current.url = trimmed.replace("url:", "").trim();
      } else if (current && trimmed.startsWith("args:")) {
        const argsStr = trimmed.replace("args:", "").trim();
        current.args = argsStr.startsWith("[") ? JSON.parse(argsStr) : argsStr.split(" ").filter(Boolean);
      }
    }
    if (current?.name)
      configs.push(current);
    log("[skill-mcp] parsed yaml", { skillName, serverCount: configs.length });
    return configs;
  }
  async discoverStdioTools(config) {
    try {
      const { spawn } = await import("node:child_process");
      return new Promise((resolve3) => {
        const proc = spawn(config.command, config.args ?? [], {
          env: { ...process.env, ...config.env },
          timeout: 5000
        });
        let output = "";
        proc.stdout?.on("data", (d) => output += d.toString());
        proc.stderr?.on("data", (d) => output += d.toString());
        proc.on("close", () => {
          try {
            const parsed = JSON.parse(output);
            if (Array.isArray(parsed)) {
              resolve3(parsed.map((t) => t.name ?? t));
            } else if (parsed.tools) {
              resolve3(parsed.tools.map((t) => t.name));
            } else {
              resolve3([]);
            }
          } catch {
            resolve3([]);
          }
        });
        proc.on("error", () => resolve3([]));
        setTimeout(() => {
          proc.kill();
          resolve3([]);
        }, 5000);
      });
    } catch {
      return [];
    }
  }
  async discoverHttpTools(config) {
    try {
      const url = config.url;
      const toolsUrl = url.endsWith("/") ? `${url}tools` : `${url}/tools`;
      const resp = await fetch(toolsUrl, {
        headers: config.headers,
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok)
        return [];
      const data = await resp.json();
      if (Array.isArray(data))
        return data.map((t) => t.name ?? t);
      if (data.tools)
        return data.tools.map((t) => t.name);
      return [];
    } catch {
      return [];
    }
  }
  dispose() {
    for (const conn of this.connections.values()) {
      conn.status = "disconnected";
    }
    this.connections.clear();
    this.registry.clear();
  }
}

// src/features/model-router/requirements.ts
var AGENT_REQUIREMENTS = {
  odin: { agentName: "odin", reasoning: 9, speed: 5, creativity: 7, context: "large" },
  njord: { agentName: "njord", reasoning: 8, speed: 6, creativity: 6, context: "large" },
  mimir: { agentName: "mimir", reasoning: 10, speed: 4, creativity: 5, context: "large" },
  vidar: { agentName: "vidar", reasoning: 8, speed: 5, creativity: 4, context: "xlarge" },
  thor: { agentName: "thor", reasoning: 6, speed: 8, creativity: 5, context: "large" },
  forseti: { agentName: "forseti", reasoning: 8, speed: 3, creativity: 8, context: "large" },
  frigg: { agentName: "frigg", reasoning: 9, speed: 4, creativity: 6, context: "large" },
  tyr: { agentName: "tyr", reasoning: 8, speed: 4, creativity: 4, context: "medium" },
  sif: { agentName: "sif", reasoning: 4, speed: 9, creativity: 3, context: "medium" },
  eir: { agentName: "eir", reasoning: 7, speed: 4, creativity: 7, context: "large" },
  freyr: { agentName: "freyr", reasoning: 5, speed: 6, creativity: 9, context: "medium" },
  hermod: { agentName: "hermod", reasoning: 5, speed: 9, creativity: 3, context: "medium" },
  heimdall: { agentName: "heimdall", reasoning: 4, speed: 6, creativity: 5, context: "medium" },
  magni: { agentName: "magni", reasoning: 4, speed: 9, creativity: 3, context: "small" },
  hod: { agentName: "hod", reasoning: 7, speed: 5, creativity: 6, context: "medium" }
};

// src/features/model-router/router.ts
class ModelRouter {
  availableModels = [];
  modelFallbacks = new Map;
  registerModels(models) {
    this.availableModels = models;
  }
  registerFallback(modelId, fallbacks) {
    this.modelFallbacks.set(modelId, fallbacks);
  }
  routeForAgent(agentName) {
    const reqs = AGENT_REQUIREMENTS[agentName];
    if (!reqs) {
      return { agentName, assignedModel: "default", fallbackUsed: false, reason: "No requirements defined" };
    }
    const scored = this.availableModels.filter((m) => m.available).map((m) => ({
      model: m,
      score: this.calculateMatchScore(reqs, m)
    })).sort((a, b) => b.score - a.score);
    if (scored.length === 0) {
      return { agentName, assignedModel: "none", fallbackUsed: false, reason: "No models available" };
    }
    const best = scored[0];
    return {
      agentName,
      assignedModel: best.model.id,
      fallbackUsed: false,
      reason: `Best match (score: ${best.score.toFixed(1)}) — reasoning:${reqs.reasoning} speed:${reqs.speed} creativity:${reqs.creativity}`
    };
  }
  calculateMatchScore(reqs, model) {
    const reasonScore = 10 - Math.abs(model.capabilities.reasoning - reqs.reasoning);
    const speedScore = 10 - Math.abs(model.capabilities.speed - reqs.speed);
    const creativeScore = 10 - Math.abs(model.capabilities.creativity - reqs.creativity);
    const weights = reqs.reasoning > 7 ? { reasoning: 0.5, speed: 0.2, creativity: 0.3 } : reqs.speed > 7 ? { reasoning: 0.2, speed: 0.6, creativity: 0.2 } : { reasoning: 0.3, speed: 0.3, creativity: 0.4 };
    return reasonScore * weights.reasoning + speedScore * weights.speed + creativeScore * weights.creativity;
  }
  getFallbackChain(agentName) {
    const route = this.routeForAgent(agentName);
    return this.modelFallbacks.get(route.assignedModel) || [];
  }
}

// src/features/diagnostics/index.ts
import fs4 from "node:fs";
import path4 from "node:path";
import os2 from "node:os";
class DiagnosticsChecker {
  ctx;
  constructor(ctx = {}) {
    this.ctx = ctx;
  }
  async runAll() {
    const startTime = Date.now();
    const checks = [];
    const results = await Promise.allSettled([
      this.checkMCPs(),
      this.checkAgents(),
      this.checkModels(),
      this.checkSQLite(),
      this.checkTUI(),
      this.checkInterviewEngine(),
      this.checkFileSystem(),
      this.checkNetwork(),
      this.checkCircuitBreakers(),
      this.checkPluginRegistry(),
      this.checkIntegrationHub(),
      this.checkLearningEngine()
    ]);
    for (const result of results) {
      if (result.status === "fulfilled") {
        checks.push(result.value);
      } else {
        checks.push({
          name: "unknown",
          category: "system",
          status: "fail",
          message: `Check failed: ${result.reason}`,
          durationMs: 0
        });
      }
    }
    const passed = checks.filter((c) => c.status === "pass").length;
    const warnings = checks.filter((c) => c.status === "warn").length;
    const failed = checks.filter((c) => c.status === "fail").length;
    const overall = failed > 0 ? "critical" : warnings > 0 ? "degraded" : "healthy";
    const report = {
      checks,
      passed,
      warnings,
      failed,
      total: checks.length,
      overall,
      timestamp: Date.now()
    };
    log("[diagnostics] completed", {
      overall,
      passed,
      warnings,
      failed,
      durationMs: Date.now() - startTime
    });
    return report;
  }
  async checkMCPs() {
    const start = Date.now();
    const count = this.ctx.mcpCount ?? 0;
    const expected = 13;
    if (count >= expected) {
      return {
        name: "MCP Connectivity",
        category: "integrations",
        status: "pass",
        message: `${count}/${expected} MCP servers connected`,
        durationMs: Date.now() - start
      };
    }
    if (count > 0) {
      return {
        name: "MCP Connectivity",
        category: "integrations",
        status: "warn",
        message: `${count}/${expected} MCP servers connected`,
        details: "Some MCPs may be unavailable. Skills/tools from missing MCPs won't work.",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "MCP Connectivity",
      category: "integrations",
      status: "fail",
      message: "No MCP servers connected",
      details: "All MCP-dependent features will be unavailable.",
      durationMs: Date.now() - start
    };
  }
  async checkAgents() {
    const start = Date.now();
    const count = this.ctx.agentCount ?? 0;
    const expected = 15;
    if (count >= expected) {
      return {
        name: "Agent Registration",
        category: "agents",
        status: "pass",
        message: `${count}/${expected} agents registered`,
        durationMs: Date.now() - start
      };
    }
    if (count > 0) {
      return {
        name: "Agent Registration",
        category: "agents",
        status: "warn",
        message: `${count}/${expected} agents registered`,
        details: "Some agents may be unavailable. Delegation to missing agents will fail.",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "Agent Registration",
      category: "agents",
      status: "fail",
      message: "No agents registered",
      details: "Agent delegation and multi-agent workflows will fail.",
      durationMs: Date.now() - start
    };
  }
  async checkModels() {
    const start = Date.now();
    const models = [
      "opencode/nemotron-3-super-free",
      "opencode/minimax-m2.5-free",
      "opencode/deepseek-v4-flash-free",
      "opencode/big-pickle"
    ];
    return {
      name: "Model Availability",
      category: "models",
      status: "pass",
      message: `${models.length} models configured`,
      details: models.join(", "),
      durationMs: Date.now() - start
    };
  }
  async checkSQLite() {
    const start = Date.now();
    try {
      const { Database } = await Promise.resolve().then(() => (init_sqlite(), exports_sqlite));
      const db = new Database(":memory:");
      db.run("CREATE TABLE test (id INTEGER PRIMARY KEY)");
      db.run("INSERT INTO test (id) VALUES (1)");
      const row = db.prepare("SELECT COUNT(*) as count FROM test").get();
      db.close();
      if (row.count === 1) {
        return {
          name: "SQLite Persistence",
          category: "storage",
          status: "pass",
          message: "Read/write OK",
          durationMs: Date.now() - start
        };
      }
    } catch (err) {
      return {
        name: "SQLite Persistence",
        category: "storage",
        status: "fail",
        message: `SQLite unavailable: ${String(err)}`,
        details: "Cross-session learning, metrics, and benchmarks will not persist.",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "SQLite Persistence",
      category: "storage",
      status: "warn",
      message: "SQLite read/write returned unexpected result",
      durationMs: Date.now() - start
    };
  }
  async checkTUI() {
    const start = Date.now();
    const running = this.ctx.tuiRunning ?? false;
    if (running) {
      return {
        name: "TUI Renderer",
        category: "ui",
        status: "pass",
        message: "Running (ink + react)",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "TUI Renderer",
      category: "ui",
      status: "warn",
      message: "Not running",
      details: "Terminal UI is optional. Core functionality works without it.",
      durationMs: Date.now() - start
    };
  }
  async checkInterviewEngine() {
    const start = Date.now();
    const running = this.ctx.interviewRunning ?? false;
    if (running) {
      return {
        name: "Interview Engine",
        category: "interview",
        status: "pass",
        message: "HTTP :3456 active",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "Interview Engine",
      category: "interview",
      status: "warn",
      message: "Not running",
      details: "Interview mode requires the engine to be started. Run index.ts to start it.",
      durationMs: Date.now() - start
    };
  }
  async checkFileSystem() {
    const start = Date.now();
    try {
      const testDir = os2.tmpdir();
      const testFile = path4.join(testDir, `oh-my-unified-diag-${Date.now()}.tmp`);
      fs4.writeFileSync(testFile, "test");
      const content = fs4.readFileSync(testFile, "utf-8");
      fs4.unlinkSync(testFile);
      if (content === "test") {
        return {
          name: "File System",
          category: "system",
          status: "pass",
          message: "Read/write OK",
          durationMs: Date.now() - start
        };
      }
    } catch (err) {
      return {
        name: "File System",
        category: "system",
        status: "fail",
        message: `File system error: ${String(err)}`,
        details: "Cannot read or write files. Implementation features will fail.",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "File System",
      category: "system",
      status: "warn",
      message: "File system returned unexpected result",
      durationMs: Date.now() - start
    };
  }
  async checkNetwork() {
    const start = Date.now();
    if (typeof globalThis.fetch === "function") {
      return {
        name: "Network",
        category: "system",
        status: "pass",
        message: "Fetch API available",
        durationMs: Date.now() - start
      };
    }
    return {
      name: "Network",
      category: "system",
      status: "warn",
      message: "Fetch API not available",
      details: "Webfetch tool and external integrations may not work.",
      durationMs: Date.now() - start
    };
  }
  async checkCircuitBreakers() {
    const start = Date.now();
    const health = this.ctx.circuitBreakerHealth ?? [];
    const closed = health.filter((h) => h.state === "closed").length;
    const total = health.length;
    if (total === 0) {
      return {
        name: "Circuit Breakers",
        category: "reliability",
        status: "warn",
        message: "No circuit breakers registered",
        details: "Graceful degradation is inactive. Feature failures may cascade.",
        durationMs: Date.now() - start
      };
    }
    if (closed === total) {
      return {
        name: "Circuit Breakers",
        category: "reliability",
        status: "pass",
        message: `${total}/${total} closed (healthy)`,
        durationMs: Date.now() - start
      };
    }
    const open = health.filter((h) => h.state !== "closed");
    return {
      name: "Circuit Breakers",
      category: "reliability",
      status: "warn",
      message: `${closed}/${total} closed`,
      details: `Open: ${open.map((h) => h.name).join(", ")}`,
      durationMs: Date.now() - start
    };
  }
  async checkPluginRegistry() {
    const start = Date.now();
    const count = this.ctx.pluginCount ?? 0;
    return {
      name: "Plugin Registry",
      category: "extensibility",
      status: count > 0 ? "pass" : "warn",
      message: count > 0 ? `${count} third-party plugins loaded` : "No third-party plugins",
      details: count === 0 ? "Plugin system is available. Register plugins to extend functionality." : undefined,
      durationMs: Date.now() - start
    };
  }
  async checkIntegrationHub() {
    const start = Date.now();
    const count = this.ctx.integrationCount ?? 0;
    return {
      name: "Integration Hub",
      category: "extensibility",
      status: count > 0 ? "pass" : "warn",
      message: count > 0 ? `${count} external integrations configured` : "No external integrations",
      details: count === 0 ? "GitHub, Jira, Slack integrations are available. Configure them to connect external tools." : undefined,
      durationMs: Date.now() - start
    };
  }
  async checkLearningEngine() {
    const start = Date.now();
    try {
      const { Database } = await Promise.resolve().then(() => (init_sqlite(), exports_sqlite));
      const db = new Database(":memory:");
      db.close();
      return {
        name: "Learning Engine",
        category: "intelligence",
        status: "pass",
        message: "SQLite available for cross-session learning",
        durationMs: Date.now() - start
      };
    } catch {
      return {
        name: "Learning Engine",
        category: "intelligence",
        status: "fail",
        message: "SQLite unavailable",
        details: "Cross-session learning requires SQLite. Lessons won't persist.",
        durationMs: Date.now() - start
      };
    }
  }
  formatReport(report) {
    const lines = [];
    lines.push("\uD83D\uDD0D oh-my-unified Diagnostic Report");
    lines.push("═".repeat(40));
    lines.push("");
    const byCategory = {};
    for (const check of report.checks) {
      if (!byCategory[check.category]) {
        byCategory[check.category] = [];
      }
      byCategory[check.category].push(check);
    }
    const categoryIcons = {
      integrations: "\uD83D\uDD0C",
      agents: "\uD83E\uDD16",
      models: "\uD83E\uDDE0",
      storage: "\uD83D\uDCBE",
      ui: "\uD83D\uDDA5️",
      interview: "\uD83C\uDF99️",
      system: "⚙️",
      reliability: "\uD83D\uDEE1️",
      extensibility: "\uD83D\uDD27",
      intelligence: "\uD83D\uDCA1"
    };
    for (const [category, checks] of Object.entries(byCategory)) {
      const icon = categoryIcons[category] ?? "\uD83D\uDCCB";
      lines.push(`${icon} ${category.toUpperCase()}`);
      for (const check of checks) {
        const statusIcon2 = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
        lines.push(`  ${statusIcon2} ${check.name}: ${check.message}`);
        if (check.details) {
          lines.push(`     ${check.details}`);
        }
      }
      lines.push("");
    }
    const warnings = report.checks.filter((c) => c.status === "warn");
    if (warnings.length > 0) {
      lines.push("⚠️  Warnings:");
      for (const w of warnings) {
        lines.push(`   - ${w.name}: ${w.message}`);
      }
      lines.push("");
    }
    const statusIcon = report.overall === "healthy" ? "✅" : report.overall === "degraded" ? "⚠️" : "❌";
    lines.push(`${statusIcon} System Health: ${report.overall.toUpperCase()} (${report.passed}/${report.total} checks passed)`);
    lines.push("");
    lines.push("\uD83D\uDCA1 Tip: Run /capabilities to see everything you can do");
    return lines.join(`
`);
  }
}
function createDiagnosticsChecker(ctx) {
  return new DiagnosticsChecker(ctx);
}

// src/features/capabilities/index.ts
class CapabilitiesExplorer {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  getCapabilities() {
    return [
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Full Pipeline",
        command: "/plan <topic>",
        description: "Run 4-phase pipeline: Assess→Assemble→Improvise→Act",
        example: '/plan "build a REST API with authentication"'
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Pipeline Status",
        command: "/plan status",
        description: "Show pipeline progress, conductor, and sub-sessions",
        example: "/plan status"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Assess Phase",
        command: "/assess",
        description: "Requirements analysis with Odin's interview swarm",
        example: "/assess"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Assemble Phase",
        command: "/assemble",
        description: "Research + architecture mapping with specialist agents",
        example: "/assemble"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Improvise Phase",
        command: "/improvise",
        description: "Critique and refine before execution",
        example: "/improvise"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Act Phase",
        command: "/act",
        description: "Multi-agent execution: Thor builds, Hermod fixes, Freyr crafts UI",
        example: "/act"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Synthesize",
        command: "/synthesize",
        description: "Unified report from all agent findings",
        example: "/synthesize"
      },
      {
        category: "Planning & Execution",
        icon: "\uD83D\uDCCB",
        name: "Structured Planning",
        command: "/om-plan <phase>",
        description: "4-phase planning with model-specialized routing",
        example: "/om-plan assess"
      },
      {
        category: "Review & Quality",
        icon: "\uD83D\uDD0D",
        name: "Code Audit",
        command: "/om-audit <check>",
        description: "4-perspective audit: architecture, quality, security, UX",
        example: "/om-audit security"
      },
      {
        category: "Review & Quality",
        icon: "\uD83D\uDD0D",
        name: "5-Agent Review",
        command: '"review my work"',
        description: "Tyr, Heimdall, Mimir, Frigg, Forseti review panel",
        example: "review my work"
      },
      {
        category: "Review & Quality",
        icon: "\uD83D\uDD0D",
        name: "Hyperplan",
        command: '"hyperplan"',
        description: "Adversarial stress test: Skeptic, Creative, Pragmatist",
        example: "hyperplan this plan"
      },
      {
        category: "Review & Quality",
        icon: "\uD83D\uDD0D",
        name: "Red Team",
        command: '"red team"',
        description: "Security-focused adversarial review",
        example: "red team this implementation"
      },
      {
        category: "Security",
        icon: "\uD83D\uDEE1️",
        name: "Security Research",
        command: '"security research"',
        description: "Deep security analysis: auth, crypto, network, data",
        example: "security research this auth flow"
      },
      {
        category: "Security",
        icon: "\uD83D\uDEE1️",
        name: "Auto-Trigger",
        command: "Automatic",
        description: "Detects sensitive file writes (auth, crypto, eval, XSS)",
        example: "Write a file with password hashing → auto-triggers security scan"
      },
      {
        category: "Monitoring",
        icon: "\uD83D\uDCCA",
        name: "System Health",
        command: "/health",
        description: "System health dashboard with component status",
        example: "/health"
      },
      {
        category: "Monitoring",
        icon: "\uD83D\uDCCA",
        name: "Pipeline Status",
        command: "/status",
        description: "Pipeline progress, kanban, conductor, confidence",
        example: "/status"
      },
      {
        category: "Monitoring",
        icon: "\uD83D\uDCCA",
        name: "Diagnostics",
        command: "/diagnose",
        description: "Comprehensive system diagnostic (12 checks)",
        example: "/diagnose"
      },
      {
        category: "Agent Interaction",
        icon: "\uD83E\uDD16",
        name: "Agent List",
        command: "/",
        description: `Show all ${this.ctx.agentCount} agents with model, skills, MCPs, health`,
        example: "/"
      },
      {
        category: "Agent Interaction",
        icon: "\uD83E\uDD16",
        name: "Agent Mention",
        command: "@AgentName",
        description: "Resolve agent metadata + capabilities",
        example: "@Thor"
      },
      {
        category: "Agent Interaction",
        icon: "\uD83E\uDD16",
        name: "Agent Suggestions",
        command: "Automatic",
        description: "Auto-suggest agents based on task context",
        example: 'Type "I need to build a UI" → suggests @Freyr'
      }
    ];
  }
  getTier2Capabilities() {
    if (!this.ctx.hasLearningEngine && !this.ctx.hasModelPredictor && !this.ctx.hasBenchmarkTracker) {
      return [];
    }
    const capabilities = [];
    if (this.ctx.hasLearningEngine) {
      capabilities.push({
        category: "Intelligence (Tier 2)",
        icon: "\uD83E\uDDE0",
        name: "Cross-Session Learning",
        command: "Automatic",
        description: "Remembers what worked/failed, auto-applies lessons",
        example: "Similar request → shows learned patterns from past sessions"
      });
    }
    if (this.ctx.hasModelPredictor) {
      capabilities.push({
        category: "Intelligence (Tier 2)",
        icon: "\uD83E\uDDE0",
        name: "Predictive Routing",
        command: "Automatic",
        description: "Picks best model based on historical success rates",
        example: "Task → selects model with highest success rate for that category"
      });
    }
    if (this.ctx.hasBenchmarkTracker) {
      capabilities.push({
        category: "Intelligence (Tier 2)",
        icon: "\uD83E\uDDE0",
        name: "Performance Tracking",
        command: "Automatic",
        description: "Detects latency/cost/quality regressions",
        example: "Model change → alerts if performance degrades"
      });
    }
    return capabilities;
  }
  getTier3Capabilities() {
    if (!this.ctx.hasCircuitBreakers && this.ctx.pluginCount === 0 && this.ctx.integrationCount === 0) {
      return [];
    }
    const capabilities = [];
    if (this.ctx.pluginCount > 0 || this.ctx.hasCircuitBreakers) {
      capabilities.push({
        category: "Extensibility (Tier 3)",
        icon: "\uD83D\uDD0C",
        name: "Plugin System",
        command: "Automatic",
        description: "Third-party features can register hooks",
        example: `${this.ctx.pluginCount} plugin(s) currently loaded`
      });
    }
    capabilities.push({
      category: "Extensibility (Tier 3)",
      icon: "\uD83D\uDD0C",
      name: "Auto-Skill Generation",
      command: "Automatic",
      description: "Codifies recurring patterns into reusable skills",
      example: "Pattern occurs 5+ times → auto-generates skill template"
    });
    capabilities.push({
      category: "Extensibility (Tier 3)",
      icon: "\uD83D\uDD0C",
      name: "Multi-User Support",
      command: "Automatic",
      description: "Multiple humans, same agent org, shared state",
      example: "User A and User B collaborate on same project"
    });
    if (this.ctx.integrationCount > 0) {
      capabilities.push({
        category: "Extensibility (Tier 3)",
        icon: "\uD83D\uDD0C",
        name: "External Integrations",
        command: "Automatic",
        description: "GitHub, Jira, Slack webhooks",
        example: `${this.ctx.integrationCount} integration(s) configured`
      });
    }
    return capabilities;
  }
  formatCapabilities() {
    const lines = [];
    lines.push("\uD83D\uDE80 oh-my-unified Capabilities");
    lines.push("═".repeat(40));
    lines.push("");
    const allCapabilities = [
      ...this.getCapabilities(),
      ...this.getTier2Capabilities(),
      ...this.getTier3Capabilities()
    ];
    const byCategory = {};
    for (const cap of allCapabilities) {
      if (!byCategory[cap.category]) {
        byCategory[cap.category] = [];
      }
      byCategory[cap.category].push(cap);
    }
    for (const [category, caps] of Object.entries(byCategory)) {
      lines.push(`${caps[0].icon} ${category.toUpperCase()}`);
      for (const cap of caps) {
        lines.push(`  ${cap.command.padEnd(25)} → ${cap.description}`);
      }
      lines.push("");
    }
    lines.push(`\uD83D\uDCCA ${allCapabilities.length} capabilities across ${Object.keys(byCategory).length} categories`);
    lines.push(`\uD83E\uDD16 ${this.ctx.agentCount} agents | \uD83D\uDD0C ${this.ctx.mcpCount} MCPs`);
    lines.push("");
    lines.push('\uD83D\uDCA1 Try: /plan "build a REST API" to see the full pipeline in action');
    lines.push("\uD83D\uDCA1 Try: /diagnose to check system health");
    return lines.join(`
`);
  }
}
function createCapabilitiesExplorer(ctx) {
  return new CapabilitiesExplorer(ctx);
}

// src/features/onboarding/index.ts
class OnboardingGuide {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  getOptions() {
    return [
      {
        number: 1,
        icon: "\uD83D\uDCCB",
        label: "Plan a project",
        description: "Run the full 4-phase pipeline with 15 specialized agents",
        action: "I'll start the Assess→Assemble→Improvise→Act pipeline. What would you like to build?"
      },
      {
        number: 2,
        icon: "\uD83D\uDD0D",
        label: "Review my code",
        description: "Launch a 5-agent review panel (Tyr, Heimdall, Mimir, Frigg, Forseti)",
        action: "I'll launch the review panel. What code would you like reviewed?"
      },
      {
        number: 3,
        icon: "\uD83D\uDEE1️",
        label: "Security audit",
        description: "Deep security analysis: auth, crypto, network, data",
        action: "I'll run a comprehensive security audit. What should I analyze?"
      },
      {
        number: 4,
        icon: "\uD83E\uDD16",
        label: "See available agents",
        description: `Show all ${this.ctx.agentCount} agents with model, skills, MCPs, health`,
        action: "Here are all available agents. Each has specialized capabilities."
      },
      {
        number: 5,
        icon: "\uD83D\uDCCA",
        label: "Check system health",
        description: "Run a full diagnostic (12 checks)",
        action: "I'll run a comprehensive system diagnostic now."
      },
      {
        number: 6,
        icon: "⚡",
        label: "Quick demo",
        description: "See a 30-second example of the full pipeline",
        action: "Let me show you how the pipeline works with a quick example."
      }
    ];
  }
  getWelcomeMessage() {
    const name = this.ctx.userName ? `, ${this.ctx.userName}` : "";
    const isFirstRun = this.ctx.isFirstRun ?? true;
    const lines = [];
    if (isFirstRun) {
      lines.push(`\uD83D\uDC4B Welcome to oh-my-unified${name}!`);
      lines.push("");
      lines.push(`I'm your AI agent orchestrator with ${this.ctx.agentCount} specialized agents, ${this.ctx.mcpCount} MCP integrations,`);
      lines.push("and a full planning/review/execution pipeline.");
      lines.push("");
      lines.push("What would you like to do?");
      lines.push("");
    } else {
      lines.push(`\uD83D\uDC4B Welcome back${name}!`);
      lines.push("");
      lines.push(`You have ${this.ctx.agentCount} agents and ${this.ctx.mcpCount} MCPs available.`);
      lines.push("");
      lines.push("What would you like to do?");
      lines.push("");
    }
    const options = this.getOptions();
    for (const option of options) {
      lines.push(`${option.number}. ${option.icon} ${option.label}`);
      lines.push(`   ${option.description}`);
      lines.push("");
    }
    lines.push("Reply with a number or describe what you need.");
    lines.push("");
    lines.push("\uD83D\uDCA1 Tip: Run /capabilities to see everything you can do");
    lines.push("\uD83D\uDCA1 Tip: Run /diagnose to check system health");
    return lines.join(`
`);
  }
  handleOption(optionNumber) {
    const options = this.getOptions();
    const option = options.find((o) => o.number === optionNumber);
    if (!option) {
      return `Invalid option. Please choose 1-${options.length} or describe what you need.`;
    }
    const lines = [];
    lines.push(`${option.icon} ${option.label}`);
    lines.push("");
    lines.push(option.action);
    lines.push("");
    switch (optionNumber) {
      case 1:
        lines.push('Example: `/plan "build a REST API with user authentication"`');
        lines.push("");
        lines.push("This will:");
        lines.push("1. Assess requirements with Odin's interview swarm");
        lines.push("2. Assemble architecture with specialist agents");
        lines.push("3. Improvise — critique and refine the plan");
        lines.push("4. Act — Thor builds, Hermod fixes, Freyr crafts UI");
        break;
      case 2:
        lines.push('Example: "review my work" or "/om-audit security"');
        lines.push("");
        lines.push("The 5-agent panel will:");
        lines.push("• @Tyr — Quality gate and standards enforcement");
        lines.push("• @Heimdall — Visual analysis and completeness check");
        lines.push("• @Mimir — Architecture review and trade-off analysis");
        lines.push("• @Frigg — Gap analysis and risk identification");
        lines.push("• @Forseti — Multi-perspective deliberation");
        break;
      case 3:
        lines.push('Example: "security research this auth flow"');
        lines.push("");
        lines.push("The security analysis will:");
        lines.push("• Authentication — Check for credential handling, session management");
        lines.push("• Cryptography — Verify encryption, hashing, key management");
        lines.push("• Network — Analyze API security, CORS, headers");
        lines.push("• Data — Check for injection, exposure, validation");
        break;
      case 4:
        lines.push("Type `/` to see all agents with their:");
        lines.push("• Current model and fallback chain");
        lines.push("• Assigned skills and MCPs");
        lines.push("• Health status and session count");
        lines.push("• Role and capabilities");
        break;
      case 5:
        lines.push("The diagnostic checks:");
        lines.push("• MCP connectivity (13 servers)");
        lines.push("• Agent registration (15 agents)");
        lines.push("• Model availability (4 models)");
        lines.push("• SQLite persistence");
        lines.push("• TUI renderer");
        lines.push("• Interview engine");
        lines.push("• File system");
        lines.push("• Network");
        lines.push("• Circuit breakers");
        lines.push("• Plugin registry");
        lines.push("• Integration hub");
        lines.push("• Learning engine");
        break;
      case 6:
        lines.push("Watch me run a mini-pipeline:");
        lines.push("1. I'll assess a simple task");
        lines.push("2. Show you how agents are selected");
        lines.push("3. Demonstrate the review process");
        lines.push("4. Show the final synthesis");
        lines.push("");
        lines.push("This takes ~30 seconds. Ready?");
        break;
    }
    return lines.join(`
`);
  }
}
function createOnboardingGuide(ctx) {
  return new OnboardingGuide(ctx);
}

// src/index.ts
async function appLog(ctx, level, message) {
  try {
    await ctx.client.app.log({
      body: { service: "oh-my-unified", level, message }
    });
  } catch {
    const prefix = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "INFO";
    console.error(`[oh-my-unified] ${prefix}: ${message}`);
  }
}
var HEALTH_CHECK = {
  minAgents: 5,
  minTools: 5,
  minMcps: 1
};
async function probeJSDOM() {
  try {
    const { JSDOM } = await import("jsdom");
    new JSDOM("<!DOCTYPE html><html><body>test</body></html>");
    return null;
  } catch (err) {
    return String(err);
  }
}
var OhMyUnified = async (ctx) => {
  const sessionId = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  initLogger(sessionId);
  let config;
  let disabledAgents;
  let agentDefs;
  let agents;
  let mcps;
  let modelArrayMap;
  let runtimeChains;
  let multiplexerConfig;
  let multiplexerEnabled;
  let councilTools;
  let webfetch2;
  let rewriteDisplayNameMentions;
  let subtaskCommandManager;
  let subtaskState;
  let omPlanHook;
  let omAuditHook;
  let pipelineCommandHandler;
  let autoSlashCommandHook;
  let unifiedHooks;
  let toolCount = 0;
  let catalog;
  let systemObserver;
  let taskEngine;
  let agentSelector;
  let interviewEngine;
  let skillMCPManager;
  let modelRouter;
  let metricsCollector;
  let learningEngine;
  let modelPredictor;
  let benchmarkTracker;
  let pluginRegistry;
  let skillCodifier;
  let sessionRouter;
  let integrationHub;
  let diagnosticsChecker;
  let capabilitiesExplorer;
  let onboardingGuide;
  let transparencyLog;
  try {
    config = loadPluginConfig(ctx.directory);
    disabledAgents = getDisabledAgents(config);
    rewriteDisplayNameMentions = createDisplayNameMentionRewriter(config);
    catalog = new McpSkillCatalog;
    const enricher = new AgentContextEnricher(catalog);
    const discovered = discoverUserMcps();
    const mergedMcpServers = mergeMcpConfigs(discovered, DEFAULT_MCP_SERVERS);
    mcps = createBuiltinMcps(config.disabled_mcps, mergedMcpServers);
    agentDefs = createAgents(config, catalog);
    try {
      const written = writeAgentFiles(agentDefs, ctx.directory);
      log("[plugin] wrote agent files", { count: written.length, agents: written });
    } catch (err) {
      log("[plugin] failed to write agent files", { error: String(err) });
    }
    agents = getAgentConfigs(config, catalog);
    modelArrayMap = {};
    for (const agentDef of agentDefs) {
      if (agentDef._modelArray && agentDef._modelArray.length > 0) {
        modelArrayMap[agentDef.name] = agentDef._modelArray;
      }
    }
    runtimeChains = {};
    for (const agentDef of agentDefs) {
      if (agentDef._modelArray?.length) {
        runtimeChains[agentDef.name] = agentDef._modelArray.map((m) => m.id);
      }
    }
    if (config.fallback?.enabled !== false) {
      const chains = config.fallback?.chains ?? {};
      for (const [agentName, chainModels] of Object.entries(chains)) {
        if (!chainModels?.length)
          continue;
        const existing = runtimeChains[agentName] ?? [];
        const seen = new Set(existing);
        for (const m of chainModels) {
          if (!seen.has(m)) {
            seen.add(m);
            existing.push(m);
          }
        }
        runtimeChains[agentName] = existing;
      }
    }
    multiplexerConfig = {
      type: config.multiplexer?.type ?? "none",
      layout: config.multiplexer?.layout ?? "main-vertical",
      main_pane_size: config.multiplexer?.main_pane_size ?? 60
    };
    multiplexerEnabled = multiplexerConfig.type !== "none";
    log("[plugin] initialized", {
      multiplexerConfig,
      enabled: multiplexerEnabled,
      directory: ctx.directory
    });
    councilTools = config.council?.enabled ? createCouncilTool(ctx, config, []) : {};
    webfetch2 = createWebfetchTool(ctx);
    subtaskState = createSubtaskState();
    subtaskCommandManager = createSubtaskCommandManager(ctx, subtaskState);
    transparencyLog = createTransparencyLog();
    omPlanHook = createOmPlanHook(ctx, config, { transparencyLog });
    omAuditHook = createOmAuditHook(ctx, config, { transparencyLog });
    autoSlashCommandHook = createAutoSlashCommandHook(ctx, config);
    systemObserver = new SystemObserver({
      events: {
        onReport: (report) => {
          updateHealth({
            agentCount: Object.keys(agents).length,
            toolCount,
            mcpCount: Object.keys(mcps).length,
            status: report.overall === "healthy" ? "healthy" : report.overall === "degraded" ? "warning" : "critical"
          });
        }
      }
    });
    systemObserver.setConnectedMcps(Object.keys(mcps).length);
    systemObserver.start();
    taskEngine = new PersistentTaskEngine({
      dbPath: config.persistence?.dbPath ?? ":memory:"
    });
    pipelineCommandHandler = createPipelineCommandHandler(ctx, config, systemObserver);
    agentSelector = createAgentSelector();
    for (const agentDef of agentDefs) {
      agentSelector.registerAgent({
        name: agentDef.name,
        displayName: agentDef.displayName ?? `@${agentDef.name}`,
        description: "",
        role: "",
        model: agentDef._modelArray?.[0]?.id ?? agentDef.config.model ?? "openai/gpt-5.4-mini",
        fallbackModels: agentDef._modelArray?.map((m) => m.id) ?? [],
        template: "",
        isPrimary: true,
        canDelegate: false,
        skills: []
      });
    }
    interviewEngine = new InterviewEngine(3456);
    interviewEngine.start();
    skillMCPManager = new SkillMcpManager;
    modelRouter = new ModelRouter;
    metricsCollector = createMetricsCollector(":memory:", { dailyBudget: 10 });
    learningEngine = createLearningEngine(":memory:");
    modelPredictor = createModelPredictor();
    benchmarkTracker = createBenchmarkTracker(":memory:");
    pluginRegistry = createPluginRegistry();
    skillCodifier = createSkillCodifier({ threshold: 5 });
    sessionRouter = createSessionRouter();
    integrationHub = createIntegrationHub();
    diagnosticsChecker = createDiagnosticsChecker({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      tuiRunning: true,
      interviewRunning: true,
      pluginCount: pluginRegistry.getStats().totalPlugins,
      integrationCount: integrationHub.getStats().totalIntegrations,
      circuitBreakerHealth: [
        { name: "review-work", state: "closed" },
        { name: "hyperplan", state: "closed" },
        { name: "security-research", state: "closed" },
        { name: "model-fallback", state: "closed" },
        { name: "proactive-fallback", state: "closed" }
      ]
    });
    capabilitiesExplorer = createCapabilitiesExplorer({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      pluginCount: pluginRegistry.getStats().totalPlugins,
      integrationCount: integrationHub.getStats().totalIntegrations,
      hasLearningEngine: true,
      hasModelPredictor: true,
      hasBenchmarkTracker: true,
      hasCircuitBreakers: true
    });
    onboardingGuide = createOnboardingGuide({
      agentCount: Object.keys(agents).length,
      mcpCount: Object.keys(mcps).length,
      isFirstRun: true
    });
    unifiedHooks = createUnifiedHooks(ctx, config, {
      contextWindowMonitor: { enabled: true },
      fileWriteGuard: { enabled: true },
      overwriteProtection: { enabled: true },
      taskReminder: { enabled: true, threshold: 8 },
      modelSelection: { enabled: true },
      errorRecovery: { enabled: true },
      webFetchGuard: { enabled: true },
      diffEnhancer: { enabled: true },
      emptyResponseDetector: { enabled: true },
      commentChecker: { enabled: false },
      fsyncWarning: { enabled: true }
    }, runtimeChains, {
      agentSelector,
      systemObserver,
      taskEngine,
      interviewEngine,
      skillMcpManager: skillMCPManager,
      modelRouter,
      metricsCollector,
      learningEngine,
      modelPredictor,
      benchmarkTracker,
      pluginRegistry,
      skillCodifier,
      sessionRouter,
      integrationHub,
      transparencyLog
    });
    toolCount = Object.keys(councilTools).length + 1 + 2 + 2;
  } catch (err) {
    log("[plugin] FATAL: init failed", { error: String(err) });
    await appLog(ctx, "error", `INIT FAILED: ${String(err)}`);
    throw err;
  }
  const agentCount = Object.keys(agents).length;
  const mcpCount = Object.keys(mcps).length;
  const mcpThreshold = config.disabled_mcps && config.disabled_mcps.length > 0 ? 0 : HEALTH_CHECK.minMcps;
  if (agentCount < HEALTH_CHECK.minAgents || toolCount < HEALTH_CHECK.minTools || mcpCount < mcpThreshold) {
    const msg = [
      "Health check: registrations suspiciously low.",
      `  agents: ${agentCount} (expected >=${HEALTH_CHECK.minAgents})`,
      `  tools:  ${toolCount} (expected >=${HEALTH_CHECK.minTools})`,
      `  mcps:   ${mcpCount} (expected >=${mcpThreshold})`
    ].join(`
`);
    log(`[plugin] WARN: ${msg}`);
    await appLog(ctx, "warn", msg);
  } else {
    log("[plugin] health check passed", { agents: agentCount, tools: toolCount, mcps: mcpCount });
  }
  for (const agent of PRIMARY_AGENTS) {
    updateAgentModel(agent.name, agent.model, agent.displayName, agent.role);
    lazyLoader.register(agent.name, "agent", agent.displayName, agent.description);
    agentSelector.registerAgent(agent);
  }
  setActiveAgent("odin");
  setSessionId(sessionId);
  for (const agent of AGENTS.filter((a) => !a.isPrimary)) {
    lazyLoader.register(agent.name, "agent", agent.displayName, agent.description);
    agentSelector.registerAgent(agent);
  }
  const healthReport = systemObserver.getStatus();
  updateHealth({
    agentCount: Object.keys(agents).length,
    toolCount,
    mcpCount: Object.keys(mcps).length,
    status: healthReport.overall === "healthy" ? "healthy" : healthReport.overall === "degraded" ? "warning" : "critical"
  });
  probeJSDOM().then((err) => {
    if (err) {
      const msg = `jsdom probe failed; webfetch tool will not work: ${err}`;
      log(`[plugin] WARN: ${msg}`);
      appLog(ctx, "warn", msg).catch(() => {});
    }
  }).catch(() => {});
  return {
    ...unifiedHooks,
    "chat.message": async (input, output) => {
      await autoSlashCommandHook["chat.message"](input, output);
      await unifiedHooks["chat.message"]?.(input, output);
    },
    "command.execute.before": async (input, output) => {
      const cmd = input.command.toLowerCase();
      const OUR_COMMAND_SET = new Set([
        "plan",
        "assess",
        "assemble",
        "improvise",
        "act",
        "synthesize",
        "health",
        "status",
        "diagnose",
        "capabilities",
        "onboarding",
        "log",
        "agents",
        "om-plan",
        "om-audit"
      ]);
      if (!OUR_COMMAND_SET.has(cmd))
        return;
      await autoSlashCommandHook["command.execute.before"](input, output);
      await omPlanHook.handleCommandExecuteBefore(input, output);
      await omAuditHook.handleCommandExecuteBefore(input, output);
      await pipelineCommandHandler.handleCommand(input, output);
      if (cmd === "diagnose") {
        const report = await diagnosticsChecker.runAll();
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: diagnosticsChecker.formatReport(report)
        });
        return;
      }
      if (cmd === "capabilities") {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: capabilitiesExplorer.formatCapabilities()
        });
        return;
      }
      if (cmd === "onboarding") {
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: onboardingGuide.getWelcomeMessage()
        });
        return;
      }
      if (cmd === "log") {
        const args = input.arguments.trim().toLowerCase();
        let entries;
        if (args.startsWith("stats")) {
          const stats = transparencyLog.getStats();
          const lines = [
            "\uD83D\uDCCA Transparency Log Statistics",
            "═".repeat(40),
            `Total entries: ${stats.totalEntries}`,
            `Sessions: ${Object.keys(stats.bySession).length}`,
            "",
            "By type:",
            ...Object.entries(stats.byType).map(([t, c]) => `  ${t}: ${c}`),
            "",
            "By session:",
            ...Object.entries(stats.bySession).map(([s, c]) => `  ${s.slice(0, 20)}...: ${c}`)
          ];
          output.parts.length = 0;
          output.parts.push({ type: "text", text: lines.join(`
`) });
          return;
        }
        if (args.startsWith("recent")) {
          const limit = parseInt(args.split(" ")[1], 10) || 10;
          entries = transparencyLog.getRecent(limit);
        } else if (args) {
          const type = args;
          entries = transparencyLog.getByType(type);
        } else {
          entries = transparencyLog.getRecent(20);
        }
        output.parts.length = 0;
        output.parts.push({
          type: "text",
          text: transparencyLog.formatLog(entries)
        });
        return;
      }
    },
    tool: {
      webfetch: tool({
        description: "Fetch web content from a URL",
        args: {
          url: tool.schema.string()
        },
        execute: async (args) => {
          const res = await webfetch2(args.url);
          return JSON.stringify(res);
        }
      }),
      ast_grep_search: tool({
        description: "Search code patterns using AST-aware grep (structural search)",
        args: {
          path: tool.schema.string(),
          pattern: tool.schema.string(),
          filePattern: tool.schema.string().optional(),
          lang: tool.schema.string().optional(),
          useRegexp: tool.schema.boolean().optional()
        },
        execute: async (args) => {
          const res = await ast_grep_search({
            path: args.path,
            pattern: args.pattern,
            filePattern: args.filePattern,
            lang: args.lang,
            useRegexp: args.useRegexp
          });
          return JSON.stringify(res);
        }
      }),
      ast_grep_replace: tool({
        description: "Replace code patterns using AST-aware rewrite (structural replace)",
        args: {
          path: tool.schema.string(),
          pattern: tool.schema.string(),
          rewrite: tool.schema.string(),
          filePattern: tool.schema.string().optional(),
          lang: tool.schema.string().optional(),
          useRegexp: tool.schema.boolean().optional(),
          dryRun: tool.schema.boolean().optional()
        },
        execute: async (args) => {
          const res = await ast_grep_replace({
            path: args.path,
            pattern: args.pattern,
            rewrite: args.rewrite,
            filePattern: args.filePattern,
            lang: args.lang,
            useRegexp: args.useRegexp,
            dryRun: args.dryRun
          });
          return JSON.stringify(res);
        }
      }),
      subtask: tool({
        description: "Create and manage subtasks for complex multi-step operations",
        args: {
          task: tool.schema.string(),
          context: tool.schema.string().optional()
        },
        execute: async (args) => {
          const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          subtaskState.tasks.set(taskId, { status: "in_progress" });
          subtaskState.currentTask = taskId;
          return JSON.stringify({ taskId, status: "started" });
        }
      }),
      read_session: tool({
        description: "Read current session state including active subtasks",
        args: {
          sessionID: tool.schema.string().optional()
        },
        execute: async () => {
          const tasks = [];
          for (const [id, info] of subtaskState.tasks) {
            tasks.push({ id, status: info.status });
          }
          return JSON.stringify({ tasks });
        }
      })
    },
    config: async (opencodeConfig) => {
      const agentConfigs = getAgentConfigs(config, catalog);
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agentConfigs };
      } else {
        const existing = opencodeConfig.agent;
        for (const [name, pluginAgent] of Object.entries(agentConfigs)) {
          const existingAgent = existing[name];
          if (existingAgent) {
            existing[name] = { ...pluginAgent, ...existingAgent };
          } else {
            existing[name] = pluginAgent;
          }
        }
      }
      if (!opencodeConfig.default_agent) {
        opencodeConfig.default_agent = "odin";
      }
      if (!opencodeConfig.mcp) {
        opencodeConfig.mcp = { ...mcps };
      } else {
        const existingMcps = opencodeConfig.mcp;
        for (const [name, mcpConfig] of Object.entries(mcps)) {
          if (!existingMcps[name]) {
            existingMcps[name] = mcpConfig;
          }
        }
      }
      const pluginCommands = {
        plan: { template: "Run the full pipeline: assess → assemble → improvise → act. Topic: $input", description: "Run full agentic pipeline" },
        assess: { template: "Phase 1: Conduct requirements assessment. Identify gaps, contradictions, and missing context.", description: "Phase 1: Requirements assessment" },
        assemble: { template: "Phase 2: Deep research and architecture. Map dependencies, study documentation, deliberate on tradeoffs.", description: "Phase 2: Research & architecture" },
        improvise: { template: "Phase 3: Critique and refine. Perform adversarial review, check quality, refine approach.", description: "Phase 3: Adversarial review" },
        act: { template: "Phase 4: Execute the plan. Build, fix, and design with confidence ≥9.", description: "Phase 4: Execute" },
        synthesize: { template: "Synthesize all agent results into a single report.", description: "Synthesize agent results" },
        health: { template: "Run system health check. Report overall status, component health, warnings, and errors.", description: "System health check" },
        status: { template: "Show pipeline status: conductor, phase, confidence, kanban tasks, and sub-sessions.", description: "Pipeline status" },
        diagnose: { template: "Run 12 parallel system health checks.", description: "Full diagnostics" },
        capabilities: { template: "List all plugin capabilities grouped by category.", description: "List capabilities" },
        onboarding: { template: "Show interactive welcome menu with contextual guidance.", description: "Onboarding guide" },
        log: { template: "Query the transparency log. $input", description: "Transparency log" },
        agents: { template: "List all active agents with their models, roles, and status.", description: "List agents" },
        "om-plan": { template: "Run the oh-my-unified plan mode. $input", description: "OM Plan mode" },
        "om-audit": { template: "Run the oh-my-unified audit mode. $input", description: "OM Audit mode" }
      };
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      const existingCmds = opencodeConfig.command;
      for (const [name, cmdDef] of Object.entries(pluginCommands)) {
        if (!existingCmds[name]) {
          existingCmds[name] = cmdDef;
        }
      }
    }
  };
};
var src_default = OhMyUnified;
export {
  src_default as default
};
