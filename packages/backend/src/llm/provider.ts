import { AppConfig } from '../config.js';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ILlmProvider {
  complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<string>;
  isLiveConfigured(): boolean;
  getProviderName(): string;
}

export class MockLlmProvider implements ILlmProvider {
  public isLiveConfigured(): boolean {
    return false;
  }

  public getProviderName(): string {
    return 'Mock Engine (Deterministic Fallback)';
  }

  public async complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<string> {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const sysMsg = messages.find(m => m.role === 'system')?.content || '';

    // If caller expects structured JSON for planning
    if (options?.jsonMode || sysMsg.includes('JSON') || lastUserMsg.includes('plan')) {
      return JSON.stringify({
        goal: 'Investigate bug, implement calculation fix, and verify tests pass.',
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Inspect workspace files and search for calculation logic',
            agent: 'research',
            instructions: 'List files in workspace and search for calculateInvoice implementation and tests.',
          },
          {
            id: 'subtask-2',
            title: 'Investigate invoice bug and review test assertions',
            agent: 'research',
            instructions: 'Read src/calculator.js and test/calculator.test.js to find the exact calculation error.',
          },
          {
            id: 'subtask-3',
            title: 'Apply bug fix to calculator implementation',
            agent: 'builder',
            instructions: 'Update src/calculator.js to correctly subtract the discount from subtotal.',
          },
          {
            id: 'subtask-4',
            title: 'Execute test suite to verify fix',
            agent: 'builder',
            instructions: 'Run npm test in sandboxed workspace to confirm all assertions pass.',
          },
        ],
      });
    }

    return `Autonomous plan formulated for: "${lastUserMsg}". Ready to coordinate teammates.`;
  }
}

export class GoogleGeminiLlmProvider implements ILlmProvider {
  constructor(private readonly apiKey: string, private readonly model: string = 'gemini-1.5-pro') {}

  public isLiveConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public getProviderName(): string {
    return `Google Gemini (${this.model})`;
  }

  public async complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens ?? 2048,
          responseMimeType: options?.jsonMode ? 'application/json' : 'text/plain',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

export function createLlmProvider(config: AppConfig): ILlmProvider {
  if (config.llm.provider === 'google' && config.llm.apiKey) {
    return new GoogleGeminiLlmProvider(config.llm.apiKey, config.llm.model);
  }
  // Default to deterministic fallback engine for offline reliability
  return new MockLlmProvider();
}
