export type AgentRole = 'lead' | 'research' | 'builder';

export type DecisionType = 'ALLOW' | 'HOLD' | 'DENY';

export interface AuthorizationRequest {
  agent: AgentRole;
  action: string; // e.g. 'workspace_write_file', 'workspace_run_tests', 'workspace_read_file'
  target: string; // e.g. 'src/calculator.js' or 'npm test'
  params?: Record<string, any>;
  planId?: string;
  subtaskId?: string;
  context?: {
    justification?: string;
    userPrompt?: string;
  };
}

export interface AuthorizationResult {
  decision: DecisionType;
  reason: string;
  providerMode: 'armoriq' | 'local_policy';
  isProductionArmorIQ: boolean;
  timestamp: string;
  traceId?: string;
  delegationId?: string;
  matchedPolicy?: string;
  details?: Record<string, any>;
}

export interface IAuthorizationProvider {
  /**
   * Evaluates an agent's intended action against governance policy before tool execution.
   */
  authorize(request: AuthorizationRequest): Promise<AuthorizationResult>;

  /**
   * Resolves a held authorization decision (e.g. human in the loop approval).
   */
  handleHold(delegationId: string, approved: boolean): Promise<boolean>;

  /**
   * Returns current provider mode.
   */
  getMode(): 'armoriq' | 'local_policy';

  /**
   * Checks whether the provider is properly configured and operational.
   */
  isConfigured(): boolean;

  /**
   * Returns human-readable status description for UI diagnostics.
   */
  getStatusSummary(): {
    mode: 'armoriq' | 'local_policy';
    isReady: boolean;
    label: string;
    description: string;
  };
}
