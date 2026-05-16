import { describe, test, expect, beforeEach } from 'bun:test';
import { IntegrationHub, createIntegrationHub } from './index';

describe('IntegrationHub', () => {
  let hub: IntegrationHub;

  beforeEach(() => {
    hub = createIntegrationHub();
  });

  test('registers integration', () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: { token: 'test-token' },
    });

    const integration = hub.getIntegration('github');
    expect(integration).toBeDefined();
    expect(integration?.type).toBe('github');
  });

  test('enables and disables integration', () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    hub.disableIntegration('github');
    expect(hub.getIntegration('github')?.enabled).toBe(false);

    hub.enableIntegration('github');
    expect(hub.getIntegration('github')?.enabled).toBe(true);
  });

  test('processes webhook', async () => {
    let processed = false;

    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    hub.registerHandler('github', async (event) => {
      processed = true;
    });

    await hub.processWebhook({
      id: 'wh1',
      integrationId: 'github',
      eventType: 'push',
      payload: { ref: 'refs/heads/main' },
    });

    expect(processed).toBe(true);

    const webhooks = hub.getWebhooks('github');
    expect(webhooks.length).toBe(1);
    expect(webhooks[0].processed).toBe(true);
  });

  test('handles webhook processing failure', async () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    hub.registerHandler('github', async () => {
      throw new Error('Processing failed');
    });

    await hub.processWebhook({
      id: 'wh1',
      integrationId: 'github',
      eventType: 'push',
      payload: {},
    });

    const webhooks = hub.getWebhooks('github');
    expect(webhooks.length).toBe(1);
    expect(webhooks[0].processed).toBe(false);
  });

  test('filters webhooks by integration', async () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    hub.registerIntegration({
      id: 'slack',
      type: 'slack',
      name: 'Slack',
      enabled: true,
      config: {},
    });

    await hub.processWebhook({
      id: 'wh1',
      integrationId: 'github',
      eventType: 'push',
      payload: {},
    });

    await hub.processWebhook({
      id: 'wh2',
      integrationId: 'slack',
      eventType: 'message',
      payload: {},
    });

    const githubWebhooks = hub.getWebhooks('github');
    expect(githubWebhooks.length).toBe(1);
    expect(githubWebhooks[0].integrationId).toBe('github');

    const slackWebhooks = hub.getWebhooks('slack');
    expect(slackWebhooks.length).toBe(1);
    expect(slackWebhooks[0].integrationId).toBe('slack');
  });

  test('generates stats', async () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    hub.registerIntegration({
      id: 'slack',
      type: 'slack',
      name: 'Slack',
      enabled: false,
      config: {},
    });

    await hub.processWebhook({
      id: 'wh1',
      integrationId: 'github',
      eventType: 'push',
      payload: {},
    });

    const stats = hub.getStats();
    expect(stats.totalIntegrations).toBe(2);
    expect(stats.enabledIntegrations).toBe(1);
    expect(stats.byType['github']).toBe(1);
    expect(stats.byType['slack']).toBe(1);
    expect(stats.totalWebhooks).toBe(1);
    expect(stats.processedWebhooks).toBe(0); // No handler registered
  });

  test('clears all data', async () => {
    hub.registerIntegration({
      id: 'github',
      type: 'github',
      name: 'GitHub',
      enabled: true,
      config: {},
    });

    await hub.processWebhook({
      id: 'wh1',
      integrationId: 'github',
      eventType: 'push',
      payload: {},
    });

    hub.clear();
    const stats = hub.getStats();
    expect(stats.totalIntegrations).toBe(0);
    expect(stats.totalWebhooks).toBe(0);
  });
});
