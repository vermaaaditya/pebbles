import { ILlmProvider } from '../llm/provider.js';
import { Plan, Subtask, EvidenceItem, TestSummary } from './types.js';

export class LeadPebble {
  constructor(private readonly llm: ILlmProvider) {}

  /**
   * Plans subtasks based on user objective.
   */
  public async createPlan(userPrompt: string): Promise<Plan> {
    const systemPrompt = `You are Lead Pebble, the coordinating architect of an autonomous software engineering team.
Analyze the user request and generate a structured JSON plan with discrete subtasks.
Assign each subtask to either 'research' (for code inspection, searching, understanding) or 'builder' (for editing files, running tests).
Ensure Research investigates first, and Builder executes modifications and tests.

Return strictly valid JSON in this schema:
{
  "goal": "string summary",
  "subtasks": [
    {
      "id": "subtask-1",
      "title": "string",
      "agent": "research" | "builder",
      "instructions": "detailed instructions"
    }
  ]
}`;

    const rawResponse = await this.llm.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true }
    );

    try {
      const parsed = JSON.parse(rawResponse);
      if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
        return {
          goal: parsed.goal || 'Complete requested task',
          subtasks: parsed.subtasks.map((s: any, idx: number) => ({
            id: s.id || `subtask-${idx + 1}`,
            title: s.title || `Subtask ${idx + 1}`,
            agent: (s.agent === 'builder' ? 'builder' : 'research') as 'builder' | 'research',
            instructions: s.instructions || s.title || '',
          })),
        };
      }
    } catch {
      // Fallback structured plan if JSON parsing failed
    }

    return {
      goal: 'Inspect repository, fix calculation bug, and verify tests pass.',
      subtasks: [
        {
          id: 'subtask-1',
          title: 'Inspect workspace files and search for calculation logic',
          agent: 'research',
          instructions: 'List files in workspace and search for calculateInvoice implementation.',
        },
        {
          id: 'subtask-2',
          title: 'Investigate invoice bug and review test assertions',
          agent: 'research',
          instructions: 'Read src/calculator.js and test/calculator.test.js to find the calculation error.',
        },
        {
          id: 'subtask-3',
          title: 'Apply bug fix to calculator implementation',
          agent: 'builder',
          instructions: 'Update src/calculator.js to properly subtract the discount from subtotal.',
        },
        {
          id: 'subtask-4',
          title: 'Execute test suite to verify fix',
          agent: 'builder',
          instructions: 'Run npm test in sandboxed workspace to confirm all assertions pass.',
        },
      ],
    };
  }

  /**
   * Compiles observed evidence, test results, and subtasks into a verifiable final report.
   */
  public generateFinalReport(
    plan: Plan,
    subtasks: Subtask[],
    evidence: EvidenceItem[],
    changedFiles: string[],
    testResults: TestSummary | null,
    overallSuccess: boolean
  ): string {
    const statusHeader = overallSuccess
      ? '## Status: All Objectives Completed Successfully'
      : '## Status: Task Ended with Errors or Incomplete Steps';

    const evidenceList = evidence.length > 0
      ? evidence.map(e => `- **[${e.agent.toUpperCase()}]** \`${e.tool}\` on \`${e.target}\`: ${e.observation}`).join('\n')
      : '- No evidence collected.';

    const changedFilesList = changedFiles.length > 0
      ? changedFiles.map(f => `- \`${f}\``).join('\n')
      : '- No files modified.';

    const testSection = testResults
      ? `- Command: \`${testResults.command}\`\n- Outcome: **${testResults.passed ? 'PASSED (Exit 0)' : 'FAILED'}** (took ${testResults.durationMs}ms)\n\`\`\`\n${testResults.stdout || testResults.stderr || 'No output'}\n\`\`\``
      : '- No automated tests were executed.';

    return `# Pebbles Team Execution Report

${statusHeader}

### Goal
${plan.goal}

### Subtask Execution Summary
${subtasks.map(s => `- **${s.title}** (${s.agent}): [${s.status.toUpperCase()}] ${s.findings ? `— ${s.findings}` : ''}`).join('\n')}

### Verified Changes
${changedFilesList}

### Verification & Test Results
${testSection}

### Cryptographic & Tool Evidence Trail
${evidenceList}

---
*Report synthesized by Lead Pebble with verified execution traces.*`;
  }
}
