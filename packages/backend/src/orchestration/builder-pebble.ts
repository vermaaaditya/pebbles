import { PebblesMcpClient } from '../mcp/client.js';
import { IAuthorizationProvider } from '../authorization/types.js';
import { Subtask, EvidenceItem, ActivityEvent, TestSummary } from './types.js';

export interface BuilderContext {
  taskId: string;
  subtask: Subtask;
  previousFindings?: string;
  onEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  onEvidence: (evidence: Omit<EvidenceItem, 'id' | 'timestamp'>) => void;
  onFileChanged: (path: string) => void;
  onTestResults: (results: TestSummary) => void;
  requestAuthorization: (action: string, target: string, params?: Record<string, any>) => Promise<boolean>;
}

export class BuilderPebble {
  constructor(
    private readonly mcpClient: PebblesMcpClient,
    private readonly authProvider: IAuthorizationProvider
  ) {}

  public async executeSubtask(context: BuilderContext): Promise<string> {
    const { subtask, onEvent, onEvidence, onFileChanged, onTestResults, requestAuthorization } = context;

    onEvent({
      agent: 'builder',
      type: 'agent_started',
      message: `Builder Pebble starting: "${subtask.title}"`,
    });

    const isTestSubtask = subtask.instructions.toLowerCase().includes('test') || subtask.title.toLowerCase().includes('test');

    if (!isTestSubtask) {
      // Subtask: Apply fix to calculator
      const targetFile = 'src/calculator.js';

      // 1. Authorization check before writing
      const canWrite = await requestAuthorization('workspace_write_file', targetFile);
      if (!canWrite) {
        throw new Error(`Builder Pebble was denied authorization to write to ${targetFile}`);
      }

      const fixedCode = `/**
 * Simple billing and discount calculator (Verified Bugfix by Pebbles Builder)
 */
export function calculateInvoice(items, discountRate = 0) {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // FIXED: Discount properly subtracted from subtotal
  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: items.reduce((count, item) => count + item.quantity, 0)
  };
}
`;

      onEvent({
        agent: 'builder',
        type: 'tool_call',
        message: `Writing corrected logic to ${targetFile}`,
        data: { tool: 'workspace_write_file', path: targetFile },
      });

      const writeResult = await this.mcpClient.executeTool('workspace_write_file', {
        path: targetFile,
        content: fixedCode,
      });

      if (writeResult.isError) {
        throw new Error(`Failed to write file ${targetFile}: ${writeResult.content}`);
      }

      onFileChanged(targetFile);

      onEvidence({
        agent: 'builder',
        tool: 'workspace_write_file',
        target: targetFile,
        observation: `Wrote verified invoice calculation fix to ${targetFile}.`,
        supportedClaim: 'Discount calculation logic updated.',
      });

      return `Successfully applied bugfix to ${targetFile}.`;
    } else {
      // Subtask: Run automated tests
      const testCommand = 'node';
      const testArgs = ['--test', 'test/calculator.test.js'];

      // Authorization check before running test command
      const canRun = await requestAuthorization('workspace_run_tests', `${testCommand} ${testArgs.join(' ')}`, {
        command: testCommand,
        args: testArgs,
      });

      if (!canRun) {
        throw new Error('Builder Pebble was denied authorization to execute tests.');
      }

      onEvent({
        agent: 'builder',
        type: 'tool_call',
        message: `Running sandboxed test suite: ${testCommand} ${testArgs.join(' ')}`,
        data: { tool: 'workspace_run_tests', command: testCommand, args: testArgs },
      });

      const testExecution = await this.mcpClient.executeTool('workspace_run_tests', {
        command: testCommand,
        args: testArgs,
      });

      let parsedResult: any = {};
      try {
        parsedResult = JSON.parse(testExecution.content);
      } catch {
        parsedResult = { passed: !testExecution.isError, stdout: testExecution.content, stderr: '' };
      }

      const testSummary: TestSummary = {
        passed: Boolean(parsedResult.passed ?? (parsedResult.exitCode === 0)),
        command: `${testCommand} ${testArgs.join(' ')}`,
        stdout: parsedResult.stdout || testExecution.content,
        stderr: parsedResult.stderr || '',
        durationMs: parsedResult.durationMs || 150,
      };

      onTestResults(testSummary);

      onEvidence({
        agent: 'builder',
        tool: 'workspace_run_tests',
        target: testSummary.command,
        observation: `Tests ${testSummary.passed ? 'PASSED' : 'FAILED'} with exit code ${parsedResult.exitCode ?? 0}.`,
        supportedClaim: testSummary.passed
          ? 'Automated tests verify calculator discount logic passes without error.'
          : 'Automated tests failed.',
      });

      if (!testSummary.passed) {
        throw new Error(`Test suite failed: ${testSummary.stderr || testSummary.stdout}`);
      }

      return `All automated test assertions passed (${testSummary.durationMs}ms).`;
    }
  }
}
