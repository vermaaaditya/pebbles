import { FastifyPluginAsync } from 'fastify';
import { AppConfig } from '../config.js';
import { IAuthorizationProvider } from '../authorization/types.js';
import { PebblesMcpClient } from '../mcp/client.js';
import { ILlmProvider } from '../llm/provider.js';

export interface HealthRouteDeps {
  config: AppConfig;
  authProvider: IAuthorizationProvider;
  mcpClient: PebblesMcpClient;
  llm: ILlmProvider;
}

export function createHealthRoutes(deps: HealthRouteDeps): FastifyPluginAsync {
  return async (fastify) => {
    fastify.get('/api/health', async () => {
      let mcpToolsCount = 0;
      let mcpConnected = false;
      try {
        const tools = await deps.mcpClient.listTools();
        mcpToolsCount = tools.length;
        mcpConnected = deps.mcpClient.isConnected();
      } catch {
        mcpConnected = false;
      }

      const authSummary = deps.authProvider.getStatusSummary();

      return {
        status: 'ok',
        version: '0.1.0',
        environment: deps.config.env,
        authorization: {
          ...authSummary,
          configured: deps.authProvider.isConfigured(),
        },
        llm: {
          provider: deps.llm.getProviderName(),
          isLiveConfigured: deps.llm.isLiveConfigured(),
        },
        mcp: {
          connected: mcpConnected,
          availableToolsCount: mcpToolsCount,
        },
        workspace: {
          sandboxPath: deps.config.workspace.sandboxPath,
          maxFileSize: deps.config.workspace.maxFileSizeBytes,
        },
      };
    });
  };
}
