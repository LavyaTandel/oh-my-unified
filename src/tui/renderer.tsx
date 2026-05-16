import { render } from 'ink';
import { App } from './app';
import { log } from '../utils/logger';

let unmount: (() => void) | null = null;

export function startTui(): void {
  if (unmount) return;
  if (!process.stdout.isTTY) {
    log('[tui] skipping — not a TTY (desktop/server mode)');
    return;
  }

  try {
    const instance = render(<App />);
    unmount = instance.unmount;
    log('[tui] renderer started');
  } catch (err) {
    log('[tui] failed to start', { error: String(err) });
  }
}

export function stopTui(): void {
  if (unmount) {
    unmount();
    unmount = null;
    log('[tui] renderer stopped');
  }
}

export function isRunning(): boolean {
  return unmount !== null;
}
