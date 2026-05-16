import { log } from '../../utils/logger';

export type IntegrationType = 'github' | 'jira' | 'slack' | 'webhook';

export interface IntegrationConfig {
  id: string;
  type: IntegrationType;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
  createdAt: number;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  eventType: string;
  payload: unknown;
  receivedAt: number;
  processed: boolean;
}

export interface IntegrationStats {
  totalIntegrations: number;
  enabledIntegrations: number;
  byType: Record<string, number>;
  totalWebhooks: number;
  processedWebhooks: number;
}

export class IntegrationHub {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private webhooks: WebhookEvent[] = [];
  private handlers: Map<string, (event: WebhookEvent) => Promise<void>> = new Map();

  registerIntegration(config: Omit<IntegrationConfig, 'createdAt'>): void {
    const fullConfig: IntegrationConfig = {
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

  getIntegration(id: string): IntegrationConfig | undefined {
    return this.integrations.get(id);
  }

  getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  enableIntegration(id: string): boolean {
    const config = this.integrations.get(id);
    if (!config) return false;
    config.enabled = true;
    return true;
  }

  disableIntegration(id: string): boolean {
    const config = this.integrations.get(id);
    if (!config) return false;
    config.enabled = false;
    return true;
  }

  registerHandler(integrationId: string, handler: (event: WebhookEvent) => Promise<void>): void {
    this.handlers.set(integrationId, handler);
  }

  async processWebhook(event: Omit<WebhookEvent, 'processed' | 'receivedAt'>): Promise<void> {
    const fullEvent: WebhookEvent = {
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
      } catch (err) {
        log('[integration-hub] webhook processing failed', {
          id: fullEvent.id,
          error: String(err),
        });
      }
    }
  }

  getWebhooks(integrationId?: string, limit = 50): WebhookEvent[] {
    const filtered = integrationId
      ? this.webhooks.filter(w => w.integrationId === integrationId)
      : this.webhooks;

    return filtered.slice(-limit);
  }

  getStats(): IntegrationStats {
    const allIntegrations = this.getAllIntegrations();
    const enabledIntegrations = allIntegrations.filter(i => i.enabled);

    const byType: Record<string, number> = {};
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

  clear(): void {
    this.integrations.clear();
    this.webhooks = [];
    this.handlers.clear();
  }
}

export function createIntegrationHub(): IntegrationHub {
  return new IntegrationHub();
}
