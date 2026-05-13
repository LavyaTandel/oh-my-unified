# oh-my-unified

**Unified OpenCode Plugin combining oh-my-openagent + oh-my-opencode-slim**

The agent orchestration layer for OpenCode. PersistentTaskEngine fixes the "Task not found" bug. The MCP Integration Bus connects 14 servers. The Assessment-to-Assembly-to-Action workflow gives each phase its own model.

## Quick Start

```bash
bunx oh-my-unified@latest install
```

Then restart OpenCode and run `/start-work`.

## What Problem It Solves

OpenCode plugins lose tasks when the session compacts or restarts. Agents default to primitive tool use and skip the MCP ecosystem. This plugin makes agents reliable and keeps them from working blind.

- **"Task not found" bug** — gone. Every task lives in SQLite, not in-memory Maps. If the DB row is lost, the reconstructor pulls from session data.
- **MCP underutilization** — fixed. The MCP Integration Bus auto-registers 14 servers with health checks. The Tool Use Enforcer ensures agents actually use them.
- **Primitive-only agents** — solved. Agent context is enriched with available MCPs and skills before every invocation.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    oh-my-unified                          │
│                                                          │
│  ┌────────────────┐  ┌──────────────────┐               │
│  │  Agent Toolkit  │  │  MCP Integration │               │
│  │  (15 agents)    │  │  Bus (14 servers)│               │
│  └───────┬────────┘  └────────┬─────────┘               │
│          │                    │                          │
│  ┌───────┴────────────────────┴─────────┐               │
│  │      PersistentTaskEngine             │               │
│  │  ┌──────────┐ ┌──────────┐ ┌───────┐ │               │
│  │  │ SQLite   │ │Completion│ │Recon-  │ │               │
│  │  │Registry  │ │Detector  │ │structor│ │               │
│  │  └──────────┘ └──────────┘ └───────┘ │               │
│  └───────────────────────────────────────┘               │
│                                                          │
│  Assessment → Assembly → Action (3-phase workflow)       │
└──────────────────────────────────────────────────────────┘
```

### PersistentTaskEngine

The engine that fixes background task reliability once and for all.

- **SQLite TaskRegistry** — all task state persisted to disk. No in-memory Maps that vanish on compaction or restart.
- **Task Reconstruction** — if a DB row is lost, the reconstructor recovers from `session.read()` and `session.info()` data. Creates a new record so downstream operations never see a gap.
- **Dual-path Completion** — event-driven detection for normal paths, polling fallback for edge cases. Never drops `session.idle` events; always defers when too early.
- **Task Retention** — configurable cleanup (default 7 days). Old tasks auto-purge.

### MCP Integration Bus

Auto-registers and manages 14 MCP servers with health check polling:

| Server | Package |
|--------|---------|
| clawdi | `@opencode-ai/clawdi-mcp` |
| gbrain | `gbrain-mcp` |
| context-mode | `@opencode-ai/context-mode-mcp` |
| code-review-graph | `code-review-graph-mcp` |
| gitnexus | `gitnexus-mcp` |
| loom-mcp | `@opencode-ai/loom-mcp` |
| openspace | `@opencode-ai/openspace-mcp` |
| context7 | `@opencode-ai/context7-mcp` |
| exa | `@opencode-ai/exa-mcp` |
| gh_grep | `@opencode-ai/gh-grep-mcp` |
| deepwiki | `@opencode-ai/deepwiki-mcp` |
| sequential-thinking | `@opencode-ai/sequential-thinking-mcp` |
| agent-browser | `@opencode-ai/agent-browser-mcp` |

Health checks run every 30 seconds. Degraded servers are flagged; the bus keeps running.

### Agent Toolkit

The Pantheon: 15 specialized agents with model-routed dispatch.

| Agent | Model | Role |
|-------|-------|------|
| orchestrator | Ring 2.6 1T | Session orchestration, agent delegation |
| sisyphus | DeepSeek V4 Flash | Focused execution, direct task work |
| oracle | Nemotron 3 Super | Deep analysis, code review, validation |
| librarian | MiniMax M2.5 | Documentation search, codebase exploration |
| explorer | Big Pickle | Unsupervised codebase discovery |
| designer | MiniMax M2.5 | UI/UX design, frontend engineering |
| fixer | DeepSeek V4 Flash | Bug fixing, patch generation |
| observer | MiniMax M2.5 | Passive monitoring, session logging |
| council | Nemotron 3 Super | Multi-LLM deliberation, consensus |
| councillor | Nemotron 3 Super | Individual council participant |
| metis | — | Strategy, risk assessment |
| momus | — | Adversarial testing, edge case finding |
| atlas | — | System architecture, dependency mapping |
| hephaestus | — | Build systems, CI/CD |
| prometheus | — | Planning only (read-only .sisyphus/*.md) |

### Assessment → Assembly → Action Workflow

Three explicit phases, each routed to a different model:

1. **Assessment** (Ring 2.6 1T) — analyze requirements, constraints, risks
2. **Assembly** (MiniMax M2.5) — gather resources, structure approach, plan
3. **Action** (DeepSeek V4 Flash) — execute, verify, deliver

The fourth phase, Improvise, handles adaptation when conditions change mid-flight.

## Features

- ✅ **PersistentTaskEngine** — tasks survive compaction and restart via SQLite
- ✅ **Task Reconstruction** — if a DB row is lost, recovers from session data
- ✅ **Dual-path Completion** — event-driven + polling, never drops events
- ✅ **MCP Integration Bus** — 14 servers with health checks and auto-recovery
- ✅ **Tool Use Enforcer** — ensures agents use MCPs and gstack skills, not just primitives
- ✅ **Interview Engine** — web-based requirements gathering before tasks
- ✅ **Council System** — multi-LLM deliberation for high-stakes decisions
- ✅ **Team Mode** — parallel multi-agent coordination with task dependencies
- ✅ **OpenClaw Gateway** — Discord, Telegram, and HTTP integration
- ✅ **Divoom Display** — Pixoo-64 hardware status showing agent activity
- ✅ **`/om-plan` command** — 4-phase structured planning (assess, assemble, act, improvise)
- ✅ **`/om-audit` command** — multi-perspective code audit (architecture, quality, security, UX)
- ✅ **Model Multiplexing** — tmux/zellij integration for multi-terminal sessions
- ✅ **Plug-and-play Plugin** — register once, get 15 agents + 14 MCPs + full workflow

## Agent Roster (The Pantheon)

```
orchestrator  — Session orchestration, task delegation, routing
sisyphus      — Focused executor for direct task work
oracle        — Deep analysis, code review, validation, gap detection
librarian     — Documentation search, codebase exploration, context gathering
explorer      — Unsupervised codebase discovery and mapping
designer      — UI/UX design, frontend engineering, visual work
fixer         — Bug fixing, patch generation, hotfixes
observer      — Passive monitoring, session logging, audit trails
council       — Multi-LLM deliberation and consensus building
councillor    — Individual council participant (model-specific vote)
metis         — Strategy, risk assessment, trade-off analysis
momus         — Adversarial testing, edge case discovery
atlas         — System architecture, dependency mapping, module boundaries
hephaestus    — Build systems, CI/CD, deployment pipelines
prometheus    — Planning only, restricted to .sisyphus/*.md plan files
```

## Configuration

Config lives in `.opencode/oh-my-agents.json` or `.opencode/oh-my-agents.jsonc`.

### Persistence

```jsonc
{
  "persistence": {
    "dbPath": ".opencode/tasks.db",
    "taskRetentionDays": 7,
    "maxConcurrentTasks": 10,
    "defaultTimeoutMs": 300000,
    "healthCheckIntervalMs": 30000
  }
}
```

### MCP Bus

```jsonc
{
  "mcpBus": {
    "enabled": true,
    "servers": [
      { "name": "clawdi", "enabled": true },
      { "name": "gbrain", "enabled": true }
    ]
  }
}
```

### Agent Overrides

```jsonc
{
  "agents": {
    "orchestrator": {
      "model": "opencode/ring-2.6-1t-free",
      "variant": "max"
    },
    "oracle": {
      "model": "openai/gpt-5.5",
      "temperature": 0.3
    }
  },
  "preset": "loom"
}
```

### Workflow

```jsonc
{
  "workflow": {
    "assessmentModel": "opencode/ring-2.6-1t-free",
    "assemblyModel": "opencode/minimax-m2.5-free",
    "actionModel": "opencode/deepseek-v4-flash-free",
    "improviseModel": "opencode/nemotron-3-super-free"
  }
}
```

### Background

```jsonc
{
  "background": {
    "enabled": true,
    "reconstruction": true,
    "completionDetection": "dual"
  }
}
```

### OpenClaw Gateway

```jsonc
{
  "openclaw": {
    "enabled": true,
    "discord": { "token": "${DISCORD_TOKEN}" },
    "telegram": { "token": "${TELEGRAM_TOKEN}" },
    "http": { "port": 8080 }
  }
}
```

### Interview Engine

```jsonc
{
  "interview": {
    "maxQuestions": 2,
    "outputFolder": "interview",
    "autoOpenBrowser": true
  }
}
```

### Council

```jsonc
{
  "council": {
    "enabled": true,
    "strategy": "majority",
    "minParticipants": 3
  }
}
```

### Todo Continuation

```jsonc
{
  "todoContinuation": {
    "maxContinuations": 5,
    "cooldownMs": 3000,
    "autoEnable": false,
    "autoEnableThreshold": 4
  }
}
```

## License

MIT
