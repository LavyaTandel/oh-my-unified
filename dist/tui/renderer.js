import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'ink';
import { App } from './app';
import { log } from '../utils/logger';
let unmount = null;
export function startTui() {
    if (unmount)
        return;
    if (!process.stdout.isTTY) {
        log('[tui] skipping — not a TTY (desktop/server mode)');
        return;
    }
    try {
        const instance = render(_jsx(App, {}));
        unmount = instance.unmount;
        log('[tui] renderer started');
    }
    catch (err) {
        log('[tui] failed to start', { error: String(err) });
    }
}
export function stopTui() {
    if (unmount) {
        unmount();
        unmount = null;
        log('[tui] renderer stopped');
    }
}
export function isRunning() {
    return unmount !== null;
}
//# sourceMappingURL=renderer.js.map