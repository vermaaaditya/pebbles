import {
  IAuthorizationProvider,
  AuthorizationRequest,
  AuthorizationResult,
  DecisionType,
} from './types.js';
import crypto from 'crypto';

interface PendingHold {
  delegationId: string;
  request: AuthorizationRequest;
  timestamp: string;
  resolve: (decision: DecisionType) => void;
}

export class LocalPolicyAuthorizationProvider implements IAuthorizationProvider {
  private readonly pendingHolds = new Map<string, PendingHold>();

  public getMode(): 'local_policy' {
    return 'local_policy';
  }

  public isConfigured(): boolean {
    return true; // Local development policy mode is always available
  }

  public getStatusSummary() {
    return {
      mode: 'local_policy' as const,
      isReady: true,
      label: 'Local Development Policy Mode',
      description:
        'Running explicitly labelled local development policy engine. Scopes and safety gates are enforced locally. (Never represented as ArmorIQ decisions).',
    };
  }

  public async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const timestamp = new Date().toISOString();
    const action = request.action;
    const target = request.target || '';
    const agent = request.agent;

    // Rule 1: Prevent any agent from accessing secrets / sensitive environment files
    const sensitiveFilePatterns = [/\.env($|\..*)/i, /id_rsa/i, /\.gitconfig/i, /credentials/i, /secrets/i];
    if (sensitiveFilePatterns.some(pattern => pattern.test(target))) {
      return {
        decision: 'DENY',
        reason: `[LOCAL_DEV_POLICY] Blocked access to sensitive credential or configuration target: "${target}"`,
        providerMode: 'local_policy',
        isProductionArmorIQ: false,
        timestamp,
        matchedPolicy: 'policy-deny-sensitive-credentials',
      };
    }

    // Rule 2: Research Pebble Role Enforcement (Strictly Read-Only)
    if (agent === 'research') {
      if (action === 'workspace_write_file') {
        return {
          decision: 'DENY',
          reason: `[LOCAL_DEV_POLICY] Research Pebble is restricted to read-only authority. File modification "${target}" is forbidden.`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-research-read-only',
        };
      }
      if (action === 'workspace_run_tests') {
        return {
          decision: 'DENY',
          reason: `[LOCAL_DEV_POLICY] Research Pebble is restricted to inspection. Test execution must be performed by Builder Pebble.`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-research-read-only',
        };
      }
      // Allowed read tools
      if (['workspace_list_files', 'workspace_read_file', 'workspace_search_files'].includes(action)) {
        return {
          decision: 'ALLOW',
          reason: `[LOCAL_DEV_POLICY] Research Pebble read-only tool access permitted for target: "${target || '.'}"`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-research-read-permitted',
        };
      }
    }

    // Rule 3: Builder Pebble Role Enforcement
    if (agent === 'builder') {
      // Builder can read files
      if (['workspace_list_files', 'workspace_read_file', 'workspace_search_files'].includes(action)) {
        return {
          decision: 'ALLOW',
          reason: `[LOCAL_DEV_POLICY] Builder Pebble workspace read permitted for target: "${target}"`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-builder-read-permitted',
        };
      }

      // Builder write file policy
      if (action === 'workspace_write_file') {
        // High impact files (e.g. package.json or root build config) trigger a HOLD for human review
        if (target.endsWith('package.json') || target.endsWith('tsconfig.json')) {
          const delegationId = `hold_${crypto.randomUUID()}`;
          return {
            decision: 'HOLD',
            reason: `[LOCAL_DEV_POLICY] Critical dependency/configuration modification on "${target}" placed on HOLD for human approval.`,
            providerMode: 'local_policy',
            isProductionArmorIQ: false,
            timestamp,
            delegationId,
            matchedPolicy: 'policy-builder-critical-file-hold',
          };
        }

        // Standard source file modification is permitted within workspace
        return {
          decision: 'ALLOW',
          reason: `[LOCAL_DEV_POLICY] Builder Pebble permitted to modify source code in workspace: "${target}"`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-builder-workspace-write-permitted',
        };
      }

      // Builder run tests policy
      if (action === 'workspace_run_tests') {
        return {
          decision: 'ALLOW',
          reason: `[LOCAL_DEV_POLICY] Builder Pebble permitted to execute sandboxed test suite: "${target}"`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-builder-tests-permitted',
        };
      }
    }

    // Rule 4: Lead Pebble Coordination Scope
    if (agent === 'lead') {
      // Lead pebble coordinates; direct destructive file modifications should be delegated to Builder
      if (action === 'workspace_write_file') {
        return {
          decision: 'DENY',
          reason: `[LOCAL_DEV_POLICY] Lead Pebble must delegate workspace file modifications to Builder Pebble.`,
          providerMode: 'local_policy',
          isProductionArmorIQ: false,
          timestamp,
          matchedPolicy: 'policy-lead-delegation-required',
        };
      }

      // Reading or planning tools allowed
      return {
        decision: 'ALLOW',
        reason: `[LOCAL_DEV_POLICY] Lead Pebble orchestration action permitted.`,
        providerMode: 'local_policy',
        isProductionArmorIQ: false,
        timestamp,
        matchedPolicy: 'policy-lead-orchestration-permitted',
      };
    }

    // Default safety deny
    return {
      decision: 'DENY',
      reason: `[LOCAL_DEV_POLICY] Action "${action}" not recognized or permitted for agent role "${agent}".`,
      providerMode: 'local_policy',
      isProductionArmorIQ: false,
      timestamp,
      matchedPolicy: 'policy-default-deny',
    };
  }

  public registerPendingHold(
    delegationId: string,
    request: AuthorizationRequest,
    resolve: (decision: DecisionType) => void
  ): void {
    this.pendingHolds.set(delegationId, {
      delegationId,
      request,
      timestamp: new Date().toISOString(),
      resolve,
    });
  }

  public async handleHold(delegationId: string, approved: boolean): Promise<boolean> {
    const pending = this.pendingHolds.get(delegationId);
    if (!pending) {
      return false;
    }
    pending.resolve(approved ? 'ALLOW' : 'DENY');
    this.pendingHolds.delete(delegationId);
    return true;
  }

  public getPendingHolds(): Array<{ delegationId: string; request: AuthorizationRequest; timestamp: string }> {
    return Array.from(this.pendingHolds.values()).map(h => ({
      delegationId: h.delegationId,
      request: h.request,
      timestamp: h.timestamp,
    }));
  }
}
