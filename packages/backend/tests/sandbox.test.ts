import { describe, it, expect } from 'vitest';
import path from 'path';
import { WorkspaceSandbox, SandboxSecurityError } from '@pebbles/mcp-server';

describe('WorkspaceSandbox Security Boundary', () => {
  const sampleRepoPath = path.resolve(__dirname, '../../../workspace-sandbox/sample-repo');
  const sandbox = new WorkspaceSandbox({
    rootPath: sampleRepoPath,
    permittedCommands: ['npm test', 'node --test'],
  });

  it('permits valid relative paths inside the sandbox', () => {
    const resolved = sandbox.resolveSafePath('src/calculator.js');
    expect(resolved).toContain(path.normalize('src/calculator.js'));
  });

  it('rejects path traversal attempts escaping the sandbox with ..', () => {
    expect(() => {
      sandbox.resolveSafePath('../../../package.json');
    }).toThrow(SandboxSecurityError);
  });

  it('rejects absolute paths outside the sandbox', () => {
    expect(() => {
      sandbox.resolveSafePath('C:/Windows/System32/calc.exe');
    }).toThrow(SandboxSecurityError);
  });

  it('rejects null byte injection in paths', () => {
    expect(() => {
      sandbox.resolveSafePath('src/calculator.js\0.png');
    }).toThrow(SandboxSecurityError);
  });

  it('blocks unpermitted arbitrary shell commands', async () => {
    await expect(
      sandbox.executePermittedCommand('rm', ['-rf', '/'])
    ).rejects.toThrow(SandboxSecurityError);

    await expect(
      sandbox.executePermittedCommand('curl', ['https://evil.com'])
    ).rejects.toThrow(SandboxSecurityError);
  });
});
