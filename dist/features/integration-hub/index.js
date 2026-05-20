import { log } from '../../utils/logger';
export class IntegrationHub {
    integrations = new Map();
    webhooks = [];
    handlers = new Map();
    registerIntegration(config) {
        const fullConfig = {
            ...config,
            createdAt: Date.now(),
        };
        this.integrations.set(config.id, fullConfig);
        log('[integration-hub] registered', {
            id: config.id,
            type: config.type,
            name: config.name,
        });
    }
    getIntegration(id) {
        return this.integrations.get(id);
    }
    getAllIntegrations() {
        return Array.from(this.integrations.values());
    }
    enableIntegration(id) {
        const config = this.integrations.get(id);
        if (!config)
            return false;
        config.enabled = true;
        return true;
    }
    disableIntegration(id) {
        const config = this.integrations.get(id);
        if (!config)
            return false;
        config.enabled = false;
        return true;
    }
    registerHandler(integrationId, handler) {
        this.handlers.set(integrationId, handler);
    }
    async processWebhook(event) {
        const fullEvent = {
            ...event,
            receivedAt: Date.now(),
            processed: false,
        };
        this.webhooks.push(fullEvent);
        const handler = this.handlers.get(event.integrationId);
        if (handler) {
            try {
                await handler(fullEvent);
                fullEvent.processed = true;
                log('[integration-hub] webhook processed', {
                    id: fullEvent.id,
                    integrationId: fullEvent.integrationId,
                    eventType: fullEvent.eventType,
                });
            }
            catch (err) {
                log('[integration-hub] webhook processing failed', {
                    id: fullEvent.id,
                    error: String(err),
                });
            }
        }
    }
    getWebhooks(integrationId, limit = 50) {
        const filtered = integrationId
            ? this.webhooks.filter(w => w.integrationId === integrationId)
            : this.webhooks;
        return filtered.slice(-limit);
    }
    getStats() {
        const allIntegrations = this.getAllIntegrations();
        const enabledIntegrations = allIntegrations.filter(i => i.enabled);
        const byType = {};
        for (const integration of allIntegrations) {
            byType[integration.type] = (byType[integration.type] ?? 0) + 1;
        }
        const processedWebhooks = this.webhooks.filter(w => w.processed).length;
        return {
            totalIntegrations: allIntegrations.length,
            enabledIntegrations: enabledIntegrations.length,
            byType,
            totalWebhooks: this.webhooks.length,
            processedWebhooks,
        };
    }
    clear() {
        this.integrations.clear();
        this.webhooks = [];
        this.handlers.clear();
    }
}
export function createIntegrationHub() {
    return new IntegrationHub();
}
//# sourceMappingURL=index.js.map