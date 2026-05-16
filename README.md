> [!TIP]
> **The plugin that does what the others promise.**
>
> Others made Anthropic block OpenCode. We took that energy, added 613 tests, a transparency log, and built something that ships.
>
> [**→ See the difference**](#why-another-plugin)

<div align="center">

<img src="img/hero-banner.png" alt="oh-my-unified · The Norse Pantheon of AI Agents" width="900" style="border-radius: 16px; margin-bottom: 16px;">

# ⚡ oh-my-unified

[![npm version](https://img.shields.io/npm/v/oh-my-unified?style=for-the-badge&logo=npm&color=cb3837&labelColor=1a1a2e)](https://www.npmjs.com/package/oh-my-unified)
[![License](https://img.shields.io/badge/license-MIT-00d2ff?style=for-the-badge&labelColor=1a1a2e)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-613%20passing-22c55e?style=for-the-badge&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)
[![Build](https://img.shields.io/badge/build-0.39MB-f43f5e?style=for-the-badge&labelColor=1a1a2e)](dist/)
[![OpenCode](https://img.shields.io/badge/OpenCode-plugin-7c3aed?style=for-the-badge&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)

**Think First. Assemble the Right Team. Execute with Confidence. Improve Relentlessly.**

**15 Specialized Agents · 5-Model Routing · Transparency Log · Improvisation Loop**

</div>

---

## Why Another Plugin?

Because the existing ones left gaps.

Some plugins are brilliant — 59 hooks, Team Mode, Hashline edits. But they're black boxes. You don't know *why* they picked a model, *what* decisions they made, or *when* something silently failed.

Others had clean routing. But 82 lines of README and zero depth.

So I did what any obsessive developer does: I studied what existed, kept what actually worked, and built the rest from scratch. The result:

| Feature | Others | **oh-my-unified** |
|---------|:-:|:-:|
| Tests | — | **613 passing** |
| Transparency | — | **Full audit log** |
| Confidence scores | — | **Every decision** |
| Cross-session learning | — | **Gets smarter** |
| Circuit breakers | — | **Fail gracefully** |
| Plugin registry | — | **Third-party extensible** |
| Model predictor | — | **Learns what wins** |
| Benchmark tracker | — | **Spots regressions** |
| Improvisation Loop | — | **Refine until satisfied** |
| License | SUL-1.0 | **MIT** |

> "I burned through enough tokens to know: **the best model for every task is different**. No single provider dominates. The future is routing, not choosing."

---

## The Apple Approach

Apple doesn't sell products by listing specs. They sell **outcomes**.

- You don't buy a chip. You buy **all-day battery life**.
- You don't buy RAM. You buy **everything just works**.
- You don't buy a camera. You buy **the best photo you've ever taken**.

`oh-my-unified` is the same:

| You Don't Get | You Get |
|---------------|---------|
| 15 agents | **The right agent, every time** |
| 5-model routing | **No more "model unavailable" errors** |
| SQLite persistence | **Your work is never lost** |
| Confidence gates | **No more hallucinated code in production** |
| Improvisation Loop | **Code that gets better with each iteration** |
| Transparency log | **You always know why something happened** |
| MCP auto-discovery | **Tools appear when you need them** |

---

## The Pipeline: Assess → Assemble → Improvise → Act

Most AI plugins do one thing: send your prompt to a model and hope.

**Hope is not a strategy.**

`oh-my-unified` replaces hope with a four-phase pipeline that thinks before it acts, and improves until you're satisfied:

<img src="img/pipeline-diagram.png" alt="Assess → Assemble → Improvise → Act pipeline" width="800" style="border-radius: 12px;">

```
                    KNOW NOTHING
                        │
                ┌───────▼───────┐
                │   /assess     │  Phase 1: Requirements & Gaps
                │  Confidence   │  Agents: Odin + Frigg + Mimir
                │   Threshold   │  Model: Deep reasoning (Opus-class, Gemini Pro-class)
                │     ≥ 6       │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │  /assemble    │  Phase 2: Research & Architecture
                │  Confidence   │  Agents: Vidar + Sif + Eir + Forseti
                │   Threshold   │  Model: Balanced reasoning + speed (Sonnet-class, Qwen Plus-class)
                │     ≥ 8       │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │  /improvise   │  Phase 3: Critique & Refine ◄──┐
                │  User must    │  Agents: Tyr + Heimdall + Mimir │
                │  be satisfied │  Model: Deep reasoning (Opus-class, Gemini Pro-class)
                └───────┬───────┘                                │
                        │                                        │
                ┌───────▼───────┐                                │
                │    /act       │  Phase 4: Execute              │
                │  Confidence   │  Agents: Njord + Thor + Hermod │
                │   Threshold   │  Model: Fast code execution (DeepSeek V4 Flash, Codex-class)
                │     ≥ 9       │                                │
                └───────┬───────┘                                │
                        │                                        │
                ┌───────▼───────┐                                │
                │   DELIVERY    │  Done. Ship it.                │
                └───────────────┘                                │
                                                                 │
                ┌────────────────────────────────────────────────┘
                │  Not satisfied? Loop back to /improvise
                │  with feedback. Refine until it's right.
                └────────────────────────────────────────────────
```

### Phase 1: Assessment (`/assess`)

Before writing code, understand the problem. **Odin** delegates, **Frigg** performs gap analysis, and **Mimir** provides architectural advice. Confidence must reach ≥6 before proceeding.

### Phase 2: Assembly (`/assemble`)

Research the codebase, study documentation, and design the architecture. **Vidar** maps dependencies, **Sif** scans patterns, **Eir** looks up official docs, and **Forseti** deliberates on tradeoffs. Confidence must reach ≥8.

### Phase 3: Improvisation (`/improvise`)

**This is where oh-my-unified is different.** Before execution, **Tyr** performs adversarial review, **Heimdall** watches for quality issues, and **Mimir** refines the approach. The loop continues until **you** are satisfied — not until an arbitrary threshold is met.

The Improvisation Loop (Ralph Loop) is an iterative refinement cycle. Each iteration produces better code, catches edge cases the plan missed, and incorporates your feedback. Strategy: `refine` (improve quality) or `verify` (confirm correctness). Max iterations configurable.

### Phase 4: Action (`/act`)

Execute the plan with confidence ≥9. **Njord** orchestrates, **Thor** builds, **Hermod** fixes, and **Freyr** designs. Every action is logged, every decision is recorded, every state change is persisted to SQLite.

### The Full Pipeline (`/plan`)

Run all phases sequentially with confidence gates. Only the conductor stays in the main session — every other agent gets deployed to a visible sub-session. Results are collected and synthesized into a single report.

---

## The Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        oh-my-unified                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   5-Model Routing Engine                      │   │
│  │                                                              │   │
│  │  Deep reasoning ──→ Strategists, Critics, Advisors           │   │
│  │  Balanced speed   ──→ Orchestrators, Analysts, Mappers       │   │
│  │  Fast execution   ──→ Builders, Fixers, Followers            │   │
│  │  Docs & design    ──→ Scholars, Designers, Observers         │   │
│  │  Code exploration ──→ Scouts, Explorers                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Tier 1: Foundation (Always On)                   │   │
│  │  MetricsCollector · CircuitBreaker · CostOptimizer           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Tier 2: Intelligence (Learning)                  │   │
│  │  LearningEngine · ModelPredictor · BenchmarkTracker          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Tier 3: Platform (Extensible)                    │   │
│  │  PluginRegistry · SkillCodifier · SessionRouter              │   │
│  │  IntegrationHub                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Trust & Discovery                                │   │
│  │  /diagnose · /capabilities · /onboarding · /log              │   │
│  │  TransparencyLog (14 entry types, auto-trim at 1000)         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ 25+ Hooks    │ │ Role Enf.    │ │ Anti-Dup     │                │
│  │              │ │              │ │ Cache (60s)  │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ OpenClaw     │ │ Divoom       │ │ TUI Sidebar  │                │
│  │ Gateway      │ │ Pixoo-64     │ │ (OpenTUI)    │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Dual-Runtime SQLite Shim                         │   │
│  │  Bun runtime  → bun:sqlite (tests, CLI)                      │   │
│  │  Node runtime → better-sqlite3 (OpenCode desktop)            │   │
│  │  Auto-detects at module load. Zero config.                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Meet the Norse Pantheon

15 specialized agents. Each has a role, capability profile, and permission matrix. Mention any mid-conversation with `@AgentName`.

<img src="img/pantheon-overview.png" alt="The Norse Pantheon — 15 specialized AI agents" width="800" style="border-radius: 12px;">

### Primary Agents

| Agent | Role | What It Does | Assign Models That Excel At |
|-------|------|-------------|---------------------------|
| **@Odin** | Chief Strategist | Plans, delegates, drives to completion. Does not stop halfway. | Deep reasoning, strategy |
| **@Njord** | Orchestrator | Routes work, manages sessions, coordinates parallel execution. | Balanced reasoning + speed |
| **@Mimir** | Advisor / Oracle | Deep analysis, architecture review, pattern recognition. | Deep reasoning, judgment |
| **@Vidar** | Mapper / Codemap | Codebase mapping, dependency analysis, structural understanding. | Balanced reasoning + speed |
| **@Thor** | Builder | Fast implementation. Give it a plan, it builds. | Fast code execution |
| **@Forseti** | Deliberator / Council | Multi-model consensus, deliberation, conflict resolution. | Deep reasoning, judgment |
| **@Frigg** | Analyst | Gap analysis, risk assessment, requirements validation. | Balanced reasoning + speed |
| **@Tyr** | Critic / Reviewer | Adversarial review, quality gates, finds what others miss. | Deep reasoning, judgment |

### Sub-Agents

| Agent | Role | What It Does | Assign Models That Excel At |
|-------|------|-------------|---------------------------|
| **@Sif** | Scout / Explorer | Fast codebase scanning, pattern search, grep on steroids. | Fast models, large context |
| **@Eir** | Scholar / Librarian | Documentation, research, official docs via Context7. | Documentation, analysis |
| **@Freyr** | Artisan / Designer | UI/UX, design prototypes, huashu-design skill integration. | Creativity, visual thinking |
| **@Hermod** | Runner / Fixer | Quick fixes, bug patches, iterative improvements. | Fast code execution |
| **@Heimdall** | Watcher / Observer | System monitoring, health checks, quality observation. | Documentation, analysis |
| **@Magni** | Follower | Executes follow-up tasks, handles cleanup. | Fast code execution |
| **@Hod** | Voter / Councillor | Council voting, consensus building, decision support. | Documentation, analysis |

---

## Model Recommendations

oh-my-unified doesn't force models on you. Assign whatever models you have access to. Here's what works:

| Agent Type | What It Needs | Good Candidates |
|------------|---------------|-----------------|
| **Strategists** (Odin, Mimir, Forseti, Tyr) | Deep reasoning, judgment | Opus-class, Gemini Pro-class, Ring 2.6 1T |
| **Orchestrators** (Njord, Frigg, Vidar) | Balanced reasoning + speed | Sonnet-class, Qwen Plus-class |
| **Builders** (Thor, Hermod, Magni) | Fast code execution | DeepSeek V4 Flash, Codex-class |
| **Researchers** (Eir, Heimdall, Hod) | Documentation, analysis | MiniMax-class, fast reasoning models |
| **Designers** (Freyr) | Creativity, visual thinking | Models strong at design/aesthetic |
| **Explorers** (Sif) | Codebase scanning | Fast models with large context windows |

> **Tip:** The plugin auto-discovers your available models. Configure per-agent models in your config file. The router will use your assignments and apply fallback chains automatically.

---

## MCP Auto-Discovery

oh-my-unified provides MCP tools by default. It auto-discovers your installed MCP servers and makes them available to agents — but only uses them when required. No wasted tokens, no unnecessary tool calls.

The MCP Integration Bus:
- **Auto-discovers** installed MCP servers at startup
- **Health checks** every 30s — dead servers are gracefully removed
- **Skill catalog** maps MCP capabilities to agent skills
- **Context enrichment** injects relevant MCP context only when the task requires it

Built-in MCPs include long-term memory, knowledge graph, context management, code analysis, and more. Remote MCPs (web search, GitHub code search, repository docs) are loaded on demand.

---

## Trust & Discovery

**Black boxes are for prisons.** Every decision oh-my-unified makes is logged, queryable, and auditable.

### `/diagnose` — System Health Check

12 parallel checks: plugin bootstrap, agent registration, MCP connectivity, TUI status, interview engine, circuit breakers, plugin registry, integrations, and more. Results in <1 second.

<img src="img/diagnose-output.png" alt="/diagnose command output" width="700" style="border-radius: 8px;">

### `/capabilities` — What Can This Plugin Do?

Dynamic capability listing grouped by category: agents, hooks, tools, MCPs, features. Pulls from registered feature counts — no stale documentation.

### `/onboarding` — First Run Guide

Interactive welcome menu with contextual guidance. Shows you what's installed, how to use it, and what to try first.

### `/log` — Transparency Log

The crown jewel. Every model route, agent selection, circuit breaker trip, feature trigger, error, warning, decision, plan phase, audit result, review verdict, security finding, learning application, prediction, and benchmark record — logged with timestamps, session IDs, and confidence scores.

```
/log              # Recent 20 entries
/log recent 50    # Last 50 entries
/log stats        # Statistics by type and session
/log error        # All error entries
/log model_routing # All model routing decisions
```

**14 entry types · Auto-trim at 1000 · Queryable by type, session, time, limit**

<img src="img/transparency-log.png" alt="/log command output" width="700" style="border-radius: 8px;">

---

## Features

### Tier 1: Foundation (Always On)

| Feature | What It Does |
|---------|-------------|
| **MetricsCollector** | Tracks fallback triggers, model routing, review outcomes, security findings. Budget-aware with daily cost limits. |
| **CircuitBreaker** | Fail gracefully, not silently. Each feature module has its own breaker with configurable thresholds and recovery timeouts. |
| **CostOptimizer** | Model selection based on capability scoring. Routes reasoning tasks to Nemotron, speed tasks to DeepSeek, docs to MiniMax. |

### Tier 2: Intelligence (Gets Smarter)

| Feature | What It Does |
|---------|-------------|
| **LearningEngine** | Cross-session learning. Remembers what worked, what failed, what patterns emerged. Injects relevant lessons into new sessions. |
| **ModelPredictor** | Predictive model selection. Learns which model wins which task type. Overrides routing when confidence > 70%. |
| **BenchmarkTracker** | Performance regression tracking. Records latency, tokens, cost, quality per model. Spots regressions before they ship. |

### Tier 3: Platform (Extensible)

| Feature | What It Does |
|---------|-------------|
| **PluginRegistry** | Third-party feature registration. Hook points: `chat.message`, `tool.execute.before`, `tool.execute.after`. |
| **SkillCodifier** | Turns your successful patterns into reusable skills. Threshold-based: codifies after N successful repetitions. |
| **SessionRouter** | Multi-user session routing. Routes work to the right user, isolates contexts, manages concurrent sessions. |
| **IntegrationHub** | External integrations: GitHub, Jira, Slack. Webhook-based, configurable per integration. |

### Confidence Gates

No phase transition without sufficient confidence. Each knowledge area (project structure, tech stack, requirements, constraints, risks, dependencies) scored independently. Rejected phases return to previous phase with feedback.

| Source | Points per Area | Max |
|--------|----------------|-----|
| MCP data | +2 to +4 | 10 |
| Sub-agent results | +2 to +3 | 10 |
| User answers | +1 to +2 | 10 |

### Anti-Duplication

Same query from 2 agents? First one runs, second gets cached result. 60-second TTL. In-flight requests deduplicated. No wasted tokens.

### Role Enforcement

Every agent has a permission matrix (read/edit/delegate/research). Violations blocked at runtime. Builders can't override strategy. Critics can't edit files.

### Dual-Runtime SQLite Shim

The plugin works in both Bun (tests, CLI) and Node.js (OpenCode desktop) without configuration. At module load time, it detects the runtime and loads the appropriate SQLite driver:

- **Bun runtime** → `bun:sqlite` (built-in, used for tests and CLI)
- **Node.js runtime** → `better-sqlite3` (used for OpenCode desktop app)

This fixes the crash that occurs when `better-sqlite3`'s native ABI doesn't match Electron's Node version — caught at instantiation time, not require time.

---

## Commands

### Workflow Pipeline

| Command | Description | Confidence Gate |
|---------|-------------|-----------------|
| `/assess` | Requirements assessment | ≥6 |
| `/assemble` | Deep research & architecture | ≥8 |
| `/improvise` | Critique & refine (loop until satisfied) | User satisfied |
| `/act` | Execute the plan | ≥9 |
| `/plan` | Full end-to-end workflow | Sequential gates |
| `/synthesize` | Deploy all agents, one report | N/A |

### Structured Planning & Audit

| Command | Description |
|---------|-------------|
| `/om-plan` | 4-phase structured planning (assess→assemble→act→improvise) with confidence scores |
| `/om-audit` | Multi-perspective code audit (architecture, quality, security, UX) with severity-weighted scoring |

### Trust & Discovery

| Command | Description |
|---------|-------------|
| `/diagnose` | 12 parallel system health checks |
| `/capabilities` | Dynamic capability listing |
| `/onboarding` | First-run interactive guide |
| `/log` | Transparency log query (recent, stats, by type, by session) |
| `/status` | System Observer health report (7 components) |

### Agent Mentions

```
@Odin analyze this project structure
@Sif search for authentication patterns
@Tyr review my approach
@Thor implement the fix
@Freyr design a landing page
```

<img src="img/agents-command.png" alt="/agents command output" width="700" style="border-radius: 8px;">

---

## Quick Start

### Install

```bash
npm install -g oh-my-unified
```

Or add to your `opencode.json`:

```json
{
  "plugin": ["oh-my-unified"]
}
```

### First Run

```
/plan           # Full pipeline: assess → assemble → improvise → act
/assess         # Phase 1: understand the project
```

### Configuration

Configure your models and agents through the plugin's config file. The schema supports per-agent model overrides, disabled agents, persistence settings, and MCP bus configuration.

---

## Hook System

25+ lifecycle hooks across two tiers:

### Individual Hooks (14)

| Hook | Purpose |
|------|---------|
| Background Notification | Routes session events to BackgroundManager |
| Model Fallback | Intercepts model failures, tries fallback chain |
| Phase Reminder | Appends workflow phase as system reminder |
| JSON Error Recovery | 6-pass JSON repair for malformed responses |
| Edit Error Recovery | 10 recovery patterns for failed edits |
| Compaction Context | Preserves context across session compactions |
| Agent Usage Reminder | Nudges specialist agents after N primitive turns |
| Directory Context | Injects AGENTS.md/README.md at session start |
| Auto Command Detector | Detects intent, triggers matching command |
| Todo Continuation | Continues unfinished tasks across sessions |
| Post-Tool Nudge | Suggests MCP/skills after tool use |
| Om-Plan | 4-phase structured planning |
| Om-Audit | Multi-perspective code audit |
| Proactive Fallback | Preemptive model switching on error rates |

### Synthesized Hooks (11)

| Hook | Purpose |
|------|---------|
| Context Window Monitor | Warns near context limits |
| File Write Guard | Warns on bash vs Read |
| Overwrite Protection | Prevents overwriting unread files |
| Task Reminder | Reminds about task tools |
| Model Selection | Routes to compatible models |
| Error Recovery | 9 error patterns with suggestions |
| WebFetch Guard | Prevents redirect loops |
| Diff Enhancer | Captures before/after diffs |
| Empty Response Detector | Detects silent failures |
| Comment Checker | Blocks AI slop comments |
| Fsync Warning | Tracks fsync skips |

---

<div align="center">

---

**Built by [@lavyatandel](https://github.com/lavyatandel)**

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&labelColor=1a1a2e)](https://discord.gg/PUwSMR9XNk)
[![GitHub](https://img.shields.io/badge/Github-oh--my--unified-1a1a2e?style=for-the-badge&logo=github&labelColor=1a1a2e)](https://github.com/lavyatandel/oh-my-unified)

**MIT License** · 2026

</div>
