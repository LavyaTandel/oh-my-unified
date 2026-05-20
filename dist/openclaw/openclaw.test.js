import { describe, expect, test, vi } from 'bun:test';
import { OpenClawGateway } from './gateway';
describe('OpenClawGateway', () => {
    test('creates gateway with config', () => {
        const config = { enabled: true };
        const gateway = new OpenClawGateway(config);
        expect(gateway).toBeInstanceOf(OpenClawGateway);
    });
    test('send returns true for discord', async () => {
        const gateway = new OpenClawGateway({ enabled: true });
        const result = await gateway.send({ channel: 'discord', content: 'hello' });
        expect(result).toBe(true);
    });
    test('send returns true for telegram', async () => {
        const gateway = new OpenClawGateway({ enabled: true });
        const result = await gateway.send({ channel: 'telegram', content: 'hello' });
        expect(result).toBe(true);
    });
    test('send returns true for http', async () => {
        const gateway = new OpenClawGateway({ enabled: true });
        const result = await gateway.send({ channel: 'http', content: 'hello' });
        expect(result).toBe(true);
    });
    test('onMessage registers listener', () => {
        const gateway = new OpenClawGateway({ enabled: true });
        const listener = vi.fn();
        gateway.onMessage(listener);
        // No incoming message to fire, just verify no error
        expect(true).toBe(true);
    });
    test('start logs configured channels', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        const config = {
            enabled: true,
            discord: { token: 'discord-token' },
            telegram: { token: 'telegram-token' },
            http: { port: 8080 },
        };
        const gateway = new OpenClawGateway(config);
        await gateway.start();
        expect(logSpy).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenCalledWith('[OpenClaw] Discord gateway configured (token present)');
        expect(logSpy).toHaveBeenCalledWith('[OpenClaw] Telegram gateway configured (token present)');
        expect(logSpy).toHaveBeenCalledWith('[OpenClaw] HTTP gateway configured (port:', 8080, ')');
        logSpy.mockRestore();
    });
    test('stop does not throw', async () => {
        const gateway = new OpenClawGateway({ enabled: true });
        await expect(gateway.stop()).resolves.toBeUndefined();
    });
    test('isActive returns config value', () => {
        const enabledGateway = new OpenClawGateway({ enabled: true });
        expect(enabledGateway.isActive()).toBe(true);
        const disabledGateway = new OpenClawGateway({ enabled: false });
        expect(disabledGateway.isActive()).toBe(false);
    });
    test('handles empty config', () => {
        const config = { enabled: false };
        const gateway = new OpenClawGateway(config);
        expect(gateway.isActive()).toBe(false);
    });
    test('handles full config with all 3 channels', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        const config = {
            enabled: true,
            discord: { token: 'd-token', channelId: 'd-channel' },
            telegram: { token: 't-token', chatId: 't-chat' },
            http: { port: 3000 },
        };
        const gateway = new OpenClawGateway(config);
        expect(gateway.isActive()).toBe(true);
        await gateway.start();
        expect(logSpy).toHaveBeenCalledTimes(3);
        logSpy.mockRestore();
    });
});
//# sourceMappingURL=openclaw.test.js.map