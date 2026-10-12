import { createPebblesMcpServer } from './server.js';

export * from './sandbox.js';
export * from './tools/workspace-tools.js';
export * from './server.js';

// Auto-start if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const instance = createPebblesMcpServer();
  instance.startStdio().catch((err) => {
    console.error('[Pebbles MCP Server] Fatal startup error:', err);
    process.exit(1);
  });
}
