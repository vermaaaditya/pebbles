import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'path';
import { WorkspaceSandbox, SandboxConfig } from './sandbox.js';
import { WorkspaceTools } from './tools/workspace-tools.js';

export interface ServerInstance {
  server: McpServer;
  sandbox: WorkspaceSandbox;
  tools: WorkspaceTools;
  startStdio: () => Promise<void>;
}

export function createPebblesMcpServer(customConfig?: Partial<SandboxConfig>): ServerInstance {
  const rootPath = customConfig?.rootPath || 
    (process.env.WORKSPACE_SANDBOX_PATH
      ? path.resolve(process.cwd(), process.env.WORKSPACE_SANDBOX_PATH)
      : path.resolve(process.cwd(), 'workspace-sandbox/sample-repo'));

  const sandbox = new WorkspaceSandbox({
    rootPath,
    maxFileSizeBytes: customConfig?.maxFileSizeBytes || 1024 * 1024,
    permittedCommands: customConfig?.permittedCommands || [
      'npm test',
      'node --test',
      'pytest',
      'cargo test',
      'vitest run'
    ],
  });

  const tools = new WorkspaceTools(sandbox);

  const server = new McpServer({
    name: 'pebbles-workspace',
    version: '0.1.0',
  });

  // Tool 1: workspace_list_files
  server.tool(
    'workspace_list_files',
    'List files and folders inside the sandboxed workspace',
    {
      path: z.string().optional().describe('Relative directory path inside workspace (defaults to root)'),
      recursive: z.boolean().optional().describe('Whether to list recursively (default false)'),
      maxDepth: z.number().optional().describe('Maximum recursion depth (default 3)'),
    },
    async ({ path = '.', recursive = false, maxDepth = 3 }) => {
      try {
        const result = await tools.listFiles(path, recursive, maxDepth);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error listing files: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: workspace_read_file
  server.tool(
    'workspace_read_file',
    'Read the content of a file within the sandboxed workspace',
    {
      path: z.string().describe('Relative path to the file to read'),
    },
    async ({ path }) => {
      try {
        const result = await tools.readFile(path);
        return {
          content: [
            {
              type: 'text' as const,
              text: result.content,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error reading file "${path}": ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: workspace_search_files
  server.tool(
    'workspace_search_files',
    'Search for text or tokens across workspace files',
    {
      query: z.string().describe('Search query string'),
      path: z.string().optional().describe('Relative directory to search within (defaults to root)'),
      maxResults: z.number().optional().describe('Maximum number of search matches (default 50)'),
    },
    async ({ query, path = '.', maxResults = 50 }) => {
      try {
        const result = await tools.searchFiles(query, path, maxResults);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error searching files: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool 4: workspace_write_file
  server.tool(
    'workspace_write_file',
    'Create or modify a file inside the sandboxed workspace',
    {
      path: z.string().describe('Relative path to the file to create or update'),
      content: z.string().describe('New content to write to the file'),
    },
    async ({ path, content }) => {
      try {
        const result = await tools.writeFile(path, content);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error writing file "${path}": ${err.message}`,
            },
          ],
        };
      }
    }
  );

  // Tool 5: workspace_run_tests
  server.tool(
    'workspace_run_tests',
    'Execute permitted test suites inside the sandboxed workspace',
    {
      command: z.string().optional().describe('Permitted test command (e.g. "npm", "pytest", "cargo")'),
      args: z.array(z.string()).optional().describe('Arguments for the test runner (e.g. ["test"])'),
    },
    async ({ command = 'npm', args = ['test'] }) => {
      try {
        const result = await tools.runTests(command, args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error executing tests: ${err.message}`,
            },
          ],
        };
      }
    }
  );

  return {
    server,
    sandbox,
    tools,
    startStdio: async () => {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error(`[Pebbles MCP Server] Connected via StdioTransport (root: ${sandbox.getRoot()})`);
    },
  };
}
