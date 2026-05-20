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
export declare class IntegrationHub {
    private integrations;
    private webhooks;
    private handlers;
    registerIntegration(config: Omit<IntegrationConfig, 'createdAt'>): void;
    getIntegration(id: string): IntegrationConfig | undefined;
    getAllIntegrations(): IntegrationConfig[];
    enableIntegration(id: string): boolean;
    disableIntegration(id: string): boolean;
    registerHandler(integrationId: string, handler: (event: WebhookEvent) => Promise<void>): void;
    processWebhook(event: Omit<WebhookEvent, 'processed' | 'receivedAt'>): Promise<void>;
    getWebhooks(integrationId?: string, limit?: number): WebhookEvent[];
    getStats(): IntegrationStats;
    clear(): void;
}
export declare function createIntegrationHub(): IntegrationHub;
//# sourceMappingURL=index.d.ts.map