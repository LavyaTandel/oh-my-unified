# AGENTS.md — oh-my-unified

Agent Coding Guidelines for the oh-my-unified OpenCode plugin.

## Build & Test

```bash
# Build both plugin and CLI
bun run build

# Typecheck (tsc --noEmit --skipLibCheck)
bun run typecheck

# Run all tests
bun test

# Run a single test file
bun test src/background/persistent-task-engine.test.ts

# Run tests matching a pattern
bun test --test-name-pattern "TaskRegistry"

# Lint (currently skipped)
bun run lint
```

### Build architecture

Two build targets:

- **Plugin** (`build:plugin`): `bun build src/index.ts src/tui.ts --outdir dist --target node --format esm`. External deps: `@ast-grep/napi`, `@opencode-ai/plugin`, `@opencode-ai/sdk`, `jsdom`, `zod`.
- **CLI** (`build:cli`): `bun build src/cli/index.ts --outdir dist/cli --target node --format esm`. Same external deps.

## Code Style

- **Language**: TypeScript with strict mode (`strict: true` in tsconfig)
- **Runtime**: Bun (esm modules, `type: "module"` in package.json)
- **Formatting**: Biome (configured at project root)
- **Naming**: camelCase for functions/variables, PascalCase for classes/types, kebab-case for files
- **Exports**: barrel exports via `index.ts` per module
- **Imports**: always use `.js` extension for local imports (Bun ESM convention)

## Project Structure

```
src/
├── __tests__/              # Integration tests
├── agents/                 # Agent definitions & factories
│   ├── council.ts          # Multi-LLM council agent
│   ├── councillor.ts       # Individual council participant
│   ├── designer.ts         # UI/UX design agent
│   ├── explorer.ts         # Codebase explorer agent
│   ├── fixer.ts            # Bug fixer agent
│   ├── index.ts            # Agent registry & wiring
│   ├── librarian.ts        # Documentation librarian agent
│   ├── observer.ts         # Passive observer agent
│   ├── oracle.ts           # Deep analysis oracle agent
│   └── orchestrator.ts     # Session orchestrator (default agent)
├── background/             # PersistentTaskEngine
│   ├── completion-detector.ts  # Dual-path event+poll detection
│   ├── index.ts
│   ├── persistent-task-engine.ts  # Core engine (SQLite-backed)
│   ├── reconstructor.ts    # Task recovery from session data
│   ├── types.ts
├── cli/                    # CLI commands
│   ├── commands/
│   │   ├── doctor.ts       # Health check command
│   │   ├── index.ts
│   │   └── install.ts      # Install command
│   └── index.ts
├── config/                 # Configuration loading & schema
│   ├── agent-mcps.ts
│   ├── constants.ts        # Agent names, loom presets, models
│   ├── index.ts
│   ├── loader.ts           # Config file loader (JSON/JSONC)
│   ├── runtime-preset.ts
│   └── schema.ts           # Zod schemas for all config sections
├── divoom/                 # Pixoo-64 display integration
│   ├── index.ts
│   ├── manager.ts
│   ├── manager.test.ts
│   └── types.ts
├── features/               # Feature modules
│   ├── index.ts
│   ├── team-mode/          # Parallel multi-agent coordination
│   └── tool-use-enforcer/  # MCP/skill usage enforcement
├── hooks/                  # Plugin hooks
│   ├── index.ts
│   ├── om-audit.ts         # /om-audit slash command
│   └── om-plan.ts          # /om-plan slash command
├── index.ts                # Main plugin entry point
├── interview/              # Web-based interview engine
├── mcp-bus/                # MCP integration bus
│   ├── index.ts
│   ├── mcp-bus.test.ts
│   └── types.ts
├── mcp/                    # MCP server definitions
├── openclaw/               # Discord/Telegram/HTTP gateway
│   ├── gateway.ts
│   ├── index.ts
│   ├── openclaw.test.ts
│   └── types.ts
├── persistence/            # SQLite task registry
│   ├── index.ts
│   ├── task-registry.ts
│   ├── task-registry.test.ts
│   └── types.ts
├── plugin/                 # Plugin types
│   └── types.ts
├── tools/                  # Custom tools
│   ├── ast-grep.ts
│   ├── council.ts
│   ├── council-wrapper.ts
│   ├── index.ts
│   ├── preset-manager.ts
│   ├── smartfetch/
│   └── subtask.ts
├── tui-state.ts
├── tui.ts
├── types/                  # Shared types
└── utils/                  # Utilities
    ├── display-name.ts
    ├── index.ts
    ├── logger.ts
    ├── persist.ts
    ├── session.ts
    └── system-collapse.ts
```

## Development Patterns

- **Feature modules** live in `src/features/{name}/` with their own `index.ts` exports. Each feature is self-contained.
- **Agents** are defined in `src/agents/` as factory functions producing `AgentDefinition` objects with model, prompt, tools, and MCP bindings.
- **Configuration** uses Zod schemas in `src/config/schema.ts` with JSON/JSONC file loading from `.opencode/oh-my-agents.{json,jsonc}`.
- **The Loom preset** (`preset: "loom"`) applies model routing: orchestrator→Ring 2.6 1T, oracle/council→Nemotron 3 Super, librarian/designer/observer→MiniMax M2.5, explorer→Big Pickle, fixer→DeepSeek V4 Flash.
- **Tests** use Bun's built-in test runner (`bun:test`). Test files are colocated or in `__tests__/`.

## Important Conventions

- NEVER use `console.log` in production code — use the `log()` function from `src/utils/logger.ts`
- Config validation uses Zod schemas defined in `src/config/schema.ts`
- The orchestrator is always the default agent; all other agents are subagents
- External packages must be listed in `external` in the bun build command
- MCP server names in `mcp-bus/index.ts` are the canonical identifiers used throughout the system

## Commands

- `/om-plan <phase>` — Assess→Assemble→Act→Improvise workflow
- `/om-audit <check>` — Multi-perspective code audit (architecture, quality, security, UX)
- `oh-my-unified install` — Install and configure in OpenCode
- `oh-my-unified doctor` — Run health diagnostics
