import { describe, test, expect, beforeEach } from 'bun:test';
import { createPipelineCommandHandler } from './handler';
import { SystemObserver } from '../system-observer';

function makeInput(command: string, args = '') {
  return { command, sessionID: 'test-session', arguments: args };
}

function makeOutput() {
  return { parts: [] as Array<{ type: string; text?: string }> };
}

describe('PipelineCommandHandler', () => {
  let handler: ReturnType<typeof createPipelineCommandHandler>;

  beforeEach(() => {
    handler = createPipelineCommandHandler({} as any, {} as any);
  });

  test('shows plan help when no arguments', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('plan'), output);
    expect(output.parts.length).toBe(1);
    expect(output.parts[0].text).toContain('/plan');
    expect(output.parts[0].text).toContain('Assess→Assemble→Improvise→Act');
  });

  test('starts pipeline with topic', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('plan', 'build a todo app'), output);
    expect(output.parts.length).toBe(1);
    expect(output.parts[0].text).toContain('Pipeline Started');
    expect(output.parts[0].text).toContain('build a todo app');
    expect(output.parts[0].text).toContain('@odin');
  });

  test('shows pipeline status', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('plan', 'status'), output);
    expect(output.parts[0].text).toContain('Pipeline Status');
    expect(output.parts[0].text).toContain('Conductor');
  });

  test('handles assess command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('assess'), output);
    expect(output.parts[0].text).toContain('Phase: Assess');
    expect(output.parts[0].text).toContain('Odin');
  });

  test('handles assemble command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('assemble'), output);
    expect(output.parts[0].text).toContain('Phase: Assemble');
    expect(output.parts[0].text).toContain('Vidar');
  });

  test('handles improvise command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('improvise'), output);
    expect(output.parts[0].text).toContain('Phase: Improvise');
    expect(output.parts[0].text).toContain('Tyr');
  });

  test('handles act command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('act'), output);
    expect(output.parts[0].text).toContain('Phase: Act');
    expect(output.parts[0].text).toContain('Njord');
  });

  test('handles synthesize command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('synthesize'), output);
    expect(output.parts[0].text).toContain('Synthesis Report');
  });

  test('handles health command with observer', async () => {
    const observer = new SystemObserver();
    observer.start();
    const handlerWithObserver = createPipelineCommandHandler({} as any, {} as any, observer);
    const output = makeOutput();
    await handlerWithObserver.handleCommand(makeInput('health'), output);
    expect(output.parts[0].text).toContain('System Health Dashboard');
    expect(output.parts[0].text).toContain('Overall');
    observer.stop();
  });

  test('handles health command without observer', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('health'), output);
    expect(output.parts[0].text).toContain('Observer not initialized');
  });

  test('handles status command', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('status'), output);
    expect(output.parts[0].text).toContain('Pipeline Status');
    expect(output.parts[0].text).toContain('Kanban');
  });

  test('ignores unknown commands', async () => {
    const output = makeOutput();
    await handler.handleCommand(makeInput('unknown'), output);
    expect(output.parts.length).toBe(0);
  });
});
