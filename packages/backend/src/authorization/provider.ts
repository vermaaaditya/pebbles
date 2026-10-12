import { IAuthorizationProvider } from './types.js';
import { ArmorIQAuthorizationProvider } from './armoriq-provider.js';
import { LocalPolicyAuthorizationProvider } from './local-policy-provider.js';
import { AppConfig } from '../config.js';

export * from './types.js';
export * from './armoriq-provider.js';
export * from './local-policy-provider.js';

export function createAuthorizationProvider(config: AppConfig): IAuthorizationProvider {
  if (config.authorization.mode === 'armoriq') {
    return new ArmorIQAuthorizationProvider({
      apiKey: config.authorization.apiKey,
      userEmail: config.authorization.userEmail,
      baseUrl: config.authorization.baseUrl,
      policyScope: config.authorization.policyScope,
    });
  }

  // Explicitly labelled local development mode
  return new LocalPolicyAuthorizationProvider();
}
