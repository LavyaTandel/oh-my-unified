<div align="center">

# ⚡ oh-my-unified

**The successor to oh-my-openagent + oh-my-opencode-slim. One plugin to rule them all.**

[![npm version](https://img.shields.io/npm/v/oh-my-unified?style=flat-square&logo=npm&color=cb3837&labelColor=1a1a2e)](https://www.npmjs.com/package/oh-my-unified)
[![License](https://img.shields.io/badge/license-MIT-00d2ff?style=flat-square&labelColor=1a1a2e)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-266%20passing-22c55e?style=flat-square&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)
[![Lines](https://img.shields.io/badge/lines-8.3k-6366f1?style=flat-square&labelColor=1a1a2e)](src/)
[![Build](https://img.shields.io/badge/build-160KB-f43f5e?style=flat-square&labelColor=1a1a2e)](dist/)
[![OpenCode](https://img.shields.io/badge/OpenCode-plugin-7c3aed?style=flat-square&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)
[![Maintained](https://img.shields.io/badge/maintained-yes-22c55e?style=flat-square&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)

**OpenCode Plugin** · Norse Pantheon Agents · Persistent Task Engine · MCP Bus · 3-Phase Workflow

</div>

---

## What is oh-my-unified?

oh-my-unified is an **agent orchestration layer for OpenCode** that merges the best of two legendary plugins into a single, cohesive system. It combines the persistent background task engine, extensive hook system, and agent toolkit from oh-my-openagent with the structured orchestrator pattern, interview engine, and council system from oh-my-opencode-slim.

The result: a **Norse Pantheon of 9 specialized agents** (with 9 additional alias agents for 18 total), a **SQLite-backed PersistentTaskEngine** that banishes the "Task not found" bug forever, a **14-server MCP Integration Bus** with health checks, and a **3-phase confidence-gated workflow** that routes each phase to the optimal model.

Instead of forcing one model to do everything, oh-my-unified routes each part of the job to the agent best suited for it, balancing **quality, speed, and cost**.

---

## The Problem It Solves

| Problem | How oh-my-unified Fixes It |
|---------|---------------------------|
| **"Task not found" bug** | Tasks live in SQLite, not in-memory Maps. If a DB row is lost, the reconstructor pulls from session data to auto-recover. |
| **MCP underutilization** | The MCP Integration Bus auto-registers 14 servers with health checks. The Tool Use Enforcer ensures agents actually use them. |
| **Primitive-only agents** | Agent context is enriched with available MCPs, skills, and project data before every invocation. No more blind agents. |
| **One model for everything** | 5-model routing with capability scoring matches each task type to the right model. Reasoning to Ring 2.6, speed to DeepSeek V4 Flash, docs to MiniMax M2.5. |
| **Session compaction kills context** | Compaction Context Injector preserves critical state across compact cycles. Directory Context Injector feeds AGENTS.md/README.md on every session start. |
| **Duplicate agent work** | Anti-duplication cache with 60s TTL prevents parallel agents from searching the same thing. In-flight requests are deduplicated. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        oh-my-unified                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Norse Pantheon Agents                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ @Odin     │ │ @Njord   │ │ @Mimir   │ │ @Vidar   │       │   │
│  │  │ Strategist│ │Executor  │ │Advisor   │ │Mapper    │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ @Thor    │ │@Forseti  │ │ @Frigg   │ │ @Tyr     │       │   │
│  │  │ Builder  │ │Council   │ │ Analyst  │ │ Critic   │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ @Sif     │ │ @Eir     │ │ @Freyr   │ │ @Hermod  │       │   │
│  │  │ Scout    │ │ Scholar  │ │ Artisan  │ │ Runner   │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │   │
│  │  │@Heimdall │ │ @Magni   │ │ @Hod     │                     │   │
│  │  │ Watcher  │ │Follower  │ │ Voter    │                     │   │
│  │  └──────────┘ └──────────┘ └──────────┘                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                PersistentTaskEngine (SQLite)                  │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │   │
│  │  │  TaskRegistry     │ │  Completion      │ │Reconstructor │ │   │
│  │  │  (SQLite-backed)  │ │  Detector        │ │(session.read)│ │   │
│  │  └──────────────────┘ └──────────────────┘ └──────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   MCP Integration Bus (14 servers)            │   │
│  │  clawdi · gbrain · context-mode · code-review-graph · gitnexus│   │
│  │  loom-mcp · openspace · context7 · exa · gh-grep · deepwiki  │   │
│  │  sequential-thinking · agent-browser · websearch              │   │
│  │  └─── Health checks every 30s ─── 3 tiers (built-in/project) │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Workflow Pipeline                            │   │
│  │  ┌───────┐   ┌──────────┐   ┌──────────┐   ┌───────┐       │   │
│  │  │/assess│ → │/assemble │ → │/improvise│ → │ /act  │       │   │
│  │  │ Conf≥6│   │  Conf≥8  │   │ User OK  │   │ Conf≥9│       │   │
│  │  └───────┘   └──────────┘   └──────────┘   └───────┘       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 25 Hooks │ │Role Enf. │ │Anti-Dup  │ │Lazy Load │ │Kanban    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │OpenClaw  │ │ Divoom   │ │Session   │ │TUI       │               │
│  │Gateway   │ │ Pixoo-64 │ │Mux (tmux)│ │Sidebar   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| ⚙️ **PersistentTaskEngine** | SQLite-backed task registry survives compaction and restart. Dual-path completion (event-driven + polling) never drops events. Auto-cleanup after configurable retention (default 7 days). |
| 🧠 **Norse Pantheon Agents** | 9 core agents + 9 aliases = 18 specialized personas. Each has a role, capability profile, and model assignment. Deploy via `@AgentName` mentions. |
| 🔌 **MCP Integration Bus** | Auto-discovers and registers 14 MCP servers with health checks every 30s. 3-tier system: built-in, project, and skill-embedded. Degraded servers are flagged; the bus keeps running. |
| 🚦 **3-Phase Workflow** | `/assess` (confidence ≥6) → `/assemble` (confidence ≥8) → `/improvise` (user satisfied) → `/act` (confidence ≥9). Each phase uses a different model and agent set. |
| 🧪 **Know Nothing Mode** | The plugin assumes ZERO context. It interviews, researches, and gathers information before acting. No silent assumptions. |
| 🛡️ **Role Enforcement** | Every agent has a permission matrix (read/edit/delegate/research). Violations are blocked at runtime. Builders can't override strategy; critics can't edit files. |
| 🔄 **Anti-Duplication** | In-flight cache deduplicates parallel agent work. Same query from 2 agents? First one runs, second gets cached result. Cache TTL: 60s. |
| 🎯 **Confidence Gates** | No phase transition without sufficient confidence. Rejected phases return to previous phase with feedback. Each knowledge area scored independently. |
| ⏳ **Lazy Loading** | All 15 components register at startup (strings only, zero token cost). They LOAD only when actually needed. Users can disable per session/project. |
| 🔭 **System Observer** | 7-component health monitor (Plugin, Registry, MCP Bus, Engine, Tool Enforcer, Divoom, OpenClaw). States: Healthy, Degraded, Critical. Report via `/status`. |
| 🧩 **25 Lifecycle Hooks** | 14 individual hooks + 11 synthesized hooks. Context injection, error recovery, model fallback, compaction preservation, auto-command detection. |
| 🗳️ **Council System** | Multi-LLM deliberation with configurable strategies (first, majority, supermajority). Forseti convenes the council; Hod casts votes. |
| 🖥️ **Session Multiplexer** | Tmux/Zellij session management for sub-agents. Configurable layout, main pane size, auto or manual type detection. |
| 🎛️ **TUI Sidebar** | OpenTUI sidebar shows specialist-agent status, active/reusable task sessions. Real-time visibility into sub-agent work. |
| 🏗️ **Hashline Edit** | MD5-based line hashing for stable, verifiable edits. Survives context shifts and model rotations. |
| 🗂️ **Kanban Tracker** | Sequential workflow with dependency ordering. Agents execute in defined order; blockers are surfaced automatically. |
| 🔧 **Configurable Presets** | 3 presets: `free` (exploration), `balanced` (daily work), `premium` (production). Override any agent's model, temperature, skills, or MCPs. |

---

## Meet the Norse Pantheon

### Core Agents

| Agent | Role | Capability Profile | Permissions | Delegation |
|-------|------|-------------------|-------------|------------|
| **@Odin** | Chief Strategist | Reasoning:9 Speed:5 Creative:7 | Read ✅ Edit ✅ Delegate ✅ Research ✅ | All sub-agents |
| **@Njord** | Orchestrator | Reasoning:8 Speed:6 Creative:6 | Read ✅ Edit ❌ Delegate ✅ Research ✅ | All sub-agents |
| **@Mimir** | Advisor / Oracle | Reasoning:10 Speed:4 Creative:5 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |
| **@Vidar** | Mapper / Codemap | Reasoning:8 Speed:5 Creative:4 | Read ✅ Edit ❌ Delegate ✅ Research ✅ | Sif, Eir |
| **@Thor** | Builder | Reasoning:6 Speed:8 Creative:5 | Read ✅ Edit ✅ Delegate ❌ Research ✅ | None |
| **@Forseti** | Deliberator / Council | Reasoning:8 Speed:3 Creative:8 | Read ✅ Edit ❌ Delegate ✅ (Hod only) Research ✅ | Hod |
| **@Frigg** | Analyst | Reasoning:9 Speed:4 Creative:6 | Read ✅ Edit ❌ Delegate ✅ Research ✅ | Sif, Eir |
| **@Tyr** | Critic / Reviewer | Reasoning:8 Speed:4 Creative:4 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |
| **@Sif** | Scout / Explorer | Reasoning:4 Speed:9 Creative:3 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |
| **@Eir** | Scholar / Librarian | Reasoning:5 Speed:7 Creative:4 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |
| **@Freyr** | Artisan / Designer | Reasoning:5 Speed:6 Creative:9 | Read ✅ Edit ✅ Delegate ✅ (Sif only) Research ✅ | Sif |
| **@Hermod** | Runner / Fixer | Reasoning:5 Speed:9 Creative:3 | Read ✅ Edit ✅ Delegate ❌ Research ❌ | None |
| **@Heimdall** | Watcher / Observer | Reasoning:4 Speed:6 Creative:5 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |
| **@Magni** | Follower | Reasoning:4 Speed:9 Creative:3 | Read ✅ Edit ✅ Delegate ❌ Research ❌ | None |
| **@Hod** | Voter / Councillor | Reasoning:7 Speed:5 Creative:6 | Read ✅ Edit ❌ Delegate ❌ Research ✅ | None |

### Alias Agents (Backward Compatible)

| Alias | Maps To | Original Source |
|-------|---------|-----------------|
| `@orchestrator` | Odin | oh-my-openagent core |
| `@sisyphus` | Hermod (runner) | oh-my-openagent executor |
| `@oracle` | Mimir (advisor) | oh-my-openagent analyst |
| `@librarian` | Eir (scholar) | oh-my-openagent researcher |
| `@explorer` / `@explore` | Sif (scout) | oh-my-openagent explorer |
| `@designer` | Freyr (artisan) | oh-my-openagent UI/UX |
| `@fixer` | Hermod (runner) | oh-my-openagent fixer |
| `@observer` | Heimdall (watcher) | oh-my-openagent monitor |
| `@council` | Forseti | slim council convener |
| `@councillor` | Hod | slim council voter |
| `@metis` | Mimir (strategy variant) | oh-my-openagent strategy |
| `@momus` | Tyr (adversarial variant) | oh-my-openagent critic |
| `@atlas` | Vidar (architect variant) | oh-my-openagent architect |
| `@hephaestus` | Thor (build variant) | oh-my-openagent builder |
| `@prometheus` | Odin (planning variant) | oh-my-openagent planner |

---

## Commands

### Workflow Commands

| Command | Description | Phase | Confidence Gate | Agents Deployed |
|---------|-------------|-------|-----------------|-----------------|
| `/assess` | Start requirements assessment | Assess | ≥6 | Odin + Frigg + Mimir |
| `/assemble` | Deep research, architecture mapping | Assemble | ≥8 | Vidar + Sif + Eir + Forseti |
| `/improvise` | Critique, review, refine approach | Improvise | User satisfied | Tyr + Heimdall + Mimir |
| `/act` | Execute the approved plan | Act | ≥9 | Njord + Thor + Hermod + Freyr |
| `/plan` | Full end-to-end workflow | All phases | Sequential gates | All agents sequentially |
| `/synthesize` | Deploy all agents, synthesize report | Synthesis | N/A | All agents → one report |

### Utility Commands

| Command | Description |
|---------|-------------|
| `/status` | Show system health (7-component monitor) |
| `/om-plan` | 4-phase structured planning (from oh-my-agents-synthesis) |
| `/om-audit` | Multi-perspective code audit |
| `/start-work` | Initialize session with Prometheus plan |

### Agent Mentions

Mention any agent mid-conversation with `@AgentName`:

```
@Odin analyze this project structure
@Sif search for authentication patterns
@Tyr review my approach
@Thor implement the fix
```

---

## Quick Start

### Prerequisites

- OpenCode (any version)
- Node.js ≥ 18 or Bun

### Install

```bash
bunx oh-my-unified@latest install
```

This registers oh-my-unified in your `opencode.json` plugins array, installs the TUI sidebar in `tui.json`, and warms the plugin cache.

### First Run

```bash
# Start your work session
/start-work

# Or manually start the workflow
/assess  # Phase 1: understand the project
```

### Configuration

Create `oh-my-unified.config.json` in your project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/lavyatandel/oh-my-unified/main/config.schema.json",
  "preset": "balanced",
  "agents": {
    "thor": { "model": "openai/gpt-5.4-mini" },
    "mimir": { "model": "openai/gpt-5.5", "variant": "max" }
  },
  "disabled_agents": ["heimdall"],
  "persistence": {
    "dbPath": ".oh-my-unified/tasks.db",
    "taskRetentionDays": 14
  },
  "mcpBus": {
    "enabled": true,
    "healthCheckIntervalMs": 60000
  }
}
```

---

## Configuration Reference

### Top-Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | `free` `balanced` `premium` | — | Model quality preset |
| `agents` | `Record<string, AgentOverride>` | `{}` | Per-agent overrides |
| `disabled_agents` | `string[]` | `[]` | Agents to disable |
| `disabled_mcps` | `string[]` | `[]` | MCPs to disable |
| `disabled_skills` | `string[]` | `[]` | Skills to disable |
| `disabled_hooks` | `string[]` | `[]` | Hooks to disable |
| `multiplexer` | object | `{type: "none"}` | Tmux/Zellij session config |
| `council` | object | `{enabled: false}` | Multi-LLM deliberation config |
| `interview` | object | `{maxQuestions: 2}` | Interview engine config |
| `persistence` | object | `{dbPath: ":memory:"}` | TaskRegistry SQLite config |
| `mcpBus` | object | `{enabled: true}` | MCP bus health check config |
| `workflow` | object | `{defaultPhase: "assess"}` | Workflow phase defaults |
| `background` | object | `{maxConcurrentTasks: 5}` | Background task engine |
| `divoom` | object | `{enabled: false}` | Pixoo-64 display config |
| `openclaw` | object | `{enabled: false}` | Discord/Telegram gateway |

### Presets

| Preset | Tier | Use Case |
|--------|------|----------|
| `free` | Free models only | Exploration, learning, quick experiments |
| `balanced` | Mix of free + paid | Daily development work |
| `premium` | Best available models | Production, critical, high-stakes tasks |

### Agent Override Schema

```json
{
  "agentName": {
    "model": "openai/gpt-5.5",
    "variant": "max",
    "temperature": 0.1,
    "skills": ["*"],
    "mcps": ["*", "!context7"],
    "prompt": "Custom system prompt...",
    "displayName": "@CustomName"
  }
}
```

### Presets Configuration

Define custom presets:

```json
{
  "presets": {
    "my-preset": {
      "odin": { "model": "openai/gpt-5.5", "variant": "max" },
      "sif": { "model": "openai/gpt-5.4-mini" },
      "thor": { "model": "openai/gpt-5.5", "temperature": 0.3 }
    }
  },
  "preset": "my-preset"
}
```

---

## Workflow Pipeline

### Phase-by-Phase Breakdown

```
                          KNOW NOTHING
                              │
                      ┌───────▼───────┐
                      │   /assess     │  Phase 1
                      │  Confidence   │  Conductor: @Odin
                      │   Threshold   │   → Frigg (analysis)
                      │     ≥ 6       │   → Mimir (validation)
                      └───────┬───────┘
                              │
                      ┌───────▼───────┐
                      │  /assemble    │  Phase 2
                      │  Confidence   │  Conductor: @Odin/@Njord
                      │   Threshold   │   → Vidar (codemap)
                      │     ≥ 8       │   → Sif (code search)
                      └───────┬───────┤   → Eir (docs lookup)
                              │       │   → Forseti (council)
                      ┌───────▼───────┐
                      │  /improvise   │  Phase 3
                      │  User must    │  Conductor: @Odin/@Tyr
                      │  be satisfied │   → Tyr (review)
                      └───────┬───────┤   → Heimdall (checks)
                              │       │   → Mimir (validation)
                      ┌───────▼───────┐
                      │    /act       │  Phase 4
                      │  Confidence   │  Conductor: @Njord
                      │   Threshold   │   → Thor (build)
                      │     ≥ 9       │   → Hermod (fixes)
                      └───────┬───────┤   → Freyr (UI)
                              │
                      ┌───────▼───────┐
                      │   DELIVERY    │  Done.
                      └───────────────┘
```

### Confidence Calculation

Each knowledge area (project structure, tech stack, requirements, constraints, risks, dependencies) starts at 0. As information is gathered:

- **MCP data**: +2 to +4 per area
- **Sub-agent results**: +2 to +3 per area
- **User answers**: +1 to +2 per answer
- **Max per area**: 10

Overall confidence = average across all areas.

If a phase is **rejected**, the pipeline returns to the previous phase with feedback, creating a tight feedback loop.

---

## Model Routing

### Capability-Based Routing

Each agent has a capability profile across 4 dimensions. The router calculates weighted Euclidean distance to find the best model match.

| Agent | Reasoning | Speed | Creativity | Context Size |
|-------|-----------|-------|------------|-------------|
| Odin | 9 | 5 | 7 | Large |
| Njord | 8 | 6 | 6 | Large |
| Mimir | 10 | 4 | 5 | Large |
| Vidar | 8 | 5 | 4 | X-Large |
| Thor | 6 | 8 | 5 | Large |
| Forseti | 8 | 3 | 8 | Large |
| Frigg | 9 | 4 | 6 | Large |
| Tyr | 8 | 4 | 4 | Medium |
| Sif | 4 | 9 | 3 | Medium |
| Eir | 5 | 7 | 4 | Medium |
| Freyr | 5 | 6 | 9 | Medium |
| Hermod | 5 | 9 | 3 | Medium |
| Heimdall | 4 | 6 | 5 | Medium |
| Magni | 4 | 9 | 3 | Small |
| Hod | 7 | 5 | 6 | Medium |

### Routing Weights

- **Reasoning agents** (reasoning > 7): 50% reasoning, 20% speed, 30% creativity
- **Speed agents** (speed > 7): 20% reasoning, 60% speed, 20% creativity
- **Balanced**: 33% each dimension

### Fallback Chains

Every agent has a fallback chain (primary → fallback1 → fallback2). If the primary model is unavailable, the router tries each fallback in order. If all fail, the user is notified.

### LOOM Preset (Free Tier)

| Agent | Model | Variant |
|-------|-------|---------|
| Odin | `opencode/ring-2.6-1t-free` | max |
| Mimir | `opencode/nemotron-3-super-free` | max |
| Eir | `opencode/minimax-m2.5-free` | medium |
| Sif | `opencode/big-pickle` | default |
| Freyr | `opencode/minimax-m2.5-free` | medium |
| Hermod | `opencode/deepseek-v4-flash-free` | max |
| Heimdall | `opencode/minimax-m2.5-free` | default |
| Forseti | `opencode/nemotron-3-super-free` | max |

---

## System Observer

The System Observer monitors 7 components with health checks:

| Component | What It Checks | Frequency |
|-----------|---------------|-----------|
| Plugin Bootstrap | Is the plugin loaded? | On startup |
| TaskRegistry | Can we read/write SQLite? | Every 30s |
| MCP Bus | Are MCP servers responding? | Every 30s |
| PersistentTaskEngine | Are tasks being tracked? | Every 30s |
| ToolUseEnforcer | Is it active? | Every 30s |
| Divoom | Is the display connected? | Every 30s |
| OpenClaw | Are gateways active? | Every 30s |

### Health States

| State | Meaning |
|-------|---------|
| 🟢 **Healthy** | All components operational |
| 🟡 **Degraded** | Non-critical component failed (Divoom, OpenClaw) |
| 🔴 **Critical** | Core component failed (TaskRegistry, Engine) |

View health status at any time with `/status`.

---

## MCP Bus — Server Inventory

The MCP Integration Bus auto-registers and manages these servers:

| Server | Package | Tier |
|--------|---------|------|
| clawdi | `@opencode-ai/clawdi-mcp` | Built-in |
| gbrain | `gbrain-mcp` | Built-in |
| context-mode | `@opencode-ai/context-mode-mcp` | Built-in |
| code-review-graph | `code-review-graph-mcp` | Built-in |
| gitnexus | `gitnexus-mcp` | Built-in |
| loom-mcp | `@opencode-ai/loom-mcp` | Built-in |
| openspace | `@opencode-ai/openspace-mcp` | Built-in |
| context7 | `@opencode-ai/context7-mcp` | Built-in |
| exa/websearch | `@opencode-ai/exa-mcp` | Built-in |
| gh-grep | `@opencode-ai/gh-grep-mcp` | Built-in |
| deepwiki | `@opencode-ai/deepwiki-mcp` | Built-in |
| sequential-thinking | `@opencode-ai/sequential-thinking-mcp` | Built-in |
| agent-browser | `@opencode-ai/agent-browser-mcp` | Built-in |

Additionally, project-specific MCPs from `opencode.json` and skill-embedded MCPs are auto-discovered at runtime.

---

## Hook System

### Individual Hooks (14 total)

| Hook | Purpose |
|------|---------|
| Background Notification | Routes session events to BackgroundManager |
| Model Fallback | Intercepts model failures, tries fallback chain |
| Phase Reminder | Appends workflow phase as system reminder |
| JSON Error Recovery | 6-pass JSON repair for malformed tool responses |
| Edit Error Recovery | 10 recovery patterns for failed edits |
| Compaction Context | Preserves context across session compactions |
| Agent Usage Reminder | Nudges specialist agent use after N primitive turns |
| Directory Context | Injects AGENTS.md/README.md at session start |
| Auto Command Detector | Detects intent and triggers matching command |
| Agent Picker | Routes task type to best-matching agent |
| Todo Continuation | Continues unfinished tasks across session boundaries |
| Om-Plan | 4-phase structured planning command |
| Om-Audit | Multi-perspective code audit command |
| Post-Tool Nudge | Suggests MCP/skills after tool use |

### Synthesized Hooks (11 total)

| Hook | Source | Purpose |
|------|--------|---------|
| Context Window Monitor | openagent | Warns when approaching context limit |
| File Write Guard | openagent | Warns when using bash instead of Read |
| Overwrite Protection | openagent | Prevents overwriting unread files |
| Task Reminder | openagent | Reminds about task tools after N non-task turns |
| Model Selection | openagent | Routes agents to compatible models |
| Error Recovery | both | 9 error patterns with suggestions |
| WebFetch Guard | openagent | Prevents redirect loops |
| Diff Enhancer | openagent | Captures before/after diffs on writes |
| Empty Response Detector | openagent | Detects silent task failures |
| Comment Checker | openagent | CLI-based comment validation scaffold |
| Fsync Warning | openagent | Fsync skip tracking scaffold |

---

## Origin & Credits

oh-my-unified is a **synthesized** plugin, built by studying the patterns of its parent plugins and adapting them, not copying code.

| Source | What We Took | How We Changed It |
|--------|-------------|-------------------|
| [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | Background agents, Team Mode, 59 hooks, OpenClaw, Boulder State, Hashline Edit | Simplified to SQLite-backed, renamed to Norse pantheon, added role enforcement |
| [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) | Orchestrator pattern, Interview Engine, Council System, TUI Sidebar, Session Multiplexer | Extended with confidence gates, capability scoring, anti-duplication |

Both parent plugins are remarkable pieces of engineering. oh-my-unified stands on their shoulders.

<div align="center">

---

**Built by [@lavyatandel](https://github.com/lavyatandel)** · Inspired by the Sisyphus ecosystem

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&labelColor=1a1a2e)](https://discord.gg/PUwSMR9XNk)
[![GitHub](https://img.shields.io/badge/Github-oh--my--unified-1a1a2e?style=flat-square&logo=github&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)

**MIT License** · 2026

</div>
