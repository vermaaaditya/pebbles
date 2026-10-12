import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { WorkspaceSandbox, WorkspaceTools } from '@pebbles/mcp-server';

describe('WorkspaceTools MCP Implementation', () => {
  const sampleRepoPath = path.resolve(__dirname, '../../../workspace-sandbox/sample-repo');
  let tools: WorkspaceTools;

  beforeAll(() => {
    const sandbox = new WorkspaceSandbox({
      rootPath: sampleRepoPath,
      permittedCommands: ['node --test test/calculator.test.js'],
    });
    tools = new WorkspaceTools(sandbox);
  });

  it('lists files inside sandbox repository', async () => {
    const result = await tools.listFiles('.', true);
    expect(result.files.length).toBeGreaterThan(0);
    const fileNames = result.files.map(f => f.name);
    expect(fileNames).toContain('package.json');
    expect(fileNames).toContain('calculator.js');
  });

  it('reads permitted file contents', async () => {
    const result = await tools.readFile('src/calculator.js');
    expect(result.content).toContain('calculateInvoice');
    expect(result.lines).toBeGreaterThan(5);
  });

  it('searches for text query across files', async () => {
    const result = await tools.searchFiles('calculateInvoice');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].file).toContain('calculator');
  });

  it('writes and updates file in sandbox', async () => {
    const testFile = 'test-scratch.txt';
    const writeResult = await tools.writeFile(testFile, 'Hello from Pebbles test');
    expect(writeResult.relativePath).toBe('test-scratch.txt');

    const readResult = await tools.readFile(testFile);
    expect(readResult.content).toBe('Hello from Pebbles test');
  });

  it('runs permitted test suite', async () => {
    const testResult = await tools.runTests('node', ['--test', 'test/calculator.test.js']);
    expect(testResult.exitCode).toBe(0);
    expect(testResult.passed).toBe(true);
  });
});
