export class OpenClawGateway {
    config;
    listeners = [];
    constructor(config) { this.config = config; }
    // Register a message listener
    onMessage(listener) { this.listeners.push(listener); }
    // Send a message to an external channel
    async send(msg) {
        // In v1: just log the outgoing message (actual HTTP/WS calls come later)
        console.log(`[OpenClaw] Send to ${msg.channel}: ${msg.content}`);
        return true;
    }
    // Start the gateway — set up listeners
    async start() {
        if (this.config.discord)
            console.log('[OpenClaw] Discord gateway configured (token present)');
        if (this.config.telegram)
            console.log('[OpenClaw] Telegram gateway configured (token present)');
        if (this.config.http)
            console.log('[OpenClaw] HTTP gateway configured (port:', this.config.http.port, ')');
    }
    // Stop the gateway
    async stop() { }
    // Check if gateway is active
    isActive() { return this.config.enabled; }
}
//# sourceMappingURL=gateway.js.map