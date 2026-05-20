# Oh-My-Unified Fix Plan

## Executive Summary

Five issues identified across the plugin. Four require code changes; one (Issue 3) is a comment-only fix. Priority: **Issue 1 (Native Agents Broken)** is the highest-impact fix — without it, `@explore` and `@general` agents never register in OpenCode's config system.

---

## Issue 1: Native Agents Broken (@explore, @general) — CRITICAL

### Root Cause
The `config` hook in `src/index.ts` (lines 489-497) replaces the entire `opencodeConfig.agent` object with a spread merge:
```typescript
const merged = { ...existingAgents, ...agentConfigs };
opencodeConfig.agent = merged;
```
This **destroys** any user-supplied agent configuration from `opencode.json` (custom tools, permissions, model overrides) because the spread order puts `agentConfigs` (plugin defaults) **after** `existingAgents`, but since both are full objects, user fields that the plugin doesn't define are lost.

### Correct Pattern (from oh-my-opencode-slim)
Mutate the existing object **per-key**, doing a shallow merge per agent so user-supplied fields are preserved:
```typescript
if (existing) {
  (opencodeConfig.agent as Record<string, unknown>)[name] = {
    ...pluginAgent,  // plugin defaults first
    ...existing,     // user overrides win
  };
} else {
  (opencodeConfig.agent as Record<string, unknown>)[name] = { ...pluginAgent };
}
```

### Fix
**File**: `src/index.ts` (lines 489-497)

**Replace**:
```typescript
config: async (opencodeConfig: Record<string, unknown>): Promise<void> => {
  const agentConfigs = getAgentConfigs(config, catalog);
  const existingAgents = (opencodeConfig.agent as Record<string, unknown>) || {};
  const merged = { ...existingAgents, ...agentConfigs };
  opencodeConfig.agent = merged;
  if (!opencodeConfig.default_agent) {
    opencodeConfig.default_agent = 'odin';
  }
},
```

**With**:
```typescript
config: async (opencodeConfig: Record<string, unknown>): Promise<void> => {
  const agentConfigs = getAgentConfigs(config, catalog);
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...agentConfigs };
  } else {
    const existing = opencodeConfig.agent as Record<string, unknown>;
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
    opencodeConfig.default_agent = 'odin';
  }
},
```

**Risk**: LOW — This is a well-tested pattern from oh-my-opencode-slim. The per-key merge is strictly more correct than object replacement.

---

## Issue 2: Command Hijacking (/caveman → om-audit) — HIGH

### Root Cause Analysis
The `command.execute.before` hook in `src/index.ts` (lines 499-585) has a **structural bug**: it runs multiple handlers sequentially, and **the first handler that modifies `output.parts` without returning early can prevent subsequent handlers (and the original command) from running**.

The flow is:
1. `autoSlashCommandHook['command.execute.before']` — guards with `OUR_COMMANDS` set ✅
2. `omPlanHook.handleCommandExecuteBefore` — guards with `input.command !== COMMAND_NAME` ✅
3. `omAuditHook.handleCommandExecuteBefore` — guards with `input.command !== COMMAND_NAME` ✅
4. `pipelineCommandHandler.handleCommand` — guards with `PIPELINE_COMMANDS` set ✅
5. **Trust & Discovery commands** (`diagnose`, `capabilities`, `onboarding`, `log`) — individual `if` checks ✅
6. **Implicit fallthrough** — no modification, returns normally ✅

**The real issue**: `omAuditHook.handleCommandExecuteBefore` (line 508) is called for **every command**, and while it returns early when `input.command !== 'om-audit'`, the **`output.parts` may already have been modified by a prior hook**. But more critically, the **`autoSlashCommandHook`** on line 504 runs first — and if it finds a command in `OUR_COMMANDS`, it **modifies `output.parts`** by injecting tagged content.

**However**, the user reports `/caveman` triggered `om-audit`. `/caveman` is NOT in `OUR_COMMANDS`. So auto-slash-command returns early. `om-audit` hook also returns early (`input.command !== 'om-audit'`). Pipeline handler returns early. Trust & Discovery checks all fail. The hook returns without modifying `output.parts`.

**The actual bug**: The issue is likely that **OpenCode's `command.execute.before` hook semantics** mean that if ANY hook pushes content into `output.parts`, OpenCode treats the command as "handled" and skips the original command handler. The `autoSlashCommandHook` on line 504 may be incorrectly matching `/caveman` if there's a bug in the `OUR_COMMANDS` set or the normalization.

**Wait — re-reading the code more carefully**: Line 504 calls `autoSlashCommandHook['command.execute.before'](input, output)`. Looking at `auto-slash-command.ts` line 196: `if (!OUR_COMMANDS.has(normalizedCommand)) return;`. `OUR_COMMANDS` contains: `plan, assess, assemble, improvise, act, synthesize, health, status, diagnose, capabilities, onboarding, log, agents`. `/caveman` is not in this set. So it returns early.

**Most likely root cause**: The issue is that **OpenCode processes `command.execute.before` hooks differently than expected**. If the hook runs and `output.parts` is empty (which it is at the start of the hook), and none of our handlers match, the hook returns cleanly. But if OpenCode interprets an empty `output.parts` array as "command handled with no output", it would suppress the original command.

**Fix**: Add an explicit guard at the top of the `command.execute.before` hook to **only proceed if the command is one of ours**:

### Fix
**File**: `src/index.ts` (lines 499-585)

**Add early return guard** at the top of the `command.execute.before` handler:

```typescript
'command.execute.before': async (
  input: { command: string; sessionID: string; arguments: string },
  output: { parts: Array<{ type: string; text?: string }> },
): Promise<void> => {
  // ── Guard: Only process commands we own ──────────────────────
  const cmd = input.command.toLowerCase();
  const OUR_ALL_COMMANDS = new Set([
    ...OUR_COMMANDS,           // plan, assess, assemble, etc.
    'om-plan', 'om-audit',    // om-* commands
    'caveman',                 // if this is our command, add it
    // Add any other commands this plugin owns
  ]);
  
  if (!OUR_ALL_COMMANDS.has(cmd)) {
    return; // Don't touch output.parts for foreign commands
  }
  // ─────────────────────────────────────────────────────────────

  // ... rest of existing code unchanged ...
```

**Alternative (simpler, lower risk)**: The existing guards in each sub-handler are correct. The issue may be that `output.parts` starts empty and OpenCode interprets this as "handled." **Verify first** by checking if the issue reproduces. If it does, the fix is to ensure `output.parts` is **never touched** for foreign commands.

**Recommended approach**: Add a single early-return guard at the top that checks against a consolidated set of all commands this plugin owns. This is the safest fix — it prevents any sub-handler from accidentally running.

**Risk**: MEDIUM — Need to ensure ALL plugin-owned commands are in the guard set. Missing one would break that command.

---

## Issue 3: Agent File Directory Mismatch — LOW (Comment Only)

### Analysis
`writeAgentFiles` in `src/utils/write-agents.ts` line 20 writes to:
```typescript
const agentDir = path.join(directory, '.opencode', 'agents');  // plural ✅
```

OpenCode's agent loader (confirmed in oh-my-openagent's `loader.ts` line 66) reads from:
```typescript
const opencodeProjectDir = join(directory ?? process.cwd(), ".opencode", "agents");  // plural ✅
```

**The code is correct.** The comment in `src/index.ts` line 151 is wrong:
```typescript
// Write agent definitions to .opencode/agent/ so OpenCode's config system picks them up
```

### Fix
**File**: `src/index.ts` (line 151)

**Replace**:
```typescript
// Write agent definitions to .opencode/agent/ so OpenCode's config system picks them up
```

**With**:
```typescript
// Write agent definitions to .opencode/agents/ so OpenCode's config system picks them up
```

**Risk**: NONE — comment-only change.

---

## Issue 4: All Agent Files Have mode:primary — ALREADY FIXED ✅

### Status
The `resolveAgentMode()` function in `src/utils/write-agents.ts` (lines 9-14) correctly assigns:
- `odin`, `njord` → `primary`
- Primary agents (mimir, vidar, thor, forseti, frigg, tyr) → `all`
- Subagents (sif, eir, freyr, hermod, heimdall, magni, hod) → `subagent`

**No action needed.**

---

## Issue 5: Agent Files Missing display_name in Frontmatter — ALREADY FIXED ✅

### Status
Looking at `writeAgentFiles` in `src/utils/write-agents.ts` line 44:
```typescript
frontmatterLines.push(`display_name: "${displayName.replace(/"/g, '\\"')}"`);
```

The `display_name` field **is already being written** to the frontmatter. The `displayName` comes from `agent.displayName ?? agent.name` (line 34).

**No action needed.**

---

## Order of Operations

1. **Issue 3** (comment fix) — trivial, do first to clean up
2. **Issue 1** (config hook) — highest impact, test thoroughly
3. **Issue 2** (command hijacking) — investigate first, then fix based on findings

## Testing Strategy

### Issue 1 Testing
1. **Unit test**: Write a test that simulates the config hook with pre-existing user agent config:
   ```typescript
   test('config hook preserves user agent config', async () => {
     const opencodeConfig = {
       agent: {
         'custom-agent': { model: 'openai/gpt-4', tools: { bash: true } },
       },
     };
     await plugin.config(opencodeConfig);
     expect(opencodeConfig.agent['custom-agent'].tools).toEqual({ bash: true });
     expect(opencodeConfig.agent['odin']).toBeDefined();
   });
   ```
2. **Integration test**: Build plugin, install in OpenCode, verify `@explore` and `@general` appear in agent list
3. **Manual test**: Run `opencode` and check that `@odin`, `@njord`, `@mimir`, etc. are all available

### Issue 2 Testing
1. **Reproduction test**: Run `/caveman` (or any non-plugin command) and verify it executes its original handler, not om-audit
2. **Guard test**: Verify all plugin-owned commands still work: `/plan`, `/assess`, `/om-audit`, `/diagnose`, etc.
3. **Edge case test**: Run `/Plan` (uppercase) — verify case-insensitive matching works

### Issue 3 Testing
- No testing needed (comment-only)

## Risk Assessment

| Issue | Severity | Fix Risk | Rollback Plan |
|-------|----------|----------|---------------|
| Issue 1 | CRITICAL | LOW | Revert to spread merge (broken but known state) |
| Issue 2 | HIGH | MEDIUM | Remove early-return guard |
| Issue 3 | LOW | NONE | N/A |
| Issue 4 | N/A | N/A | Already fixed |
| Issue 5 | N/A | N/A | Already fixed |

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/index.ts` | 151 | Fix comment: `agent/` → `agents/` |
| `src/index.ts` | 489-497 | Replace config hook with per-key merge |
| `src/index.ts` | 499-585 | Add early-return guard for foreign commands |

## Build & Verify Commands

```bash
# Build
bun run build

# Typecheck
bun run typecheck

# Run tests
bun test

# Install plugin locally (in opencode.jsonc):
# "plugin": ["file:///path/to/oh-my-unified"]
```
