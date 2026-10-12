import { TaskStore } from '../store/task-store.js';
import { PebblesMcpClient } from '../mcp/client.js';
import { IAuthorizationProvider, AgentRole, AuthorizationResult } from '../authorization/types.js';
import { ILlmProvider } from '../llm/provider.js';
import { LeadPebble } from './lead-pebble.js';
import { ResearchPebble } from './research-pebble.js';
import { BuilderPebble } from './builder-pebble.js';
import { TaskRecord, Subtask, TestSummary } from './types.js';

export class PebblesOrchestrator {
  private readonly leadPebble: LeadPebble;
  private readonly researchPebble: ResearchPebble;
  private readonly builderPebble: BuilderPebble;
  private activeExecutions = new Map<string, { abort: () => void }>();

  constructor(
    private readonly taskStore: TaskStore,
    private readonly mcpClient: PebblesMcpClient,
    private readonly authProvider: IAuthorizationProvider,
    private readonly llm: ILlmProvider
  ) {
    this.leadPebble = new LeadPebble(llm);
    this.researchPebble = new ResearchPebble(mcpClient, authProvider);
    this.builderPebble = new BuilderPebble(mcpClient, authProvider);
  }

  /**
   * Starts autonomous execution of a task.
   */
  public async executeTask(taskId: string): Promise<TaskRecord> {
    const task = this.taskStore.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found.`);
    }

    let isAborted = false;
    this.activeExecutions.set(taskId, {
      abort: () => {
        isAborted = true;
      },
    });

    try {
      // 1. Planning Phase (Lead Pebble)
      this.taskStore.updateTask(taskId, { status: 'planning' });
      this.taskStore.addEvent(taskId, {
        agent: 'lead',
        type: 'agent_started',
        message: 'Lead Pebble analyzing requirements and synthesizing execution plan...',
      });

      const plan = await this.leadPebble.createPlan(task.prompt);
      const subtasks: Subtask[] = plan.subtasks.map(s => ({
        ...s,
        status: 'pending',
      }));

      this.taskStore.updateTask(taskId, {
        plan,
        subtasks,
        status: 'running',
      });

      this.taskStore.addEvent(taskId, {
        agent: 'lead',
        type: 'plan_created',
        message: `Plan created with ${subtasks.length} subtasks. Delegating to specialized teammates.`,
        data: plan,
      });

      // 2. Subtask Execution Phase
      let previousFindings = '';
      const changedFiles: string[] = [];
      let lastTestResults: TestSummary | null = null;
      let overallSuccess = true;

      for (let i = 0; i < subtasks.length; i++) {
        if (isAborted) {
          this.taskStore.updateTask(taskId, { status: 'aborted' });
          this.taskStore.addEvent(taskId, {
            agent: 'system',
            type: 'error',
            message: 'Task execution was aborted by user.',
          });
          return this.taskStore.getTask(taskId)!;
        }

        const currentSubtask = subtasks[i];
        currentSubtask.status = 'in_progress';
        currentSubtask.startedAt = new Date().toISOString();

        this.taskStore.updateTask(taskId, {
          currentSubtaskId: currentSubtask.id,
          subtasks: [...subtasks],
        });

        // Common authorization gate wrapper
        const requestAuth = async (
          action: string,
          target: string,
          params?: Record<string, any>
        ): Promise<boolean> => {
          const authResult: AuthorizationResult = await this.authProvider.authorize({
            agent: currentSubtask.agent,
            action,
            target,
            params,
            planId: taskId,
            subtaskId: currentSubtask.id,
          });

          const authRecord = this.taskStore.addAuthorization(taskId, {
            agent: currentSubtask.agent,
            action,
            target,
            decision: authResult.decision,
            reason: authResult.reason,
            providerMode: authResult.providerMode,
            isProductionArmorIQ: authResult.isProductionArmorIQ,
            delegationId: authResult.delegationId,
            executionStatus:
              authResult.decision === 'ALLOW'
                ? 'executed'
                : authResult.decision === 'HOLD'
                ? 'held'
                : 'blocked',
          });

          this.taskStore.addEvent(taskId, {
            agent: 'system',
            type: 'auth_decision',
            message: `[${authResult.decision}] by ${authResult.providerMode.toUpperCase()}: ${authResult.reason}`,
            data: authRecord,
          });

          // Handle HOLD decision
          if (authResult.decision === 'HOLD') {
            this.taskStore.updateTask(taskId, { status: 'held' });
            this.taskStore.addEvent(taskId, {
              agent: 'system',
              type: 'hold_requested',
              message: `Operation held pending human authorization: ${action} on "${target}".`,
              data: { delegationId: authResult.delegationId },
            });

            // Wait for human decision
            const approved = await new Promise<boolean>((resolve) => {
              if (this.authProvider.getMode() === 'local_policy') {
                const localProv = this.authProvider as any;
                localProv.registerPendingHold(
                  authResult.delegationId!,
                  { agent: currentSubtask.agent, action, target, params },
                  (dec: string) => resolve(dec === 'ALLOW')
                );
              } else {
                // In production mode, poll or wait for delegation approval
                this.authProvider.handleHold(authResult.delegationId!, false).then(() => resolve(false));
              }
            });

            this.taskStore.updateTask(taskId, { status: 'running' });
            this.taskStore.addEvent(taskId, {
              agent: 'system',
              type: 'hold_resolved',
              message: `Hold decision resolved: ${approved ? 'APPROVED' : 'REJECTED'}.`,
            });

            if (authRecord) {
              authRecord.executionStatus = approved ? 'executed' : 'blocked';
            }
            return approved;
          }

          return authResult.decision === 'ALLOW';
        };

        try {
          if (currentSubtask.agent === 'research') {
            const findings = await this.researchPebble.executeSubtask({
              taskId,
              subtask: currentSubtask,
              onEvent: (evt) => this.taskStore.addEvent(taskId, evt),
              onEvidence: (evi) => this.taskStore.addEvidence(taskId, evi),
              requestAuthorization: requestAuth,
            });
            currentSubtask.findings = findings;
            previousFindings += ' ' + findings;
          } else {
            const findings = await this.builderPebble.executeSubtask({
              taskId,
              subtask: currentSubtask,
              previousFindings,
              onEvent: (evt) => this.taskStore.addEvent(taskId, evt),
              onEvidence: (evi) => this.taskStore.addEvidence(taskId, evi),
              onFileChanged: (filePath) => {
                if (!changedFiles.includes(filePath)) changedFiles.push(filePath);
                this.taskStore.updateTask(taskId, { changedFiles: [...changedFiles] });
              },
              onTestResults: (testResults) => {
                lastTestResults = testResults;
                this.taskStore.updateTask(taskId, { testResults });
              },
              requestAuthorization: requestAuth,
            });
            currentSubtask.findings = findings;
          }

          currentSubtask.status = 'completed';
          currentSubtask.completedAt = new Date().toISOString();

          this.taskStore.addEvent(taskId, {
            agent: currentSubtask.agent,
            type: 'subtask_completed',
            message: `Completed "${currentSubtask.title}": ${currentSubtask.findings}`,
          });
        } catch (subtaskErr: any) {
          overallSuccess = false;
          currentSubtask.status = 'failed';
          currentSubtask.error = subtaskErr.message || String(subtaskErr);

          this.taskStore.addEvent(taskId, {
            agent: currentSubtask.agent,
            type: 'error',
            message: `Failed subtask "${currentSubtask.title}": ${currentSubtask.error}`,
          });
          break; // Stop on critical failure
        } finally {
          this.taskStore.updateTask(taskId, { subtasks: [...subtasks] });
        }
      }

      // 3. Final Reporting Phase (Lead Pebble)
      const currentTask = this.taskStore.getTask(taskId)!;
      const report = this.leadPebble.generateFinalReport(
        plan,
        subtasks,
        currentTask.evidence,
        changedFiles,
        lastTestResults,
        overallSuccess
      );

      const finalStatus = overallSuccess ? 'completed' : 'failed';
      this.taskStore.updateTask(taskId, {
        status: finalStatus,
        finalReport: report,
        currentSubtaskId: undefined,
      });

      this.taskStore.addEvent(taskId, {
        agent: 'lead',
        type: overallSuccess ? 'task_completed' : 'task_failed',
        message: `Task concluded with status: ${finalStatus.toUpperCase()}. Final report generated.`,
      });

      return this.taskStore.getTask(taskId)!;
    } finally {
      this.activeExecutions.delete(taskId);
    }
  }

  public abortTask(taskId: string): boolean {
    const execution = this.activeExecutions.get(taskId);
    if (execution) {
      execution.abort();
      this.taskStore.updateTask(taskId, { status: 'aborted' });
      return true;
    }
    return false;
  }
}
