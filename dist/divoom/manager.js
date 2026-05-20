const DEFAULT_CONFIG = {
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 3,
};
/**
 * DivoomManager simulates controlling a Divoom Pixoo-64 display.
 *
 * In v1 the class logs status changes to the console. A future version
 * will send real UDP commands to the physical device.
 */
export class DivoomManager {
    _connectionState = 'disconnected';
    _deviceInfo = null;
    config;
    reconnectAttempts = 0;
    reconnectTimer = null;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // ── Connection ──────────────────────────────────────────────────
    /** Simulate connecting to the Divoom device. */
    async connect() {
        if (this._connectionState === 'connected') {
            console.log('[Divoom] Already connected');
            return this._deviceInfo;
        }
        this._connectionState = 'connecting';
        console.log('[Divoom] Connecting…');
        // Simulate a short handshake delay
        await new Promise(resolve => setTimeout(resolve, 50));
        this._connectionState = 'connected';
        this.reconnectAttempts = 0;
        this._deviceInfo = {
            model: 'Pixoo-64',
            firmware: '2.4.0',
            mac: 'AA:BB:CC:DD:EE:FF',
        };
        console.log('[Divoom] Connected —', this._deviceInfo.model);
        return this._deviceInfo;
    }
    /** Disconnect from the Divoom device. */
    async disconnect() {
        if (this._connectionState === 'disconnected') {
            console.log('[Divoom] Already disconnected');
            return;
        }
        this._connectionState = 'disconnected';
        this._deviceInfo = null;
        this.clearReconnectTimer();
        console.log('[Divoom] Disconnected');
    }
    // ── Status update ───────────────────────────────────────────────
    /** Send a status update to the display (simulated via console). */
    async updateStatus(status) {
        if (!this.isConnected()) {
            console.warn('[Divoom] Cannot update status — not connected');
            return;
        }
        const bar = renderProgressBar(status.progress);
        const lines = [
            `[Divoom] ═══════ Display Update ═══════`,
            `  Agent  : ${status.agentName}`,
            `  Tasks  : ${status.taskCount}`,
            `  ${bar} ${status.progress}%`,
        ];
        if (status.message)
            lines.push(`  Msg    : ${status.message}`);
        lines.push(`  ───────────────────────────────`);
        console.log(lines.join('\n'));
    }
    // ── Queries ─────────────────────────────────────────────────────
    /** Whether the manager is currently connected to the device. */
    isConnected() {
        return this._connectionState === 'connected';
    }
    /** The current connection state. */
    get connectionState() {
        return this._connectionState;
    }
    /** Connected device info (null if not connected). */
    get deviceInfo() {
        return this._deviceInfo;
    }
    // ── Reconnection ────────────────────────────────────────────────
    /** Attempt to reconnect after a disconnection. */
    async reconnect() {
        if (this._connectionState === 'connected') {
            return this._deviceInfo;
        }
        this.reconnectAttempts++;
        if (this.reconnectAttempts > this.config.maxReconnectAttempts) {
            this._connectionState = 'error';
            throw new Error(`[Divoom] Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`);
        }
        console.log(`[Divoom] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}…`);
        return this.connect();
    }
    /** Schedule an automatic reconnection attempt. */
    scheduleReconnect() {
        if (this.reconnectTimer !== null)
            return;
        console.log(`[Divoom] Scheduling reconnect in ${this.config.reconnectDelayMs}ms…`);
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            try {
                await this.reconnect();
            }
            catch (err) {
                console.error('[Divoom] Reconnect failed:', err.message);
            }
        }, this.config.reconnectDelayMs);
    }
    // ── Internal ────────────────────────────────────────────────────
    clearReconnectTimer() {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
// ── Helpers ────────────────────────────────────────────────────────
function renderProgressBar(progress, width = 10) {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    const filled = Math.round((clamped / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
//# sourceMappingURL=manager.js.map