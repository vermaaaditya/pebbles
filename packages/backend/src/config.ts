import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root or package dir
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // fallback to local .env if present

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  backendPort: number;
  corsOrigin: string;
  authorization: {
    mode: 'armoriq' | 'local_policy';
    apiKey?: string;
    userEmail?: string;
    policyScope?: string;
    baseUrl?: string;
  };
  llm: {
    provider: 'google' | 'anthropic' | 'openai' | 'mock';
    apiKey?: string;
    model?: string;
  };
  workspace: {
    sandboxPath: string;
    maxFileSizeBytes: number;
    permittedCommands: string[];
  };
}

export function loadConfig(): AppConfig {
  const env = (process.env.NODE_ENV || 'development') as AppConfig['env'];
  const backendPort = parseInt(process.env.BACKEND_PORT || '3001', 10);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  const authMode = (process.env.ARMORIQ_MODE || 'local_policy') as 'armoriq' | 'local_policy';
  const armoriqApiKey = process.env.ARMORIQ_API_KEY;
  const armoriqUserEmail = process.env.ARMORIQ_USER_EMAIL || 'developer@example.com';
  const armoriqPolicyScope = process.env.ARMORIQ_POLICY_SCOPE || 'pebbles-workspace-sandbox';
  const armoriqBaseUrl = process.env.ARMORIQ_BASE_URL || 'https://api.armoriq.ai';

  const llmProvider = (process.env.LLM_PROVIDER || 'mock') as AppConfig['llm']['provider'];
  const llmApiKey = process.env.LLM_API_KEY;
  const llmModel = process.env.LLM_MODEL || 'gemini-1.5-pro';

  const defaultSandbox = path.resolve(process.cwd(), 'workspace-sandbox/sample-repo');
  const sandboxPath = process.env.WORKSPACE_SANDBOX_PATH
    ? path.resolve(process.cwd(), process.env.WORKSPACE_SANDBOX_PATH)
    : defaultSandbox;
  const maxFileSizeBytes = parseInt(process.env.WORKSPACE_MAX_FILE_SIZE_BYTES || '1048576', 10);
  const permittedCommands = (process.env.PERMITTED_TEST_COMMANDS || 'npm test,pytest,cargo test,node --test')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  return {
    env,
    backendPort,
    corsOrigin,
    authorization: {
      mode: authMode,
      apiKey: armoriqApiKey,
      userEmail: armoriqUserEmail,
      policyScope: armoriqPolicyScope,
      baseUrl: armoriqBaseUrl,
    },
    llm: {
      provider: llmProvider,
      apiKey: llmApiKey,
      model: llmModel,
    },
    workspace: {
      sandboxPath,
      maxFileSizeBytes,
      permittedCommands,
    },
  };
}
