import {
  IAuthorizationProvider,
  AuthorizationRequest,
  AuthorizationResult,
} from './types.js';
import {
  ArmorIQClient,
  ArmorIQSession,
  EnforceResult,
  PolicyBlockedException,
  PolicyHoldException,
} from '@armoriq/sdk';
import crypto from 'crypto';

export interface ArmorIQConfig {
  apiKey?: string;
  userEmail?: string;
  baseUrl?: string;
  policyScope?: string;
}

export class ArmorIQAuthorizationProvider implements IAuthorizationProvider {
  private client: ArmorIQClient | null = null;
  private session: ArmorIQSession | null = null;
  private readonly config: ArmorIQConfig;
  private readonly pendingHolds = new Map<string, {
    request: AuthorizationRequest;
    resolve: (approved: boolean) => void;
    timestamp: number;
  }>();

  constructor(config: ArmorIQConfig) {
    this.config = config;
    if (this.isConfigured()) {
      try {
        this.client = new ArmorIQClient({
          apiKey: config.apiKey!,
          backendEndpoint: config.baseUrl || 'https://api.armoriq.ai',
          agentId: 'pebbles-workforce',
          userId: config.userEmail || 'developer@example.com',
        });
        const userScope = this.client.forUser(config.userEmail || 'developer@example.com');
        this.session = userScope.startSession({
          mode: 'sdk',
          defaultMcpName: 'workspace',
        });
      } catch (err) {
        console.error('[ArmorIQProvider] Initialization error:', err);
        this.client = null;
        this.session = null;
      }
    }
  }

  public getMode(): 'armoriq' {
    return 'armoriq';
  }

  public isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 5);
  }

  public getStatusSummary() {
    const configured = this.isConfigured();
    return {
      mode: 'armoriq' as const,
      isReady: configured,
      label: configured ? 'ArmorIQ Production Enforcement' : 'ArmorIQ (Unconfigured - Fail Closed)',
      description: configured
        ? 'Real cryptographic intent verification and policy enforcement active via ArmorIQ control plane.'
        : 'ARMORIQ_API_KEY is missing or invalid. In production mode, all protected tool execution fails closed.',
    };
  }

  public async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const timestamp = new Date().toISOString();

    // FAIL CLOSED if unconfigured in production ArmorIQ mode
    if (!this.isConfigured() || !this.client) {
      return {
        decision: 'DENY',
        reason: 'ArmorIQ credentials not configured. In production ArmorIQ mode, protected actions fail closed for safety.',
        providerMode: 'armoriq',
        isProductionArmorIQ: true,
        timestamp,
        details: {
          configMissing: ['ARMORIQ_API_KEY'],
          requestedAction: request.action,
          agent: request.agent,
        },
      };
    }

    try {
      // Map tool call to ArmorIQ evaluation
      const toolName = request.action;
      const toolArgs = {
        target: request.target,
        agent: request.agent,
        ...request.params,
      };

      let enforceResult: EnforceResult;

      if (this.session) {
        if (!this.session.currentTokenValue) {
          try {
            await this.session.startPlan(
              [
                { name: toolName, args: toolArgs },
                { name: 'workspace_list_files', args: { path: '.' } },
                { name: 'workspace_read_file', args: { path: 'src/calculator.js' } },
                { name: 'workspace_search_files', args: { query: 'calculateInvoice' } },
                { name: 'workspace_write_file', args: { path: 'src/calculator.js' } },
                { name: 'workspace_run_tests', args: { command: 'node' } },
              ],
              request.context?.userPrompt || 'Autonomous software development execution'
            );
          } catch (planErr) {
            console.warn('[ArmorIQProvider] startPlan note:', planErr);
          }
        }
        // Enforce through genuine ArmorIQ session
        enforceResult = await this.session.enforce(toolName, toolArgs);
      } else {
        // Fallback to client invoke check if session unavailable
        throw new Error('ArmorIQ active session is not initialized.');
      }

      // Flush telemetry to ArmorIQ cloud dashboard
      this.session?.flushObservability().catch(() => {});

      if (enforceResult.action === 'allow' || enforceResult.allowed) {
        return {
          decision: 'ALLOW',
          reason: enforceResult.reason || 'Cryptographic intent verified and policy approved by ArmorIQ.',
          providerMode: 'armoriq',
          isProductionArmorIQ: true,
          timestamp,
          matchedPolicy: enforceResult.matchedPolicy,
          details: {
            obligations: enforceResult.obligations,
          },
        };
      } else if (enforceResult.action === 'hold') {
        const delegationId = enforceResult.delegationId || `hold_${crypto.randomUUID()}`;
        return {
          decision: 'HOLD',
          reason: enforceResult.reason || 'Operation held pending human authorization by ArmorIQ policy.',
          providerMode: 'armoriq',
          isProductionArmorIQ: true,
          timestamp,
          delegationId,
          matchedPolicy: enforceResult.matchedPolicy,
        };
      } else {
        // Explicitly blocked by ArmorIQ policy
        return {
          decision: 'DENY',
          reason: enforceResult.reason || 'Demonstrably blocked by ArmorIQ intent/policy verification.',
          providerMode: 'armoriq',
          isProductionArmorIQ: true,
          timestamp,
          matchedPolicy: enforceResult.matchedPolicy,
        };
      }
    } catch (err: any) {
      // Handle known ArmorIQ exceptions
      if (err instanceof PolicyBlockedException) {
        return {
          decision: 'DENY',
          reason: `ArmorIQ Policy Blocked: ${err.message}`,
          providerMode: 'armoriq',
          isProductionArmorIQ: true,
          timestamp,
        };
      }

      if (err instanceof PolicyHoldException) {
        const delegationId = `hold_${crypto.randomUUID()}`;
        return {
          decision: 'HOLD',
          reason: `ArmorIQ Policy Hold: ${err.message}`,
          providerMode: 'armoriq',
          isProductionArmorIQ: true,
          timestamp,
          delegationId,
        };
      }

      // Any unexpected error or API rejection fails closed
      return {
        decision: 'DENY',
        reason: `ArmorIQ verification failed: ${err.message || String(err)} (Failing closed for safety).`,
        providerMode: 'armoriq',
        isProductionArmorIQ: true,
        timestamp,
        details: {
          errorType: err.name,
        },
      };
    }
  }

  public async handleHold(delegationId: string, approved: boolean): Promise<boolean> {
    const pending = this.pendingHolds.get(delegationId);
    if (pending) {
      pending.resolve(approved);
      this.pendingHolds.delete(delegationId);
      return true;
    }
    return false;
  }
}
