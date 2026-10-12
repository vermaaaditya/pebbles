import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface SandboxConfig {
  rootPath: string;
  maxFileSizeBytes?: number;
  permittedCommands?: string[];
  commandTimeoutMs?: number;
}

export class SandboxSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SandboxSecurityError';
  }
}

export class WorkspaceSandbox {
  private readonly rootPath: string;
  private readonly maxFileSizeBytes: number;
  private readonly permittedCommands: Set<string>;
  private readonly commandTimeoutMs: number;

  constructor(config: SandboxConfig) {
    this.rootPath = path.resolve(config.rootPath);
    this.maxFileSizeBytes = config.maxFileSizeBytes ?? 1024 * 1024; // 1MB default
    this.permittedCommands = new Set(
      (config.permittedCommands ?? ['npm test', 'node --test', 'pytest', 'cargo test', 'vitest run']).map(c => c.trim().toLowerCase())
    );
    this.commandTimeoutMs = config.commandTimeoutMs ?? 30000; // 30s default
  }

  public getRoot(): string {
    return this.rootPath;
  }

  /**
   * Resolves and verifies that a relative target path stays strictly inside the sandbox root.
   * Throws SandboxSecurityError on traversal attempts or escaped paths.
   */
  public resolveSafePath(relativePath: string): string {
    if (!relativePath || typeof relativePath !== 'string') {
      throw new SandboxSecurityError('Invalid or empty path specified.');
    }

    // Disallow null bytes
    if (relativePath.includes('\0')) {
      throw new SandboxSecurityError('Path contains invalid null byte.');
    }

    // Resolve target path against root
    const resolved = path.resolve(this.rootPath, relativePath);

    // Normalize both for strict prefix check
    const normalizedRoot = path.normalize(this.rootPath);
    const normalizedTarget = path.normalize(resolved);

    // Ensure resolved path starts with the normalized root directory
    if (!normalizedTarget.startsWith(normalizedRoot)) {
      throw new SandboxSecurityError(
        `Path traversal violation: target path "${relativePath}" escapes sandbox boundary "${normalizedRoot}".`
      );
    }

    // Additional boundary check to prevent matching root-like sibling folders
    const relative = path.relative(normalizedRoot, normalizedTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new SandboxSecurityError(
        `Path traversal violation: target path "${relativePath}" escapes sandbox boundary.`
      );
    }

    return normalizedTarget;
  }

  /**
   * Enforces file size limits before reading.
   */
  public async verifyFileSize(absolutePath: string): Promise<void> {
    const stats = await fs.stat(absolutePath);
    if (stats.size > this.maxFileSizeBytes) {
      throw new SandboxSecurityError(
        `File size ${stats.size} bytes exceeds maximum permitted size of ${this.maxFileSizeBytes} bytes.`
      );
    }
  }

  /**
   * Enforces command allowlist and runs permitted test suites in sandbox.
   * Shell interpolation is explicitly avoided by using execFile instead of exec.
   */
  public async executePermittedCommand(command: string, args: string[] = []): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
  }> {
    const fullCommand = [command, ...args].join(' ').trim().toLowerCase();
    
    // Check if the command matches any permitted pattern
    const isPermitted = Array.from(this.permittedCommands).some(permitted => {
      return fullCommand === permitted || fullCommand.startsWith(permitted + ' ');
    });

    if (!isPermitted) {
      throw new SandboxSecurityError(
        `Command execution blocked: "${command} ${args.join(' ')}" is not in permitted test allowlist: [${Array.from(this.permittedCommands).join(', ')}]`
      );
    }

    const startTime = Date.now();
    try {
      // Determine executable and args safely without shell execution
      const isWindows = process.platform === 'win32';
      let execCmd = command;
      let execArgs = args;

      if (isWindows && (command === 'npm' || command === 'npx')) {
        execCmd = `${command}.cmd`;
      }

      const result = await execFileAsync(execCmd, execArgs, {
        cwd: this.rootPath,
        timeout: this.commandTimeoutMs,
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? (err.message || String(err)),
        exitCode: err.code ?? (err.killed ? 124 : 1),
        durationMs: Date.now() - startTime,
      };
    }
  }
}
