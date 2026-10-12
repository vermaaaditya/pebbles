import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { WorkspaceSandbox, SandboxSecurityError } from '../sandbox.js';

export interface FileEntry {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  sizeBytes: number;
  updatedAt: string;
}

export interface SearchMatch {
  file: string;
  lineNumber: number;
  lineContent: string;
}

export class WorkspaceTools {
  constructor(private readonly sandbox: WorkspaceSandbox) {}

  /**
   * Lists files and folders within a relative directory path.
   */
  async listFiles(relDir: string = '.', recursive: boolean = false, maxDepth: number = 3): Promise<{
    root: string;
    files: FileEntry[];
  }> {
    const safeDir = this.sandbox.resolveSafePath(relDir);
    if (!existsSync(safeDir)) {
      throw new Error(`Directory does not exist: "${relDir}"`);
    }

    const stat = await fs.stat(safeDir);
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: "${relDir}"`);
    }

    const results: FileEntry[] = [];
    const rootPath = this.sandbox.getRoot();

    async function walk(currentDir: string, currentDepth: number) {
      if (currentDepth > maxDepth) return;
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden git or node_modules for listing efficiency
        if (entry.name === '.git' || entry.name === 'node_modules') continue;

        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
        const fileStat = await fs.stat(fullPath);

        results.push({
          name: entry.name,
          relativePath,
          isDirectory: entry.isDirectory(),
          sizeBytes: fileStat.size,
          updatedAt: fileStat.mtime.toISOString(),
        });

        if (recursive && entry.isDirectory()) {
          await walk(fullPath, currentDepth + 1);
        }
      }
    }

    await walk(safeDir, 1);
    return {
      root: path.relative(rootPath, safeDir).replace(/\\/g, '/') || '.',
      files: results,
    };
  }

  /**
   * Reads a file within the sandbox, respecting size limits.
   */
  async readFile(relPath: string): Promise<{
    relativePath: string;
    content: string;
    sizeBytes: number;
    lines: number;
  }> {
    const safePath = this.sandbox.resolveSafePath(relPath);
    if (!existsSync(safePath)) {
      throw new Error(`File does not exist: "${relPath}"`);
    }

    await this.sandbox.verifyFileSize(safePath);
    const content = await fs.readFile(safePath, 'utf-8');
    const lines = content.split('\n').length;
    const stat = await fs.stat(safePath);

    return {
      relativePath: path.relative(this.sandbox.getRoot(), safePath).replace(/\\/g, '/'),
      content,
      sizeBytes: stat.size,
      lines,
    };
  }

  /**
   * Searches files for a string or regex query.
   */
  async searchFiles(query: string, relDir: string = '.', maxResults: number = 50): Promise<{
    query: string;
    matches: SearchMatch[];
    totalMatches: number;
  }> {
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty.');
    }

    const safeDir = this.sandbox.resolveSafePath(relDir);
    const rootPath = this.sandbox.getRoot();
    const matches: SearchMatch[] = [];

    async function searchDir(currentDir: string) {
      if (matches.length >= maxResults) return;
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (matches.length >= maxResults) break;
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else {
          try {
            const stat = await fs.stat(fullPath);
            if (stat.size > 1024 * 512) continue; // Skip files > 512KB for search

            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            const lowerQuery = query.toLowerCase();

            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(lowerQuery)) {
                matches.push({
                  file: path.relative(rootPath, fullPath).replace(/\\/g, '/'),
                  lineNumber: i + 1,
                  lineContent: lines[i].trim(),
                });
                if (matches.length >= maxResults) break;
              }
            }
          } catch {
            // Ignore binary / unreadable files
          }
        }
      }
    }

    await searchDir(safeDir);
    return {
      query,
      matches,
      totalMatches: matches.length,
    };
  }

  /**
   * Writes content to a file in the sandbox. Creates parent directories if missing.
   */
  async writeFile(relPath: string, content: string): Promise<{
    relativePath: string;
    sizeBytes: number;
    lines: number;
    created: boolean;
  }> {
    const safePath = this.sandbox.resolveSafePath(relPath);
    const parentDir = path.dirname(safePath);
    await fs.mkdir(parentDir, { recursive: true });

    const existed = existsSync(safePath);
    await fs.writeFile(safePath, content, 'utf-8');
    const stat = await fs.stat(safePath);

    return {
      relativePath: path.relative(this.sandbox.getRoot(), safePath).replace(/\\/g, '/'),
      sizeBytes: stat.size,
      lines: content.split('\n').length,
      created: !existed,
    };
  }

  /**
   * Executes permitted tests in the sandboxed workspace.
   */
  async runTests(command: string = 'npm', args: string[] = ['test']): Promise<{
    command: string;
    args: string[];
    exitCode: number;
    passed: boolean;
    stdout: string;
    stderr: string;
    durationMs: number;
  }> {
    const result = await this.sandbox.executePermittedCommand(command, args);
    return {
      command,
      args,
      exitCode: result.exitCode,
      passed: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs: result.durationMs,
    };
  }
}
