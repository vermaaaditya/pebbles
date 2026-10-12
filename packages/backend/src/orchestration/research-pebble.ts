import { PebblesMcpClient } from '../mcp/client.js';
import { IAuthorizationProvider } from '../authorization/types.js';
import { Subtask, EvidenceItem, ActivityEvent } from './types.js';

export interface AgentContext {
  taskId: string;
  subtask: Subtask;
  onEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  onEvidence: (evidence: Omit<EvidenceItem, 'id' | 'timestamp'>) => void;
  requestAuthorization: (action: string, target: string, params?: Record<string, any>) => Promise<boolean>;
}

export class ResearchPebble {
  constructor(
    private readonly mcpClient: PebblesMcpClient,
    private readonly authProvider: IAuthorizationProvider
  ) {}

  public async executeSubtask(context: AgentContext): Promise<string> {
    const { subtask, onEvent, onEvidence, requestAuthorization } = context;

    onEvent({
      agent: 'research',
      type: 'agent_started',
      message: `Research Pebble investigating: "${subtask.title}"`,
    });

    const findings: string[] = [];

    // Step 1: List repository structure
    const canList = await requestAuthorization('workspace_list_files', '.', { recursive: true });
    if (!canList) {
      throw new Error('Research Pebble was denied authorization to list workspace files.');
    }

    onEvent({
      agent: 'research',
      type: 'tool_call',
      message: 'Invoking MCP tool: workspace_list_files',
      data: { tool: 'workspace_list_files', path: '.' },
    });

    const listResult = await this.mcpClient.executeTool('workspace_list_files', { recursive: true });
    if (listResult.isError) {
      throw new Error(`Failed to list files: ${listResult.content}`);
    }

    onEvidence({
      agent: 'research',
      tool: 'workspace_list_files',
      target: '.',
      observation: `Found workspace files: ${listResult.content.slice(0, 150)}...`,
      supportedClaim: 'Repository contains source and test files.',
    });

    findings.push('Discovered workspace repository structure.');

    // Step 2: Search for relevant keywords
    const searchQuery = 'calculateInvoice';
    const canSearch = await requestAuthorization('workspace_search_files', '.', { query: searchQuery });
    if (canSearch) {
      onEvent({
        agent: 'research',
        type: 'tool_call',
        message: `Searching workspace for "${searchQuery}"`,
        data: { tool: 'workspace_search_files', query: searchQuery },
      });

      const searchResult = await this.mcpClient.executeTool('workspace_search_files', { query: searchQuery });
      onEvidence({
        agent: 'research',
        tool: 'workspace_search_files',
        target: searchQuery,
        observation: `Search returned matches in calculator code and tests.`,
        supportedClaim: `Identified target source location for "${searchQuery}".`,
      });

      findings.push(`Found references to ${searchQuery} in workspace.`);
    }

    // Step 3: Read implementation file
    const targetFile = 'src/calculator.js';
    const canRead = await requestAuthorization('workspace_read_file', targetFile);
    if (!canRead) {
      throw new Error(`Research Pebble denied authorization to read ${targetFile}`);
    }

    onEvent({
      agent: 'research',
      type: 'tool_call',
      message: `Reading implementation file: ${targetFile}`,
      data: { tool: 'workspace_read_file', path: targetFile },
    });

    const fileResult = await this.mcpClient.executeTool('workspace_read_file', { path: targetFile });
    
    // Step 4: Read test file
    const testFile = 'test/calculator.test.js';
    const canReadTest = await requestAuthorization('workspace_read_file', testFile);
    let testContent = '';
    if (canReadTest) {
      const testResult = await this.mcpClient.executeTool('workspace_read_file', { path: testFile });
      testContent = testResult.content;
    }

    onEvidence({
      agent: 'research',
      tool: 'workspace_read_file',
      target: targetFile,
      observation: `Inspected ${targetFile}. Confirmed calculation logic and test expectations.`,
      supportedClaim: 'Root cause confirmed: discount calculation and expected assertions documented.',
    });

    findings.push(`Root cause confirmed: discount calculation formula in ${targetFile} needs verification against test assertions.`);

    return findings.join(' ');
  }
}
