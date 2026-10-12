import { TaskRecord, ActivityEvent, AuthorizationRecord, EvidenceItem } from '../orchestration/types.js';
import crypto from 'crypto';

type TaskListener = (task: TaskRecord, newEvent?: ActivityEvent) => void;

export class TaskStore {
  private tasks = new Map<string, TaskRecord>();
  private listeners = new Set<TaskListener>();

  public createTask(prompt: string): TaskRecord {
    const id = `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const task: TaskRecord = {
      id,
      prompt,
      status: 'pending',
      plan: null,
      subtasks: [],
      events: [
        {
          id: `evt_${Date.now()}_0`,
          timestamp: now,
          type: 'agent_started',
          agent: 'lead',
          message: `Task initialized: "${prompt}"`,
        },
      ],
      authorizations: [],
      evidence: [],
      changedFiles: [],
      testResults: null,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    this.notify(task, task.events[0]);
    return task;
  }

  public getTask(id: string): TaskRecord | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): TaskRecord[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateTask(id: string, updates: Partial<TaskRecord>): TaskRecord | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    this.notify(task);
    return task;
  }

  public addEvent(taskId: string, event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const fullEvent: ActivityEvent = {
      ...event,
      id: `evt_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };

    task.events.push(fullEvent);
    task.updatedAt = fullEvent.timestamp;
    this.notify(task, fullEvent);
    return fullEvent;
  }

  public addAuthorization(taskId: string, auth: Omit<AuthorizationRecord, 'id' | 'timestamp'>): AuthorizationRecord | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const fullAuth: AuthorizationRecord = {
      ...auth,
      id: `auth_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };

    task.authorizations.push(fullAuth);
    task.updatedAt = fullAuth.timestamp;
    this.notify(task);
    return fullAuth;
  }

  public addEvidence(taskId: string, evidence: Omit<EvidenceItem, 'id' | 'timestamp'>): EvidenceItem | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const fullItem: EvidenceItem = {
      ...evidence,
      id: `evi_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };

    task.evidence.push(fullItem);
    task.updatedAt = fullItem.timestamp;
    this.notify(task);
    return fullItem;
  }

  public subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(task: TaskRecord, newEvent?: ActivityEvent) {
    for (const listener of this.listeners) {
      try {
        listener(task, newEvent);
      } catch (err) {
        console.error('[TaskStore] Listener error:', err);
      }
    }
  }
}
