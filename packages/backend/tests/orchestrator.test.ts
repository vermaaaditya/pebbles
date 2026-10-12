import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { TaskStore } from '../src/store/task-store.js';
import { PebblesMcpClient } from '../src/mcp/client.js';
import { LocalPolicyAuthorizationProvider } from '../src/authorization/local-policy-provider.js';
import { MockLlmProvider } from '../src/llm/provider.js';
import { PebblesOrchestrator } from '../src/orchestration/orchestrator.js';
import { AppConfig } from '../src/config.js';

describe('Pebbles Autonomous Multi-Agent Orchestrator', () => {
  let mcpClient: PebblesMcpClient;
  let orchestrator: PebblesOrchestrator;
  let taskStore: TaskStore;

  beforeAll(async () => {
    const sampleRepoPath = path.resolve(__dirname, '../../../workspace-sandbox/sample-repo');
    const mockConfig: AppConfig = {
      env: 'test',
      backendPort: 3001,
      corsOrigin: '*',
      authorization: { mode: 'local_policy' },
      llm: { provider: 'mock' },
      workspace: {
        sandboxPath: sampleRepoPath,
        maxFileSizeBytes: 1048576,
        permittedCommands: ['node --test test/calculator.test.js'],
      },
    };

    taskStore = new TaskStore();
    mcpClient = new PebblesMcpClient(mockConfig);
    await mcpClient.connect();

    const authProvider = new LocalPolicyAuthorizationProvider();
    const llm = new MockLlmProvider();

    orchestrator = new PebblesOrchestrator(taskStore, mcpClient, authProvider, llm);
  });

  afterAll(async () => {
    await mcpClient.close();
  });

  it('orchestrates end-to-end bug fix workflow with verified evidence', async () => {
    const task = taskStore.createTask(
      'Inspect this repository, investigate a bug, implement a fix, run the available tests, and prepare the changes for review.'
    );

    const completedTask = await orchestrator.executeTask(task.id);

    expect(completedTask.status).toBe('completed');
    expect(completedTask.plan).toBeDefined();
    expect(completedTask.subtasks.length).toBeGreaterThan(0);

    // Verify subtasks completed
    expect(completedTask.subtasks.every(s => s.status === 'completed')).toBe(true);

    // Verify evidence collection
    expect(completedTask.evidence.length).toBeGreaterThan(0);
    const toolsUsed = completedTask.evidence.map(e => e.tool);
    expect(toolsUsed).toContain('workspace_list_files');
    expect(toolsUsed).toContain('workspace_write_file');
    expect(toolsUsed).toContain('workspace_run_tests');

    // Verify file changes
    expect(completedTask.changedFiles).toContain('src/calculator.js');

    // Verify test results
    expect(completedTask.testResults).toBeDefined();
    expect(completedTask.testResults?.passed).toBe(true);

    // Verify final report
    expect(completedTask.finalReport).toBeDefined();
    expect(completedTask.finalReport).toContain('Pebbles Team Execution Report');
    expect(completedTask.finalReport).toContain('All Objectives Completed Successfully');
  }, 30000);
});
