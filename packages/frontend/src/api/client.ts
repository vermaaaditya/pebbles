export interface HealthInfo {
  status: string;
  version: string;
  environment: string;
  authorization: {
    mode: 'armoriq' | 'local_policy';
    isReady: boolean;
    label: string;
    description: string;
    configured: boolean;
  };
  llm: {
    provider: string;
    isLiveConfigured: boolean;
  };
  mcp: {
    connected: boolean;
    availableToolsCount: number;
  };
  workspace: {
    sandboxPath: string;
    maxFileSize: number;
  };
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type:
    | 'plan_created'
    | 'agent_started'
    | 'tool_call'
    | 'tool_result'
    | 'auth_decision'
    | 'hold_requested'
    | 'hold_resolved'
    | 'subtask_completed'
    | 'task_completed'
    | 'task_failed'
    | 'error';
  agent: 'lead' | 'research' | 'builder' | 'system';
  message: string;
  data?: any;
}

export interface AuthorizationRecord {
  id: string;
  timestamp: string;
  agent: 'lead' | 'research' | 'builder';
  action: string;
  target: string;
  decision: 'ALLOW' | 'HOLD' | 'DENY';
  reason: string;
  providerMode: 'armoriq' | 'local_policy';
  isProductionArmorIQ: boolean;
  delegationId?: string;
  executionStatus: 'pending' | 'executed' | 'blocked' | 'held';
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  agent: 'lead' | 'research' | 'builder';
  tool: string;
  target: string;
  observation: string;
  supportedClaim: string;
}

export interface Subtask {
  id: string;
  title: string;
  agent: 'lead' | 'research' | 'builder';
  instructions: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  findings?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Plan {
  goal: string;
  subtasks: Array<{
    id: string;
    title: string;
    agent: 'lead' | 'research' | 'builder';
    instructions: string;
  }>;
}

export interface TestSummary {
  passed: boolean;
  command: string;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface TaskRecord {
  id: string;
  prompt: string;
  status: 'pending' | 'planning' | 'running' | 'held' | 'completed' | 'failed' | 'aborted';
  plan: Plan | null;
  subtasks: Subtask[];
  currentSubtaskId?: string;
  events: ActivityEvent[];
  authorizations: AuthorizationRecord[];
  evidence: EvidenceItem[];
  changedFiles: string[];
  testResults: TestSummary | null;
  finalReport?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthInfo> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTasks(): Promise<TaskRecord[]> {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error(`Failed to load tasks: ${res.statusText}`);
  return res.json();
}

export async function fetchTask(id: string): Promise<TaskRecord> {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error(`Failed to load task ${id}: ${res.statusText}`);
  return res.json();
}

export async function createTask(prompt: string): Promise<TaskRecord> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Failed to create task: ${res.statusText}`);
  return res.json();
}

export async function abortTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${id}/abort`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to abort task: ${res.statusText}`);
}

export async function resolveHold(taskId: string, delegationId: string, approved: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delegationId, approved }),
  });
  if (!res.ok) throw new Error(`Failed to resolve hold: ${res.statusText}`);
}

export function subscribeToTaskEvents(
  taskId: string,
  onTaskUpdate: (task: TaskRecord) => void,
  onNewEvent?: (event: ActivityEvent) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/tasks/${taskId}/events`);

  eventSource.addEventListener('snapshot', (e) => {
    try {
      const task = JSON.parse(e.data);
      onTaskUpdate(task);
    } catch (err) {
      console.error('Error parsing snapshot:', err);
    }
  });

  eventSource.addEventListener('task_update', (e) => {
    try {
      const task = JSON.parse(e.data);
      onTaskUpdate(task);
    } catch (err) {
      console.error('Error parsing task_update:', err);
    }
  });

  eventSource.addEventListener('event', (e) => {
    try {
      const event = JSON.parse(e.data);
      if (onNewEvent) onNewEvent(event);
    } catch (err) {
      console.error('Error parsing event:', err);
    }
  });

  return () => {
    eventSource.close();
  };
}
