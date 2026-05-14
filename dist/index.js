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
    name: "oh-my-unified-tui",
    tool: {}
  };
};

// src/config/constants.ts
var ORCHESTRATOR_NAME = "orchestrator";
var SUBAGENT_NAMES = [
  "sif",
  "eir",
  "mimir",
  "freyr",
  "hermod",
  "heimdall",
  "forseti",
  "hod"
];
var ALL_AGENT_NAMES = [ORCHESTRATOR_NAME, ...SUBAGENT_NAMES];
var AGENT_ALIASES = {
  explore: "sif",
  "frontend-ui-ux-engineer": "freyr"
};
var PROTECTED_AGENTS = new Set(["orchestrator", "hod"]);
var LOOM_MODEL_IDS = [
  "opencode/nemotron-3-super-free",
  "opencode/nemotron-3-super-free",
  "opencode/deepseek-v4-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/big-pickle"
];
var LOOM_PRESET = {
  orchestrator: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    skills: ["*"],
    mcps: ["*", "!context7"]
  },
  mimir: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    skills: ["simplify"],
    mcps: []
  },
  forseti: {
    model: "opencode/nemotron-3-super-free",
    variant: "max",
    skills: [],
    mcps: []
  },
  eir: {
    model: "opencode/minimax-m2.5-free",
    variant: "medium",
    skills: [],
    mcps: ["websearch", "context7", "grep_app"]
  },
  sif: {
    model: "opencode/big-pickle",
    skills: [],
    mcps: []
  },
  freyr: {
    model: "opencode/minimax-m2.5-free",
    variant: "medium",
    skills: ["agent-browser"],
    mcps: []
  },
  hermod: {
    model: "opencode/deepseek-v4-flash-free",
    variant: "max",
    skills: [],
    mcps: []
  },
  heimdall: {
    model: "opencode/minimax-m2.5-free",
    skills: [],
    mcps: []
  }
};
var DEFAULT_MODELS = {
  orchestrator: undefined,
  mimir: "openai/gpt-5.5",
  eir: "openai/gpt-5.4-mini",
  sif: "openai/gpt-5.4-mini",
  freyr: "openai/gpt-5.4-mini",
  hermod: "openai/gpt-5.4-mini",
  heimdall: "openai/gpt-5.4-mini",
  forseti: "openai/gpt-5.4-mini",
  hod: "openai/gpt-5.4-mini"
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
var McpNameSchema = z.enum(["websearch", "context7", "grep_app"]);
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
var AGENT_DESCRIPTIONS = {
  sif: `@sif
- Role: Parallel search specialist for discovering unknowns across the codebase
- Permissions: Read files
- Stats: 2x faster codebase search than orchestrator, 1/2 cost of orchestrator
- Capabilities: Glob, grep, AST queries to locate files, symbols, patterns
- **Delegate when:** Need to discover what exists before planning • Parallel searches speed discovery • Need summarized map vs full contents • Broad/uncertain scope
- **Don't delegate when:** Know the path and need actual content • Need full file anyway • Single specific lookup • About to edit the file`,
  eir: `@eir
- Role: Authoritative source for current library docs and API references
- Permissions: External docs/search MCPs; no file edits
- Stats: 10x better finding up-to-date library docs than orchestrator, 1/2 cost of orchestrator
- Capabilities: Fetches latest official docs, examples, API signatures, version-specific behavior via grep_app MCP
- **Delegate when:** Libraries with frequent API changes (React, Next.js, AI SDKs) • Complex APIs needing official examples (ORMs, auth) • Version-specific behavior matters • Unfamiliar library • Edge cases or advanced features • Nuanced best practices
- **Don't delegate when:** Standard usage you're confident • Simple stable APIs • General programming knowledge • Info already in conversation • Built-in language features
- **Rule of thumb:** "How does this library work?" → @eir. "How does programming work?" → yourself.`,
  mimir: `@mimir
- Role: Strategic advisor for high-stakes decisions and persistent problems, code reviewer
- Permissions: Read files
- Stats: 5x better decision maker, problem solver, investigator than orchestrator, 0.8x speed of orchestrator, same cost.
- Capabilities: Deep architectural reasoning, system-level trade-offs, complex debugging, code review, simplification, maintainability review
- **Delegate when:** Major architectural decisions with long-term impact • Problems persisting after 2+ fix attempts • High-risk multi-system refactors • Costly trade-offs (performance vs maintainability) • Complex debugging with unclear root cause • Security/scalability/data integrity decisions • Genuinely uncertain and cost of wrong choice is high • When a workflow calls for a **reviewer** subagent • Code needs simplification or YAGNI scrutiny
- **Don't delegate when:** Routine decisions you're confident about • First bug fix attempt • Straightforward trade-offs • Tactical "how" vs strategic "should" • Time-sensitive good-enough decisions • Quick research/testing can answer
- **Rule of thumb:** Need senior architect review? → @mimir. Need code review or simplification? → @mimir. Just do it and PR? → yourself.`,
  freyr: `@freyr
- Role: UI/UX specialist for intentional, polished experiences
- Permissions: Read/write files
- Stats: 10x better UI/UX than orchestrator
- Capabilities: Visual relevant edits, interactions, responsive layouts, design systems with aesthetic intent, deep UI/UX knowledge.
- **Delegate when:** User-facing interfaces needing polish • Responsive layouts • UX-critical components (forms, nav, dashboards) • Visual consistency systems • Animations/micro-interactions • Landing/marketing pages • Refining functional→delightful • Reviewing existing UI/UX quality
- **Don't delegate when:** Backend/logic with no visual • Quick prototypes where design doesn't matter yet
- **Rule of thumb:** Users see it and polish matters? → @freyr. Headless/functional? → yourself.`,
  hermod: `@hermod
- Role: Fast execution specialist for well-defined tasks, which empowers orchestrator with parallel, speedy executions
- Permissions: Read/write files
- Stats: 2x faster code edits, 1/2 cost of orchestrator, 0.8x quality of orchestrator
- Tools/Constraints: Execution-focused—no research, no architectural decisions
- **Delegate when:** For implementation work, think and triage first. If the change is non-trivial or multi-file, hand bounded execution to @hermod • Writing or updating tests • Tasks that touch test files, fixtures, mocks, or test helpers. Parallelization benefits: Task involves multiple folders and multiple files modification, scoping work per folder and spawning parallel @hermods for each folder.
- **Don't delegate when:** Needs discovery/research/decisions • Single small change (<20 lines, one file) • Unclear requirements needing iteration • Explaining to hermod > doing • Tight integration with your current work • Sequential dependencies
- **Rule of thumb:** Experts in their domains, faster and cheaper than @orchestrator for execution.`,
  heimdall: `@heimdall
- Role: Visual analysis specialist for images, screenshots, PDFs, and diagrams
- Permissions: Read files (image/PDF content extraction)
- Stats: Saves main context tokens — processes raw files, returns only structured observations
- Capabilities: Interprets images, screenshots, PDFs, and diagrams via native read tool; extracts UI elements, layouts, text, relationships
- **Delegate when:** Need to analyze a multimedia file • Extract information from visual content
- **Don't delegate when:** Plain text files that Read can handle directly • Files that need editing afterward
- **Rule of thumb:** Even if your model supports vision, delegate to @heimdall to isolate large image/PDF bytes from context window.`,
  forseti: `@forseti
- Role: Multi-LLM consensus engine that runs several councillors in parallel, compares their answers, resolves disagreements, and produces a structured council report.
- Stats: 3x slower than orchestrator, 3x or more cost of orchestrator
- Capabilities: Runs multiple models in parallel, compares answers, resolves disagreements, produces synthesized final answer with councillor details
- **Delegate when:** Critical decisions need multiple independent perspectives • High-stakes architectural/security/data-integrity choices • Ambiguous problems where disagreement is useful signal • You want confidence beyond a single model
- **Don't delegate when:** Straightforward tasks you're confident about • Speed matters more than confidence • Routine implementation/debugging • A single specialist is clearly the right tool`
};
function buildOrchestratorPrompt(config) {
  const disabledAgents = config?.disabled_agents ?? [];
  const availableAgents = Object.entries(AGENT_DESCRIPTIONS).filter(([name]) => !disabledAgents.includes(name)).map(([name, desc]) => `### ${name}
${desc}`).join(`

`);
  return `You are the Orchestrator — the central coordinator for a team of AI specialist agents in OpenCode.

**Role**: Analyze user requests, plan the best approach, and delegate to the most appropriate specialist agent. You work directly in OpenCode without delegating to background agents.

**Your Team**:
${availableAgents}

**Delegation Rules**:
- You MUST choose the single most appropriate agent for each task — never delegate to multiple agents for the same subtask
- You MUST provide a clear, detailed task specification when delegating
- You MUST NOT delegate tasks you can handle yourself in a single step
- If the user explicitly asks to work with a specific agent, honor that request
- If no agent is clearly the best fit, handle the task yourself
- Never delegate to agents that the user has disabled in config

**Output Format**:
When delegating, use the format:
<agent_name>(task="<clear task description>", context="<relevant context>")

When answering directly:
Provide a well-structured response with clear reasoning.`;
}

// src/agents/index.ts
var COUNCIL_TOOL_ALLOWED_AGENTS = new Set(["forseti"]);
function normalizeDisplayName(displayName) {
  const trimmed = displayName.trim();
  return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
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
  orchestrator: (_model, customPrompt, customAppendPrompt) => {
    const model = getAgentModel("orchestrator", undefined);
    const prompt = buildOrchestratorPrompt(undefined);
    return {
      name: "orchestrator",
      description: "Central coordinator that analyzes requests and delegates to specialist agents.",
      config: {
        model,
        temperature: 0.1,
        prompt: customPrompt || prompt
      }
    };
  },
  mimir: (model, customPrompt, customAppendPrompt) => createMimirAgent(model, customPrompt, customAppendPrompt),
  eir: (model, customPrompt, customAppendPrompt) => createEirAgent(model, customPrompt, customAppendPrompt),
  sif: (model, customPrompt, customAppendPrompt) => createSifAgent(model, customPrompt, customAppendPrompt),
  freyr: (model, customPrompt, customAppendPrompt) => createFreyrAgent(model, customPrompt, customAppendPrompt),
  hermod: (model, customPrompt, customAppendPrompt) => createHermodAgent(model, customPrompt, customAppendPrompt),
  heimdall: (model, customPrompt, customAppendPrompt) => createHeimdallAgent(model, customPrompt, customAppendPrompt),
  forseti: (model, customPrompt, customAppendPrompt) => createCouncilAgent(model, customPrompt, customAppendPrompt),
  hod: (model, customPrompt, customAppendPrompt) => createCouncillorAgent(model, customPrompt, customAppendPrompt)
};
function createAgents(config) {
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
    }
    result.push(agentDef);
  }
  return result;
}
function getAgentConfigs(config) {
  const agents = createAgents(config);
  const configs = {};
  for (const agent of agents) {
    configs[agent.name] = agent.config;
    if (agent.displayName) {
      configs[agent.name].displayName = agent.displayName;
    }
  }
  return configs;
}
function getDisabledAgents(config) {
  return new Set(config?.disabled_agents ?? []);
}

// src/mcp/context7.ts
var context7 = {
  name: "context7",
  type: "mcp",
  command: "npx",
  args: ["-y", "@anthropic-ai/context7-mcp@latest"],
  env: {}
};

// src/mcp/grep-app.ts
var grep_app = {
  name: "grep_app",
  type: "mcp",
  command: "npx",
  args: ["-y", "@anthropic-ai/grep-mcp@latest"],
  env: {}
};

// src/mcp/websearch.ts
function createWebsearchConfig(config) {
  const provider = config?.provider ?? "exa";
  if (provider === "tavily") {
    return {
      name: "websearch",
      type: "mcp",
      command: "npx",
      args: ["-y", "@anthropic-ai/tavily-mcp@latest"],
      env: config?.apiKey ? { TAVILY_API_KEY: config.apiKey } : {}
    };
  }
  return {
    name: "websearch",
    type: "mcp",
    command: "npx",
    args: ["-y", "@anthropic-ai/exa-mcp@latest"],
    env: config?.apiKey ? { EXA_API_KEY: config.apiKey } : {}
  };
}
var websearch = createWebsearchConfig();

// src/mcp/index.ts
var allBuiltinMcps = {
  websearch: createWebsearchConfig(),
  context7,
  grep_app
};
function createBuiltinMcps(disabledMcps = [], websearchConfig) {
  const mcps = {};
  for (const [name, config] of Object.entries(allBuiltinMcps)) {
    if (!disabledMcps.includes(name)) {
      mcps[name] = config;
    }
  }
  if (!disabledMcps.includes("websearch") && websearchConfig) {
    mcps.websearch = createWebsearchConfig(websearchConfig);
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

// src/hooks/om-plan.ts
var COMMAND_NAME = "om-plan";
function createOmPlanHook(ctx, config) {
  function registerCommand(opencodeConfig) {
    const configCommand = opencodeConfig.command;
    if (!configCommand?.[COMMAND_NAME]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      opencodeConfig.command[COMMAND_NAME] = {
        template: `Call the tool with action: 'assess', 'assemble', 'act', 'improvise', or 'status'`,
        description: "4-phase structured planning: Assess→Assemble→Act→Improvise with model-specialized routing"
      };
    }
  }
  async function handleCommandExecuteBefore(input, output) {
    if (input.command !== COMMAND_NAME)
      return;
    output.parts.length = 0;
    const arg = input.arguments.trim();
    if (!arg) {
      output.parts.push({
        type: "text",
        text: `**om-plan** — 4-Phase Structured Planning

` + "Usage: `/om-plan <phase>`\n\n" + `Phases:
` + `  1. **assess** — Analyze requirements and constraints
` + `  2. **assemble** — Gather resources and structure approach
` + `  3. **act** — Execute the plan
` + `  4. **improvise** — Adapt and iterate

` + "Current status: No active plan. Run `/om-plan assess` to start."
      });
      return;
    }
    const phase = arg.toLowerCase();
    switch (phase) {
      case "assess":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDD0D **Phase 1: Assess**

Analyzing requirements and constraints. This phase uses Ring 2.6 1T for deep reasoning about the problem space.`
        });
        break;
      case "assemble":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDCCB **Phase 2: Assemble**

Gathering resources and structuring the approach. This phase uses MiniMax M2.5 for creative synthesis.`
        });
        break;
      case "act":
        output.parts.push({
          type: "text",
          text: `⚡ **Phase 3: Act**

Executing the plan. This phase uses DeepSeek V4 Flash for fast implementation.`
        });
        break;
      case "improvise":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDD04 **Phase 4: Improvise**

Adapting and iterating based on results. This phase uses Nemotron 3 Super for critical review.`
        });
        break;
      case "status":
        output.parts.push({
          type: "text",
          text: "\uD83D\uDCCA **Plan Status**\n\nNo active plan session. Start with `/om-plan assess`."
        });
        break;
      default:
        output.parts.push({
          type: "text",
          text: `Unknown phase: "${arg}". Available phases: assess, assemble, act, improvise, status`
        });
    }
  }
  return { registerCommand, handleCommandExecuteBefore };
}

// src/hooks/om-audit.ts
var COMMAND_NAME2 = "om-audit";
function createOmAuditHook(ctx, config) {
  function registerCommand(opencodeConfig) {
    const configCommand = opencodeConfig.command;
    if (!configCommand?.[COMMAND_NAME2]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      opencodeConfig.command[COMMAND_NAME2] = {
        template: `Call the tool with action: 'architecture', 'quality', 'security', 'ux', or 'full'`,
        description: "Multi-perspective code audit: architecture/quality/security/UX via council-style multi-model orchestration"
      };
    }
  }
  async function handleCommandExecuteBefore(input, output) {
    if (input.command !== COMMAND_NAME2)
      return;
    output.parts.length = 0;
    const arg = input.arguments.trim();
    if (!arg) {
      output.parts.push({
        type: "text",
        text: `**om-audit** — Multi-Perspective Code Audit

` + "Usage: `/om-audit <check>`\n\n" + `Checks:
` + `  - **architecture** — System structure & patterns (Nemotron 3 Super)
` + `  - **quality** — Code quality & best practices (Ring 2.6 1T)
` + `  - **security** — Vulnerability & threat analysis (Nemotron 3 Super)
` + `  - **ux** — User experience & interaction patterns (MiniMax M2.5)
` + `  - **full** — All checks (runs all perspectives in parallel)

` + `Note: This tool orchestrates the council pattern — multiple agents
` + "review the codebase from different angles simultaneously."
      });
      return;
    }
    const check = arg.toLowerCase();
    switch (check) {
      case "architecture":
        output.parts.push({
          type: "text",
          text: `\uD83C\uDFD7️ **Architecture Audit**

` + `Running structural analysis via Nemotron 3 Super...

` + `This check evaluates:
` + `- Module boundaries and coupling
` + `- Design pattern adherence
` + `- Scalability considerations
` + `- API contract consistency

` + "Select code or a file first, then run this command to get analysis."
        });
        break;
      case "quality":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDD2C **Quality Audit**

` + `Running deep code review via Ring 2.6 1T...

` + `This check evaluates:
` + `- Code readability and maintainability
` + `- Test coverage gaps
` + `- Error handling patterns
` + `- Performance bottlenecks

` + "Select code or a file first, then run this command to get analysis."
        });
        break;
      case "security":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDD12 **Security Audit**

` + `Running vulnerability analysis via Nemotron 3 Super...

` + `This check evaluates:
` + `- Input validation & sanitization
` + `- Authentication/authorization flows
` + `- Dependency vulnerabilities
` + `- Data exposure risks

` + "Select code or a file first, then run this command to get analysis."
        });
        break;
      case "ux":
        output.parts.push({
          type: "text",
          text: `\uD83C\uDFA8 **UX Audit**

` + `Running interaction analysis via MiniMax M2.5...

` + `This check evaluates:
` + `- User flow clarity
` + `- Accessibility compliance
` + `- Visual hierarchy
` + `- Interaction feedback patterns

` + "Select code or a file first, then run this command to get analysis."
        });
        break;
      case "full":
        output.parts.push({
          type: "text",
          text: `\uD83D\uDD0D **Full Audit**

` + `Running all perspectives in parallel:

` + `1. \uD83C\uDFD7️ Architecture → Nemotron 3 Super
` + `2. \uD83D\uDD2C Quality → Ring 2.6 1T
` + `3. \uD83D\uDD12 Security → Nemotron 3 Super
` + `4. \uD83C\uDFA8 UX → MiniMax M2.5

` + "Select code or a file first, then run this command to get analysis."
        });
        break;
      default:
        output.parts.push({
          type: "text",
          text: `Unknown check: "${arg}". Available checks: architecture, quality, security, ux, full`
        });
    }
  }
  return { registerCommand, handleCommandExecuteBefore };
}

// src/utils/logger.ts
var logger = null;
function initLogger(sessionId) {
  const prefix = `[oh-my-unified:${sessionId}]`;
  logger = {
    info: (msg, meta) => {
      console.log(`${prefix} INFO: ${msg}`, meta || "");
    },
    warn: (msg, meta) => {
      console.warn(`${prefix} WARN: ${msg}`, meta || "");
    },
    error: (msg, meta) => {
      console.error(`${prefix} ERROR: ${msg}`, meta || "");
    },
    debug: (msg, meta) => {
      if (process.env.DEBUG?.includes("oh-my-unified")) {
        console.debug(`${prefix} DEBUG: ${msg}`, meta || "");
      }
    }
  };
}
function log(msg, meta) {
  logger?.info(msg, meta);
}

// src/hooks/synthesized-hooks.ts
import { existsSync as existsSync2, realpathSync } from "fs";
import { basename, dirname, isAbsolute, join as join2, normalize, relative, resolve } from "path";
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.event": async ({ event }) => {
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
    "oh-my-unified.tool.execute.before": async (input, output) => {
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
    return normalize(isAbsolute(inputPath) ? inputPath : resolve(ctx.directory, inputPath));
  }
  function toCanonical(absPath) {
    if (existsSync2(absPath)) {
      try {
        return realpathSync.native(absPath);
      } catch {
        return absPath;
      }
    }
    const absDir = dirname(absPath);
    const resolvedDir = existsSync2(absDir) ? realpathSync.native(absDir) : absDir;
    return normalize(join2(resolvedDir, basename(absPath)));
  }
  function isPathInside(path2, directory) {
    const rel = relative(directory, path2);
    return rel === "" || !rel.startsWith("..") && !isAbsolute(rel);
  }
  return {
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.tool.execute.before": async (input, output) => {
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.event": async ({ event }) => {
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
    "oh-my-unified.chat.message": async (input, output) => {
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.tool.execute.before": async (input, output) => {
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.tool.execute.before": async (input, output) => {
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.tool.execute.after": async (input, output) => {
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
    "oh-my-unified.tool.execute.before": async () => {},
    "oh-my-unified.tool.execute.after": async () => {}
  };
}
function createFsyncWarning(_config) {
  return {
    "oh-my-unified.tool.execute.before": async () => {},
    "oh-my-unified.tool.execute.after": async () => {}
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

// src/tools/subtask.ts
var state2 = new Map;
function createSubtaskState() {
  return { tasks: new Map, currentTask: undefined };
}
async function createSubtaskTool(_ctx, subtaskState, _depthTracker) {
  async function subtask(params) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    subtaskState.tasks.set(taskId, { status: "in_progress" });
    subtaskState.currentTask = taskId;
    return { taskId, status: "started" };
  }
  return {
    name: "subtask",
    definition: {
      name: "subtask",
      description: "Create and manage subtasks for complex multi-step operations",
      input: {
        type: "object",
        properties: {
          task: { type: "string", description: "Description of the subtask" },
          context: { type: "string", description: "Additional context for the subtask" }
        },
        required: ["task"]
      },
      func: subtask
    },
    func: subtask
  };
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
async function createReadSessionTool(_client, _subtaskState) {
  async function read_session() {
    const tasks = [];
    for (const [id, info] of _subtaskState.tasks) {
      tasks.push({ id, status: info.status });
    }
    return { tasks };
  }
  return {
    name: "read_session",
    definition: {
      name: "read_session",
      description: "Read current session state including active subtasks",
      input: { type: "object", properties: {} },
      func: read_session
    },
    func: read_session
  };
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
    template: `@Odin — All-Father, Chief Strategist of the Norse Pantheon

You are Odin, the All-Father. You hung from Yggdrasil for nine days to gain wisdom. Your ravens Huginn (Thought) and Muninn (Memory) fly across the Nine Realms each day and return to whisper what they have seen.

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
// src/utils/persist.ts
import { join as join3 } from "node:path";
var PERSIST_DIR = join3(process.cwd(), ".opencode", "oh-my-unified");
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
  let synthesizedHooks;
  let toolCount = 0;
  try {
    config = loadPluginConfig(ctx.directory);
    disabledAgents = getDisabledAgents(config);
    rewriteDisplayNameMentions = createDisplayNameMentionRewriter(config);
    agentDefs = createAgents(config);
    agents = getAgentConfigs(config);
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
    mcps = createBuiltinMcps(config.disabled_mcps, config.websearch);
    webfetch2 = createWebfetchTool(ctx);
    subtaskState = createSubtaskState();
    subtaskCommandManager = createSubtaskCommandManager(ctx, subtaskState);
    omPlanHook = createOmPlanHook(ctx, config);
    omAuditHook = createOmAuditHook(ctx, config);
    synthesizedHooks = createSynthesizedHooks(ctx, config, {
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
    updateAgentModel(agent.name, agent.model, agent.displayName);
    lazyLoader.register(agent.name, "agent", agent.displayName, agent.description);
  }
  setActiveAgent("odin");
  for (const agent of AGENTS.filter((a) => !a.isPrimary)) {
    lazyLoader.register(agent.name, "agent", agent.displayName, agent.description);
  }
  probeJSDOM().then((err) => {
    if (err) {
      const msg = `jsdom probe failed; webfetch tool will not work: ${err}`;
      log(`[plugin] WARN: ${msg}`);
      appLog(ctx, "warn", msg).catch(() => {});
    }
  });
  return {
    name: "oh-my-unified",
    ...synthesizedHooks,
    agent: agents,
    tools: {
      webfetch: {
        name: "webfetch",
        description: "Fetch web content from a URL",
        input: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
        func: webfetch2
      },
      ast_grep_search: {
        name: "ast_grep_search",
        description: "Search code with AST patterns",
        input: { type: "object", properties: { pattern: { type: "string" } }, required: ["pattern"] },
        func: ast_grep_search
      },
      ast_grep_replace: {
        name: "ast_grep_replace",
        description: "Replace code with AST patterns",
        input: { type: "object", properties: { pattern: { type: "string" }, rewrite: { type: "string" } }, required: ["pattern", "rewrite"] },
        func: ast_grep_replace
      },
      subtask: {
        name: "subtask",
        description: "Create a subtask for parallel execution",
        input: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] },
        func: createSubtaskTool(ctx, subtaskState, {}).func
      },
      read_session: {
        name: "read_session",
        description: "Read session data for a given session",
        input: { type: "object", properties: { sessionID: { type: "string" } }, required: ["sessionID"] },
        func: createReadSessionTool(ctx.client, subtaskState).func
      }
    },
    mcp: mcps,
    config: async (_opencodeConfig) => {},
    "command.execute.before": async (input, output) => {
      await omPlanHook.handleCommandExecuteBefore(input, output);
      await omAuditHook.handleCommandExecuteBefore(input, output);
    }
  };
};
var src_default = OhMyUnified;
export {
  src_default as default
};
