import * as fs from 'node:fs';
import * as path from 'node:path';
import { stripJsonComments } from '../cli/config-io';
import { PluginConfigSchema } from './schema';
import { AGENT_ALIASES, ALL_AGENT_NAMES, LOOM_PRESET, LOOM_MODEL_IDS } from './constants';
// ─── Config file loading ────────────────────────────────────────────────────
function loadConfigFromPath(configPath, options) {
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        let rawConfig;
        try {
            rawConfig = JSON.parse(stripJsonComments(content));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            options?.onWarning?.({
                path: configPath,
                kind: 'invalid-json',
                message,
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
                kind: 'invalid-schema',
                message: 'Config does not match schema',
                formatted: result.error.format(),
            });
            if (!options?.silent) {
                console.warn(`[oh-my-unified] Invalid config at ${configPath}:`);
                console.warn(result.error.format());
            }
            return null;
        }
        return result.data;
    }
    catch (error) {
        if (error instanceof Error &&
            'code' in error &&
            error.code !== 'ENOENT') {
            options?.onWarning?.({
                path: configPath,
                kind: 'read-error',
                message: error.message,
            });
            if (!options?.silent) {
                console.warn(`[oh-my-unified] Error reading config:`, error.message);
            }
        }
        return null;
    }
}
// ─── Loom preset injection ──────────────────────────────────────────────────
function injectLoomDefaults(config) {
    const LOOM_MODEL_IDS_TUPLE = LOOM_MODEL_IDS;
    const hasLoomModels = Object.values(config?.agents ?? {}).some((a) => typeof a === 'object' &&
        a !== null &&
        'model' in a &&
        (typeof a.model === 'string'
            ? LOOM_MODEL_IDS_TUPLE.includes(a.model)
            : Array.isArray(a.model) &&
                a.model.some((m) => LOOM_MODEL_IDS_TUPLE.includes(typeof m === 'string' ? m : m.id))));
    const isLoomPreset = config?.preset === 'loom';
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
// ─── Config path resolution ─────────────────────────────────────────────────
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
export function findPluginConfigPaths(directory) {
    const configDir = process.env.OPENCODE_CONFIG_DIR ||
        process.env.XDG_CONFIG_HOME ||
        path.join(process.env.HOME || '', '.config', 'opencode');
    const userConfigPath = findConfigPathInDirs([configDir, process.cwd()], 'oh-my-unified');
    const projectConfigPath = findConfigPath(path.join(directory, '.opencode', 'oh-my-unified'));
    return { userConfigPath, projectConfigPath };
}
// ─── Deep merge ─────────────────────────────────────────────────────────────
export function deepMerge(base, override) {
    if (!base)
        return override;
    if (!override)
        return base;
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const baseVal = base[key];
        const overrideVal = override[key];
        if (typeof baseVal === 'object' &&
            baseVal !== null &&
            typeof overrideVal === 'object' &&
            overrideVal !== null &&
            !Array.isArray(baseVal) &&
            !Array.isArray(overrideVal)) {
            result[key] = deepMerge(baseVal, overrideVal);
        }
        else {
            result[key] = overrideVal;
        }
    }
    return result;
}
// ─── Agent override resolution ──────────────────────────────────────────────
export function getAgentOverride(config, name) {
    const overrides = config?.agents ?? {};
    return (overrides[name] ??
        overrides[Object.keys(AGENT_ALIASES).find((k) => AGENT_ALIASES[k] === name) ?? '']);
}
export function getCustomAgentNames(config) {
    const overrides = config?.agents ?? {};
    return Object.keys(overrides).filter((name) => {
        if (AGENT_ALIASES[name] !== undefined)
            return false;
        return !ALL_AGENT_NAMES.includes(name);
    });
}
// ─── Main config loader ─────────────────────────────────────────────────────
export function loadPluginConfig(directory, options) {
    const { userConfigPath, projectConfigPath } = findPluginConfigPaths(directory);
    let config = userConfigPath
        ? loadConfigFromPath(userConfigPath, options)
        : null;
    if (!config) {
        config = {};
    }
    const projectConfig = projectConfigPath
        ? loadConfigFromPath(projectConfigPath, options)
        : null;
    if (projectConfig) {
        config = deepMerge(config, projectConfig);
    }
    // Migrate legacy tmux config to multiplexer
    if (config.tmux?.enabled && config.multiplexer?.type === 'none') {
        config.multiplexer = {
            type: 'tmux',
            layout: config.tmux.layout ?? 'main-vertical',
            main_pane_size: config.tmux.main_pane_size ?? 60,
        };
    }
    // Inject Loom defaults if Loom models or preset detected
    config = injectLoomDefaults(config);
    // Override preset from environment variable
    const envPreset = process.env.OH_MY_AGENTS_PRESET;
    if (envPreset) {
        config.preset = envPreset;
    }
    // Resolve preset and merge with root agents
    if (config.preset) {
        const preset = config.presets?.[config.preset];
        if (preset) {
            config.agents = deepMerge(preset, config.agents ?? {});
        }
        else {
            const presetSource = envPreset === config.preset ? 'environment variable' : 'config file';
            const availablePresets = config.presets
                ? Object.keys(config.presets).join(', ')
                : 'none';
            const message = `Preset "${config.preset}" not found (from ${presetSource}). Available presets: ${availablePresets}`;
            options?.onWarning?.({
                path: projectConfigPath ?? userConfigPath ?? '',
                kind: 'missing-preset',
                message,
            });
            if (!options?.silent) {
                console.warn(`[oh-my-unified] ${message}`);
            }
        }
    }
    return config;
}
//# sourceMappingURL=loader.js.map