async function run() {
  try {
    const plugin = await import('./dist/index.js');
    
    // Simulate OpenCode PluginInput exactly
    const fakeCtx = {
      directory: process.cwd(),   // required!
      worktree: process.cwd(),
      serverUrl: new URL('http://localhost:4242'),
      client: {
        app: {
          log: async ({ body }) => { console.log('[LOG]', body.level, body.message); }
        },
        session: { list: async () => ({ body: [] }) }
      },
      project: { id: 'test', path: process.cwd() },
      experimental_workspace: { register: () => {} },
      $: null,
    };

    const hooks = await plugin.default(fakeCtx, {});
    
    console.log("\n✅ Plugin initialized successfully!");
    console.log("Hook keys returned:", Object.keys(hooks));
    
    // Test config hook
    const testConfig = {};
    await hooks.config(testConfig);
    
    const cmdKeys = Object.keys(testConfig.command || {});
    const agentKeys = Object.keys(testConfig.agent || {});
    const mcpKeys = Object.keys(testConfig.mcp || {});
    
    console.log(`\n📦 Commands registered (${cmdKeys.length}):`, cmdKeys.slice(0, 5));
    console.log(`🤖 Agents registered (${agentKeys.length}):`, agentKeys.slice(0, 5));
    console.log(`🔌 MCPs registered (${mcpKeys.length}):`, mcpKeys.slice(0, 5));
    
    if (cmdKeys.includes('plan')) console.log("\n✅ /plan command: REGISTERED");
    else console.log("\n❌ /plan command: MISSING");

  } catch (e) {
    console.log("\n❌ CRASHED:", e.message);
    console.log(e.stack);
    process.exit(1);
  }
}
run();
