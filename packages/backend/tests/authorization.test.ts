import { describe, it, expect } from 'vitest';
import { ArmorIQAuthorizationProvider } from '../src/authorization/armoriq-provider.js';
import { LocalPolicyAuthorizationProvider } from '../src/authorization/local-policy-provider.js';

describe('Authorization Provider Security Governance', () => {
  describe('ArmorIQ Production Provider (Fail-Closed)', () => {
    it('fails closed when unconfigured (DENY for protected operations)', async () => {
      const provider = new ArmorIQAuthorizationProvider({});
      expect(provider.isConfigured()).toBe(false);

      const decision = await provider.authorize({
        agent: 'builder',
        action: 'workspace_write_file',
        target: 'src/main.js',
      });

      expect(decision.decision).toBe('DENY');
      expect(decision.isProductionArmorIQ).toBe(true);
      expect(decision.reason).toContain('fail closed');
    });
  });

  describe('Local Development Policy Engine', () => {
    const provider = new LocalPolicyAuthorizationProvider();

    it('identifies itself strictly as local development policy mode', () => {
      expect(provider.getMode()).toBe('local_policy');
      expect(provider.getStatusSummary().label).toContain('Local Development Policy');
    });

    it('strictly denies Research Pebble from modifying files', async () => {
      const result = await provider.authorize({
        agent: 'research',
        action: 'workspace_write_file',
        target: 'src/calculator.js',
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('read-only authority');
      expect(result.isProductionArmorIQ).toBe(false);
    });

    it('strictly denies Research Pebble from running tests', async () => {
      const result = await provider.authorize({
        agent: 'research',
        action: 'workspace_run_tests',
        target: 'npm test',
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Research Pebble is restricted to inspection');
    });

    it('permits Research Pebble to read and search files', async () => {
      const result = await provider.authorize({
        agent: 'research',
        action: 'workspace_read_file',
        target: 'src/calculator.js',
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('permits Builder Pebble to modify source files within workspace', async () => {
      const result = await provider.authorize({
        agent: 'builder',
        action: 'workspace_write_file',
        target: 'src/calculator.js',
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('triggers HOLD for critical configuration files like package.json', async () => {
      const result = await provider.authorize({
        agent: 'builder',
        action: 'workspace_write_file',
        target: 'package.json',
      });

      expect(result.decision).toBe('HOLD');
      expect(result.delegationId).toBeDefined();
    });

    it('blocks all agents from accessing sensitive credential files (.env)', async () => {
      const result = await provider.authorize({
        agent: 'builder',
        action: 'workspace_read_file',
        target: '.env.local',
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Blocked access to sensitive credential');
    });
  });
});
