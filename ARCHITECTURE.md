# oh-my-unified — Complete Architecture Document

> Generated: 2026-05-13
> Source: `/Users/lavyatandel/Documents/Oh-my-agent/oh-my-unified/`
> Tests: 266 passing · 0 failing · 887 expects
> Source Files: 141 TypeScript files
> Build Size: 160KB (dist/)

---

## Table of Contents

1. [Philosophy & Design Principles](#1-philosophy--design-principles)
2. [Norse Pantheon — Agent System](#2-norse-pantheon--agent-system)
3. [Session Architecture](#3-session-architecture)
4. [Workflow Orchestration](#4-workflow-orchestration)
5. [Module Inventory](#5-module-inventory)
6. [Hook System](#6-hook-system)
7. [Commands & Controls](#7-commands--controls)
8. [Pipeline & Phase Gates](#8-pipeline--phase-gates)
9. [Model Routing](#9-model-routing)
10. [System Observer](#10-system-observer)
11. [Anti-Duplication](#11-anti-duplication)
12. [Role Enforcement](#12-role-enforcement)
13. [Lazy Loading](#13-lazy-loading)
14. [Integration Points](#14-integration-points)
15. [Parent Plugin Inheritance](#15-parent-plugin-inheritance)
16. [Known Gaps & Risks](#16-known-gaps--risks)

---

## 1. Philosophy & Design Principles

### Core Tenets

1. **Know Nothing Mode** — The plugin assumes ZERO context about any project. It must interview, research, and gather information before any action.

2. **100% Confidence Gate** — No phase transition happens until confidence threshold is met. `/assess` (≥6) → `/assemble` (≥8) → `/improvise` (user satisfied) → `/act` (≥9).

3. **One Conductor Rule** — Only the TUI-selected agent lives in the main session. EVERY other agent works in visible but non-interactive sub-sessions.

4. **Sub-Session Visibility** — Users can WATCH sub-agents work but cannot prompt them. Each sub-agent gets full prompt instructions at launch.

5. **Main Waits for Subs** — The conductor in the main session ALWAYS waits for all deployed sub-sessions to complete before proceeding. Timeout: 5 minutes.

6. **Dynamic Discovery** — The plugin never hardcodes user-specific MCPs, skills, or models. It reads the user's actual `opencode.json` and skill directories at runtime.

7. **Lazy Loading** — All components register at startup (zero token cost). They LOAD only when actually needed. Users can disable per session/project.

8. **Synthesized, Not Copied** — Code patterns from parent plugins are studied and ADAPTED, not copy-pasted. Credit to patterns, not code.

### Origins

| Source | What We Took | How We Changed It |
|--------|-------------|-------------------|
| oh-my-openagent | Background agents, Team Mode, 50+ hooks, OpenClaw, Boulder State, Hashline Edit | Simplified, SQLite-backed, Norse names |
| oh-my-opencode-slim | Orchestrator pattern, Interview Engine, Council, TUI, Presets | Norse names, integrated into pipeline |
| User's oh-my-agents-synthesis | om-plan, om-audit, 5-model LOOM routing | Preserved as /commands |

---

## 2. Norse Pantheon — Agent System

### Primary Agents (TUI-Selectable — can be conductor)

| Agent | Norse Name | Role | Norse Meaning | Model Default | Delegates To |
|-------|-----------|------|--------------|--------------|-------------|
| Odin | @Odin | Chief Strategist | All-father, wisdom | ring-2.6-1t-free | Mimir, Eir, Sif, Frigg |
| Njord | @Njord | Orchestrator | God of sea, wealth | ring-2.6-1t-free | Mimir, Eir, Sif, Freyr, Hermod, Heimdall, Thor, Vidar |
| Mimir | @Mimir | Advisor | Guardian of wisdom well | nemotron-3-super | None (read-only) |
| Vidar | @Vidar | Mapper | God of vengeance, silence | ring-2.6-1t-free | Sif |
| Thor | @Thor | Builder | God of thunder, strength | deepseek-v4-flash | None (builder) |
| Forseti | @Forseti | Deliberator | God of justice, council | nemotron-3-super | Hod |
| Frigg | @Frigg | Analyst | Goddess of foresight | nemotron-3-super | Mimir, Eir |
| Tyr | @Tyr | Critic | God of justice, oaths | nemotron-3-super | None (critic) |

### Sub-Agents (Deployed via sub-session — never conductor)

| Agent | Norse Name | Role | Norse Meaning | Model Default | Can Delegate To |
|-------|-----------|------|--------------|--------------|----------------|
| Sif | @Sif | Scout | Goddess of harvest | big-pickle | None (leaf) |
| Eir | @Eir | Scholar | Goddess of healing, mercy | minimax-m2.5 | None (leaf) |
| Freyr | @Freyr | Artisan | God of peace, fertility | minimax-m2.5 | Sif |
| Hermod | @Hermod | Runner | Messenger god | deepseek-v4-flash | None (leaf) |
| Heimdall | @Heimdall | Watcher | Guardian of Bifrost | minimax-m2.5 | None (leaf) |
| Magni | @Magni | Follower | God of strength | deepseek-v4-flash | None (leaf) |
| Hod | @Hod | Voter | Blind god, winter | minimax-m2.5 | None (leaf) |

### Role-Based Permissions

| Role | Can Read | Can Edit | Can Delegate | Can Research |
|-----|----------|----------|-------------|-------------|
| Strategist (Odin) | ✅ | ✅ | ✅ | ✅ |
| Orchestrator (Njord) | ✅ | ❌ | ✅ | ✅ |
| Advisor (Mimir) | ✅ | ❌ | ❌ | ✅ |
| Mapper (Vidar) | ✅ | ❌ | ✅ | ✅ |
| Builder (Thor) | ✅ | ✅ | ❌ | ✅ |
| Deliberator (Forseti) | ✅ | ❌ | ✅ (only Hod) | ✅ |
| Analyst (Frigg) | ✅ | ❌ | ✅ | ✅ |
| Critic (Tyr) | ✅ | ❌ | ❌ | ✅ |
| Scout/Scholar/Watcher (Sif/Eir/Heimdall) | ✅ | ❌ | ❌ | ✅ |
| Runner (Hermod) | ✅ | ✅ | ❌ | ❌ |
| Artisan (Freyr) | ✅ | ✅ | ✅ (only Sif) | ✅ |

---

## 3. Session Architecture

### How Sessions Work

```
┌─── TUI SELECTOR ──────────────────────────────────────┐
│  [@Odin]  @Njord  @Mimir  @Thor  @Vidar  @Frigg  @Tyr │
└────────────────────────────────────────────────────────┘
                         │
         User selects Odin → Odin becomes CONDUCTOR
                         │
┌─── MAIN SESSION ──────────────────────────────────────┐
│  Session ID: ses_main_[id]                             │
│  Conductor: @Odin                                      │
│  User can: type messages, see responses                │
│  @Odin: "Let me research your project..."               │
│  @Odin calls @Mimir → creates sub-session              │
│  @Odin calls @Sif → creates sub-session                 │
│  @Odin: ⏳ Waiting for 2 sub-sessions...                │
│  @Odin: "✅ All complete. Here's my analysis..."        │
└────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌─── SUB-SESSION ─────────┐  ┌─── SUB-SESSION ─────────┐
│ ID: sub-mimir-123456    │  │ ID: sub-sif-123457      │
│ Agent: @Mimir           │  │ Agent: @Sif             │
│ Visible: YES            │  │ Visible: YES            │
│ Interactive: NO         │  │ Interactive: NO         │
│ Status: COMPLETED       │  │ Status: COMPLETED       │
│ Result: arch analysis   │  │ Result: code patterns   │
│ Prompt instructions sent │  │ Prompt instructions sent│
└─────────────────────────┘  └─────────────────────────┘
```

### Sub-Session Lifecycle

1. **Launch** — Conductor calls agent → sub-session created with full prompt instructions
2. **Visible** — Sub-session appears in TUI sidebar, user can watch output
3. **Non-Interactive** — User cannot type into sub-session, cannot redirect it
4. **Work** — Sub-agent executes autonomously with its prompt
5. **Complete** — Sub-agent finishes, result stored
6. **Report** — Conductor polls for completion, retrieves result
7. **Cleanup** — Completed sub-sessions cleared after conductor acknowledges

### Conductor Wait Behavior

- Conductor deploys sub-agents in parallel
- Conductor enters WAITING state — shows progress in TUI
- Polls every 1s for completion
- Default timeout: 5 minutes
- If timeout: returns partial results, warns user
- ALL results flow back to conductor before next step

---

## 4. Workflow Orchestration

### Phase State Machine

```
                  ┌──────────────┐
                  │    IDLE      │
                  └──────┬───────┘
                         │ /plan or /assess
                         ▼
                  ┌──────────────┐
         ┌───────│   /ASSESS    │◄────── Conf < 6?
         │       │  Confidence  │
         │       │  threshold:6 │──────► Conf ≥ 6
         │       └──────┬───────┘
         │              ▼
         │       ┌──────────────┐
         │       │  /ASSEMBLE   │◄────── Conf < 8?
         │       │  Confidence  │
         │       │  threshold:8 │──────► Conf ≥ 8
         │       └──────┬───────┘
         │              ▼
         │       ┌──────────────┐
         │       │ /IMPROVISE   │◄────── User not satisfied
         │       │   User       │
         │       │  satisfied?  │──────► Yes
         │       └──────┬───────┘
         │              ▼
         │       ┌──────────────┐
         │       │    /ACT      │
         │       └──────────────┘
         │              │
         │       ┌──────────────┐
         └───────│   COMPLETE   │
                 └──────────────┘
```

### Phase Descriptions

**/assess — "Know Nothing" Mode**
- Conductor: @Odin (default)
- Goal: Gather maximum context about project
- Tools: All available MCPs, sub-agents, user questions
- What happens:
  1. Odin deploys parallel recon: gitnexus (structure), gbrain (knowledge), clawdi (memory), loom (notes)
  2. If MCPs insufficient: deploys @Sif (code search), @Eir (docs)
  3. Odin asks user questions to fill remaining gaps
  4. Confidence calculated from knowledge areas
  5. Confidence ≥ 6? → auto-transition to /assemble

**/assemble — Research Deep**
- Conductor: @Odin or @Njord
- Goal: Architecture mapping, pattern research, approach deliberation
- Agents: @Vidar (codemap), @Sif (search), @Eir (docs), @Forseti (council)
- Confidence ≥ 8? → auto-transition to /improvise

**/improvise — Critique & Refine**
- Conductor: @Odin or @Tyr
- Goal: Find flaws, check completeness, validate decisions
- Agents: @Tyr (review), @Heimdall (check), @Mimir (validate)
- User satisfied? → /act

**/act — Execute**
- Conductor: @Njord
- Goal: Build, implement, deliver
- Agents: @Thor (build), @Hermod (fix), @Freyr (UI)
- Sequential execution with role enforcement

---

## 5. Module Inventory

### Core Modules

| Module | Location | Purpose | Tests |
|--------|----------|---------|-------|
| Persistence | `src/persistence/` | SQLite-backed TaskRegistry | 13 |
| Background | `src/background/` | PersistentTaskEngine + CompletionDetector + Reconstructor | 24 |
| MCP Bus | `src/mcp-bus/` | MCP server registry, health checks | 13 |
| Workflow Orchestrator | `src/features/workflow-orchestrator/` | Phase state machine, Prometheus recon planner | 21 |
| Pipeline Connector | `src/features/pipeline/` | Session architecture, conductor selection, sub-session lifecycle | 27 |
| Agent Commands | `src/features/agent-commands/` | Agent definitions (Norse), TUI integration, /commands | — |
| Role Enforcer | `src/features/role-enforcer/` | Permission gating per agent role | 13 |
| Kanban Tracker | `src/features/kanban/` | Sequential workflow status, dependency ordering | 12 |
| System Observer | `src/features/system-observer/` | Runtime health monitoring, 7 component checks | 21 |
| Anti-Duplication | `src/features/anti-duplication/` | Prevents parallel agents searching same thing | 8 |
| Tool Use Enforcer | `src/features/tool-use-enforcer/` | Dynamic MCP/skill discovery, usage monitoring | 29 |
| Team Mode | `src/features/team-mode/` | Team registry, task list, parallel coordination | 18 |
| Lazy Loader | `src/features/lazy-loader/` | Register→load on demand→disable | — |
| Model Router | `src/features/model-router/` | Capability-based model matching + fallbacks | — |
| MCP Tiers | `src/features/mcp-tiers/` | 3-tier MCP system (built-in/project/skill-embedded) | 8 |
| Session Multiplexer | `src/features/session-multiplexer/` | Tmux/Zellij session management | 10 |
| Model-Router | `src/features/model-router/` | Capability-based model routing | — |

### Tools

| Tool | Location | Purpose |
|------|----------|---------|
| Hashline Edit | `src/tools/hashline-edit/` | Line hash-based editing, stable across shifts |
| Preset Manager | `src/tools/preset-manager/` | Model configuration presets | 10 |
| AST-grep | `src/tools/` (from reference) | AST-aware code search/replace |
| Smartfetch | `src/tools/` (from reference) | Web fetch with jsdom extraction |
| Subtask | `src/tools/` (from reference) | Task decomposition |

### Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| Shared Utils | `src/shared/` | Logger, tool classification, display names, fsync |
| Config | `src/config/` | Zod schemas for all plugin config |
| Hooks | `src/hooks/` | 25 lifecycle hooks (14 individual + 11 synthesized) |
| CLI | `src/cli/` | Install, doctor commands |
| TUI | `src/tui.ts` | @opentui sidebar |
| Interview Engine | `src/interview/` | Web-based interview UI (Express + HTML) |
| OpenClaw | `src/openclaw/` | Discord/Telegram/HTTP gateway |
| Divoom | `src/divoom/` | Pixoo-64 display driver |
| Agents | `src/agents/` | 14 agent factories from reference |

---

## 6. Hook System

### Individual Hooks (from openagent patterns)

| Hook | File | Purpose |
|------|------|---------|
| Background Notification | `hooks/background-notification.ts` | Routes session events to BackgroundManager |
| Model Fallback | `hooks/model-fallback.ts` | Intercepts model failures, tries fallback chain |
| Phase Reminder | `hooks/phase-reminder.ts` | Appends workflow phase as system reminder |
| JSON Error Recovery | `hooks/json-error-recovery.ts` | Fixes malformed JSON in tool responses (6 fix passes) |
| Edit Error Recovery | `hooks/edit-error-recovery.ts` | Recovery suggestions for failed edits (10 patterns) |
| Compaction Context | `hooks/compaction-context-injector.ts` | Preserves context across session compactions |
| Agent Usage Reminder | `hooks/agent-usage-reminder.ts` | Nudges to use specialist agents after 6 primitive turns |
| Directory Context | `hooks/directory-context-injector.ts` | Injects AGENTS.md/README.md project context |
| Auto Command Detector | `hooks/auto-command-detector.ts` | Detects keywords → suggests /commands |
| Post-Tool Nudge | `hooks/post-tool-nudge.ts` | After edits, nudges to run typecheck/test |
| Todo Continuation | `hooks/todo-continuation.ts` | Persists/restores todo state across sessions |
| Om-Plan | `hooks/om-plan.ts` | User's 4-phase workflow command |
| Om-Audit | `hooks/om-audit.ts` | User's multi-perspective audit command |

### Synthesized Hooks (from both parent patterns)

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
| Comment Checker | openagent | Scaffold for CLI-based comment validation |
| Fsync Warning | openagent | Scaffold for fsync skip tracking |

---

## 7. Commands & Controls

### Our Commands (/ prefix)

| Command | Description | Phase | Agents Used |
|---------|-------------|-------|-------------|
| `/assess` | Start requirements assessment | assess | Odin + Frigg + Mimir |
| `/assemble` | Research deep, architecture | assemble | Vidar + Sif + Eir + Forseti |
| `/improvise` | Critique and refine | improvise | Tyr + Heimdall + Mimir |
| `/act` | Execute plan | act | Njord + Thor + Hermod + Freyr |
| `/plan` | Full workflow end-to-end | all | All agents sequentially |
| `/status` | Show system health | — | SystemObserver |
| `/synthesize` | Deploy all agents, synthesize | synthesis | All agents → one report |

### Agent Mentions (@ prefix)

| Mention | Targets |
|---------|---------|
| `@Odin` | Chief strategist |
| `@Njord` | Orchestrator |
| `@Mimir` | Advisor |
| `@Vidar` | Mapper |
| `@Thor` | Builder |
| `@Forseti` | Deliberator |
| `@Frigg` | Analyst |
| `@Tyr` | Critic |
| `@Sif` | Scout |
| `@Eir` | Scholar |
| `@Freyr` | Artisan |
| `@Hermod` | Runner |
| `@Heimdall` | Watcher |
| `@Magni` | Follower |
| `@Hod` | Voter |

### User's Preserved Commands

| Command | Source | Purpose |
|---------|--------|---------|
| `/om-plan` | oh-my-agents-synthesis | 4-phase structured planning |
| `/om-audit` | oh-my-agents-synthesis | Multi-perspective code audit |

---

## 8. Pipeline & Phase Gates

### Full Pipeline Flow

```
/plan
  │
  ├─ Phase 1: /assess ─────────────────────────────── Conf ≥ 6
  │   ├── @Odin (main session) — interview, question
  │   ├── [sub] @Frigg — gap analysis on requirements
  │   ├── [sub] @Mimir — architecture review
  │   ├── [sub] @Sif — codebase search (if MCPs insufficient)
  │   ├── [sub] @Eir — doc lookup (if MCPs insufficient)
  │   └── Confidence gates: MCP data + sub-agent results + user answers
  │
  ├─ Phase 2: /assemble ────────────────────────────── Conf ≥ 8
  │   ├── @Odin (main session) — synthesis
  │   ├── [sub] @Vidar — codebase mapping
  │   ├── [sub] @Forseti — council deliberation
  │   └── Produces: architecture doc + resource map
  │
  ├─ Phase 3: /improvise ───────────────────────────── User satisfied
  │   ├── @Odin (main session)
  │   ├── [sub] @Tyr — quality review
  │   ├── [sub] @Heimdall — completeness check
  │   ├── [sub] @Mimir — decision validation
  │   └── User reviews → approves /act
  │
  ├─ Phase 4: /act ───────────────────────────────────
  │   ├── @Njord (main session) — orchestrates
  │   ├── [sub] @Thor — builds implementation
  │   ├── [sub] @Hermod — scoped fixes
  │   ├── [sub] @Freyr — UI work
  │   └── Sequential with role enforcement
  │
  └─ /synthesize ─────────────────────────────────────
      └── All results → one report → presented to user
```

### Confidence Calculation

Confidence is calculated per KnowledgeArea and averaged:
- Each area starts at 0
- MCP data → +2-4 per area depending on tool match
- Sub-agent results → +2-3 per area
- User answers → +1-2 per answer
- Max per area: 10

Phase gates:
- `/assess → /assemble`: Overall confidence ≥ 6
- `/assemble → /improvise`: Overall confidence ≥ 8
- `/improvise → /act`: User explicitly satisfied
- Rejected → back to previous phase with feedback

---

## 9. Model Routing

### Capability Scoring

Each agent has a capability profile (reasoning/speed/creativity/context).
Each model has capability scores.
The router calculates weighted Euclidean distance to find the best match.

| Agent | Reasoning | Speed | Creativity | Context |
|-------|-----------|-------|------------|---------|
| Odin | 9 | 5 | 7 | large |
| Njord | 8 | 6 | 6 | large |
| Mimir | 10 | 4 | 5 | large |
| Vidar | 8 | 5 | 4 | xlarge |
| Thor | 6 | 8 | 5 | large |
| Forseti | 8 | 3 | 8 | large |
| Frigg | 9 | 4 | 6 | large |
| Tyr | 8 | 4 | 4 | medium |
| Sif | 4 | 9 | 3 | medium |
| Eir | 5 | 7 | 4 | medium |
| Freyr | 5 | 6 | 9 | medium |
| Hermod | 5 | 9 | 3 | medium |
| Heimdall | 4 | 6 | 5 | medium |
| Magni | 4 | 9 | 3 | small |
| Hod | 7 | 5 | 6 | medium |

### Weighting

- Reasoning agents (reasoning > 7): 50% reasoning, 20% speed, 30% creativity
- Speed agents (speed > 7): 20% reasoning, 60% speed, 20% creativity
- Balanced: 33% each

### Fallback Chains

Each agent has an ordered fallback chain:
- Primary → Fallback1 → Fallback2
- If primary unavailable, try fallback1
- If all unavailable, warn user

### Presets

| Preset | Tier | Use Case |
|--------|------|----------|
| `free` | Free models | Exploration, learning |
| `balanced` | Mix free + paid | Daily work |
| `premium` | Best models | Production, critical |

---

## 10. System Observer

### Components Monitored

| Component | Check | Frequency |
|-----------|-------|-----------|
| Plugin Bootstrap | Is the plugin loaded? | Startup |
| TaskRegistry | Can we read/write SQLite? | Every 30s |
| MCP Bus | Are MCPs responding? | Every 30s |
| PersistentTaskEngine | Are tasks being tracked? | Every 30s |
| ToolUseEnforcer | Is it active? | Every 30s |
| Divoom | Is display connected? | Every 30s |
| OpenClaw | Are gateways active? | Every 30s |

### Health States

- **Healthy** — All components operational
- **Degraded** — Non-critical component failed (Divoom, OpenClaw)
- **Critical** — Core component failed (TaskRegistry, Engine)

### Output

- Console logs every health check interval
- Status report on demand via `/status`
- Warnings/errors collected per component
- Agent activity tracked (last active timestamp, tasks completed)
- Status change events emitted (healthy→degraded→critical)

---

## 11. Anti-Duplication

### Problem
When Odin sends both Sif and Eir to research the "auth system", they shouldn't both run the same search. One should run, the other should get cached results.

### Solution
```
Agent A requests: search("auth system")
  → Check in-flight cache: not there
  → Execute search
  → Store result in cache (60s TTL)
  → Return result

Agent B requests: search("auth system") (2 seconds later)
  → Check in-flight cache: Agent A is already doing this
  → Wait for Agent A's result
  → Return cached result (cache:true flag set)
```

### Key Design
- Composite key: `{type, query, scope}`
- Cache TTL: 60 seconds
- In-flight wait: concurrent requests for same key wait for first to complete
- Different queries/scopes: NOT deduplicated
- `cache:true` flag on cached results so conductor knows

---

## 12. Role Enforcement

### What It Guards

1. **Agent → Agent delegation**: Can @X delegate to @Y?
2. **Agent → Action**: Can @X edit files? Read? Research?
3. **Role boundaries enforced at runtime**, not just in config

### Permission Matrix

| Role | Read | Edit | Delegate | Research |
|-----|------|------|----------|----------|
| Strategist | ✅ | ✅ | ✅ | ✅ |
| Orchestrator | ✅ | ❌ | ✅ | ✅ |
| Advisor | ✅ | ❌ | ❌ | ✅ |
| Mapper | ✅ | ❌ | ✅ | ✅ |
| Builder | ✅ | ✅ | ❌ | ✅ |
| Deliberator | ✅ | ❌ | ✅ (Hod only) | ✅ |
| Analyst | ✅ | ❌ | ✅ | ✅ |
| Critic | ✅ | ❌ | ❌ | ✅ |
| Scout/Scholar/Watcher | ✅ | ❌ | ❌ | ✅ |
| Runner | ✅ | ✅ | ❌ | ❌ |
| Artisan | ✅ | ✅ | ✅ (Sif only) | ✅ |
| Follower | ✅ | ✅ | ❌ | ❌ |
| Voter | ✅ | ❌ | ❌ | ✅ |

---

## 13. Lazy Loading

### Principle
Components REGISTER at startup (just their name and description — zero token cost).
Components LOAD only when actually needed.

### Flow
```
STARTUP:
  LazyLoader.register('odin', 'agent', '@Odin', 'Chief strategist')
  LazyLoader.register('mimir', 'agent', '@Mimir', 'Advisor')
  ... (zero token cost — just strings)

WHEN NEEDED:
  const odin = LazyLoader.load('odin')  // ← now actually loaded
  odin.prompt = "..."  // ← tokens used

USER CONTROL:
  LazyLoader.disable('heimdall')  // ← disabled for this session
  LazyLoader.enable('heimdall')   // ← re-enabled
```

### Smart Loading
When a task type is detected, relevant agents are pre-loaded:
- `plan|interview` task → load Odin
- `search|find` task → load Sif
- `docs|reference` task → load Eir

---

## 14. Integration Points

### With OpenCode
- Plugin entry: `src/index.ts` → exports `pluginModule`
- TUI: `src/tui.ts` → `@opentui/solid` sidebar
- Config: Reads `opencode.json` for MCPs, model config
- Hooks: Register via OpenCode's hook system

### With User's Existing Plugins
- oh-my-openagent: Can coexist (different hook names, agent configs)
- oh-my-opencode-slim: Can coexist (different agent names)
- User's custom skills: Automatically discovered via skill directory scan

### With External Systems
- GitHub: via `gh` CLI integration
- Discord/Telegram: via OpenClaw gateway
- Divoom Pixoo-64: via USB/BLE display driver
- Tmux/Zellij: via Session Multiplexer

### MCP Discovery
1. Plugin reads `~/.config/opencode/opencode.json` → discovers user's MCPs
2. Scans `~/.config/opencode/skills/` → discovers opencode skills
3. Scans `~/.claude/skills/` → discovers claude skills
4. Falls back to defaults only if nothing found
5. Entries tagged with source: 'discovered' vs 'default'

---

## 15. Parent Plugin Inheritance

### From oh-my-openagent (Battleship)
| Feature | How We Implemented It |
|---------|----------------------|
| Background Agent System | PersistentTaskEngine with SQLite-backed TaskRegistry |
| Team Mode | src/features/team-mode/ — registry + task list |
| 59 Lifecycle Hooks | 25 hooks — 14 individual + 11 synthesized |
| OpenClaw Gateway | src/openclaw/ — Discord/Telegram/HTTP |
| Boulder State | .sisyphus/boulder.json schema v2 |
| Hashline Edit | src/tools/hashline-edit/ — MD5-based line hashing |
| Anti-Duplication | src/features/anti-duplication/ — in-flight cache |
| 3-Tier MCP | src/features/mcp-tiers/ — built-in/project/skill |
| Model Routing | src/features/model-router/ — capability scoring |
| 11 Agents | Norse renamed, role-enforced |
| 390+ Utilities | src/shared/ — logger, tool names, display names |

### From oh-my-opencode-slim (Fighter Jet)
| Feature | How We Implemented It |
|---------|----------------------|
| Orchestrator Pattern | Pipeline connector — one conductor, parallel sub-sessions |
| Interview Engine | src/interview/ — Express + HTML interview UI |
| Council System | src/agents/council.ts + forseti agent |
| TUI Sidebar | src/tui.ts — @opentui sidebar |
| Session Multiplexer | src/features/session-multiplexer/ — tmux/zellij |
| Preset Manager | src/tools/preset-manager/ — 3 presets |
| Custom Agents | Agent config system — users define their own |
| Clean Documentation | This document + README + AGENTS.md |

### From User's oh-my-agents-synthesis
| Feature | How We Preserved It |
|---------|-------------------|
| om-plan | src/hooks/om-plan.ts — 4-phase workflow |
| om-audit | src/hooks/om-audit.ts — multi-perspective audit |
| 5-Model LOOM Routing | Model default configs per agent |
| 8 Agent Factories | src/agents/ — reference source preserved |

---

## 16. Known Gaps & Risks

### Architectural Risks
1. **Sub-session polling** — `waitForAllSubSessions()` polls every 1s. For long-running agents, this adds overhead. Consider event-driven completion instead.
2. **Confidence calculation** — Currently averaged across knowledge areas. May need weighted calculation based on importance.
3. **SQLite contention** — Multiple agents writing to same DB file. WAL mode helps but concurrent writes could conflict.
4. **MCP health check frequency** — Every 30s may be too aggressive for remote MCPs.

### Missing Features
1. **Platform binaries** — Build script exists but not wired into CI.
2. **npm publish** — Package ready but not published.
3. **Comprehensive error states** — Not every error path is tested (20/27 files have tests).
4. **Stress testing** — No real-world workload has been run against this system.

### Integration Risks
1. **Plugin conflicts** — Could conflict with oh-my-openagent's hooks (need namespace isolation).
2. **Model availability** — Free models may be rate-limited or unavailable.
3. **MCP load time** — First load of all MCPs could be slow.

### Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| TaskRegistry | 13 | ✅ |
| PersistentTaskEngine | 15 | ✅ |
| CompletionDetector | 9 | ✅ |
| MCP Bus | 13 | ✅ |
| Tool Use Enforcer | 29 | ✅ |
| Team Mode | 18 | ✅ |
| OpenClaw | 10 | ✅ |
| Divoom | 10 | ✅ |
| Workflow Orchestrator | 21 | ✅ |
| Pipeline | 27 | ✅ |
| Kanban | 12 | ✅ |
| Role Enforcer | 13 | ✅ |
| Anti-Duplication | 8 | ✅ |
| MCP Tiers | 8 | ✅ |
| Session Multiplexer | 10 | ✅ |
| Preset Manager | 10 | ✅ |
| Integration | 14 | ✅ |
| System Observer | 21 | ✅ |
| **Total** | **266** | **✅ 0 failures** |

---

*End of Architecture Document*
*oh-my-unified — Built by Prometheus for lavyatandel*
*Norse Pantheon · Persistent Task Engine · Dynamic Discovery · Pipeline Orchestration*
