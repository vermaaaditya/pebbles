import { AgentRole, DecisionType } from '../authorization/types.js';

export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'running'
  | 'held'
  | 'completed'
  | 'failed'
  | 'aborted';

export type SubtaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked';

export interface PlanSubtask {
  id: string;
  title: string;
  agent: AgentRole;
  instructions: string;
}

export interface Plan {
  goal: string;
  subtasks: PlanSubtask[];
}

export interface Subtask extends PlanSubtask {
  status: SubtaskStatus;
  findings?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
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
  agent: AgentRole | 'system';
  message: string;
  data?: any;
}

export interface AuthorizationRecord {
  id: string;
  timestamp: string;
  agent: AgentRole;
  action: string;
  target: string;
  decision: DecisionType;
  reason: string;
  providerMode: 'armoriq' | 'local_policy';
  isProductionArmorIQ: boolean;
  delegationId?: string;
  executionStatus: 'pending' | 'executed' | 'blocked' | 'held';
}

export interface EvidenceItem {
  id: string;
  timestamp: string;
  agent: AgentRole;
  tool: string;
  target: string;
  observation: string;
  supportedClaim: string;
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
  status: TaskStatus;
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
