import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadConfig } from './config.js';
import { createAuthorizationProvider } from './authorization/provider.js';
import { PebblesMcpClient } from './mcp/client.js';
import { createLlmProvider } from './llm/provider.js';
import { TaskStore } from './store/task-store.js';
import { PebblesOrchestrator } from './orchestration/orchestrator.js';
import { createHealthRoutes } from './routes/health.js';
import { createTasksRoutes } from './routes/tasks.js';

export async function buildServer() {
  const config = loadConfig();
  const fastify = Fastify({
    logger: true,
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Initialize Core Services
  const authProvider = createAuthorizationProvider(config);
  const mcpClient = new PebblesMcpClient(config);
  const llm = createLlmProvider(config);
  const taskStore = new TaskStore();

  // Connect to local MCP Server
  try {
    await mcpClient.connect();
    fastify.log.info('MCP Client successfully connected to workspace MCP Server.');
  } catch (err) {
    fastify.log.error(err as Error, 'Failed to initialize MCP Client');
  }

  const orchestrator = new PebblesOrchestrator(taskStore, mcpClient, authProvider, llm);

  // Register Routes
  await fastify.register(createHealthRoutes({ config, authProvider, mcpClient, llm }));
  await fastify.register(createTasksRoutes({ taskStore, orchestrator, authProvider }));

  return { fastify, config, taskStore, orchestrator, authProvider, mcpClient };
}

import { pathToFileURL } from 'url';

// Start server if directly executed
const isDirectRun = Boolean(
  process.argv[1] &&
  (import.meta.url === pathToFileURL(process.argv[1]).href ||
   process.argv[1].endsWith('server.js') ||
   process.argv[1].endsWith('server.ts'))
);

if (isDirectRun) {
  const { fastify, config } = await buildServer();
  try {
    await fastify.listen({ port: config.backendPort, host: '0.0.0.0' });
    console.log(`\n================================================================`);
    console.log(` Pebbles Backend running on http://localhost:${config.backendPort}`);
    console.log(` Governance Mode: ${config.authorization.mode.toUpperCase()}`);
    console.log(` LLM Provider:    ${config.llm.provider.toUpperCase()}`);
    console.log(`================================================================\n`);
  } catch (err) {
    fastify.log.error(err as Error);
    process.exit(1);
  }
}
