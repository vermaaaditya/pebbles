import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPebblesMcpServer, ServerInstance } from '@pebbles/mcp-server';
import { AppConfig } from '../config.js';

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, any>;
}

export class PebblesMcpClient {
  private client: Client | null = null;
  private serverInstance: ServerInstance | null = null;
  private connected: boolean = false;

  constructor(private readonly config: AppConfig) {}

  public async connect(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    // Initialize the official McpServer with configured sandbox
    this.serverInstance = createPebblesMcpServer({
      rootPath: this.config.workspace.sandboxPath,
      maxFileSizeBytes: this.config.workspace.maxFileSizeBytes,
      permittedCommands: this.config.workspace.permittedCommands,
    });

    // Create linked pair of InMemoryTransports
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // Connect server
    await this.serverInstance.server.connect(serverTransport);

    // Initialize and connect official MCP client
    this.client = new Client(
      {
        name: 'pebbles-backend-orchestrator',
        version: '0.1.0',
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(clientTransport);
    this.connected = true;
    console.log('[Pebbles MCP Client] Connected to MCP server via official transport.');
  }

  public async listTools(): Promise<McpToolInfo[]> {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    const result = await this.client!.listTools();
    return result.tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, any>,
    }));
  }

  public async executeTool(name: string, toolArguments: Record<string, any> = {}): Promise<{
    content: string;
    isError: boolean;
    raw: any;
  }> {
    if (!this.connected || !this.client) {
      await this.connect();
    }

    try {
      const response = await this.client!.callTool({
        name,
        arguments: toolArguments,
      });

      const textBlocks = (response.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === 'text')
        .map((c) => c.text || '')
        .join('\n');

      return {
        content: textBlocks,
        isError: Boolean(response.isError),
        raw: response,
      };
    } catch (err: any) {
      return {
        content: `MCP Execution Exception: ${err.message || String(err)}`,
        isError: true,
        raw: { error: err.message },
      };
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.serverInstance) {
      await this.serverInstance.server.close();
      this.serverInstance = null;
    }
    this.connected = false;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
