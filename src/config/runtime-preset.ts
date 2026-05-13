import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Runtime preset state manager.
 * Survives plugin re-inits triggered by client.config.update() → Instance.dispose().
 * State lives at module level and persists within the same Node.js process.
 */

let activeRuntimePreset: string | null = null;
let previousRuntimePreset: string | null = null;

export function setActiveRuntimePreset(name: string | null): void {
  previousRuntimePreset = activeRuntimePreset;
  activeRuntimePreset = name;
}

export function getActiveRuntimePreset(): string | null {
  return activeRuntimePreset;
}

export function getPreviousRuntimePreset(): string | null {
  return previousRuntimePreset;
}

export function rollbackRuntimePreset(previous: string | null): void {
  activeRuntimePreset = previous;
  previousRuntimePreset = null;
}

// Persist preset to disk so it survives process restarts within the same session
const PRESET_KEY = 'runtime-preset';

export function loadPersistedPreset(): string | null {
  try {
    const data = join(PERSIST_DIR, `${PRESET_KEY}.json`);
    if (!existsSync(data)) return null;
    const content = readFileSync(data, 'utf-8');
    return JSON.parse(content).preset || null;
  } catch {
    return null;
  }
}

const PERSIST_DIR = join(process.cwd(), '.opencode', 'oh-my-agents');