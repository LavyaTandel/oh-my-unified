import * as path from 'node:path';

export function getConfigSearchDirs(): string[] {
  const dirs: string[] = [];

  // XDG_CONFIG_HOME
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    dirs.push(xdgConfig);
  }

  // ~/.config/opencode
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    dirs.push(path.join(home, '.config', 'opencode'));
    dirs.push(path.join(home, '.config'));
  }

  // Current working directory
  dirs.push(process.cwd());

  return dirs;
}