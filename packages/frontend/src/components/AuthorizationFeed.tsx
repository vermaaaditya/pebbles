import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, Lock } from 'lucide-react';
import { AuthorizationRecord } from '../api/client';
import { StatusBadge } from './StatusBadge';

interface AuthorizationFeedProps {
  authorizations: AuthorizationRecord[];
}

export const AuthorizationFeed: React.FC<AuthorizationFeedProps> = ({ authorizations }) => {
  return (
    <div className="flex flex-col h-full bg-pebble-950 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner">
      <div className="px-4 py-3 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider">
            Governed Authority Decisions
          </h3>
        </div>
        <span className="text-[11px] font-mono text-pebble-400">
          {authorizations.length} checks evaluated
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {authorizations.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-pebble-600 text-xs italic">
            No authorization gates evaluated yet.
          </div>
        ) : (
          authorizations.map((auth) => {
            const isAllow = auth.decision === 'ALLOW';
            const isHold = auth.decision === 'HOLD';
            const isDeny = auth.decision === 'DENY';

            const cardBorder = isAllow
              ? 'border-emerald-500/20 bg-emerald-950/20'
              : isHold
              ? 'border-amber-500/30 bg-amber-950/30'
              : 'border-rose-500/30 bg-rose-950/30';

            const Icon = isAllow ? ShieldCheck : isHold ? ShieldAlert : AlertOctagon;
            const iconColor = isAllow
              ? 'text-emerald-400'
              : isHold
              ? 'text-amber-400'
              : 'text-rose-400';

            return (
              <div
                key={auth.id}
                className={`p-3 rounded-lg border ${cardBorder} transition-all space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="font-semibold text-white capitalize">
                      {auth.agent} Pebble
                    </span>
                    <span className="text-pebble-500">→</span>
                    <code className="text-cyan-300 bg-pebble-950 px-1 py-0.5 rounded border border-pebble-800 text-[11px]">
                      {auth.action}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-pebble-400 uppercase tracking-wider">
                      {auth.providerMode === 'armoriq' ? (
                        <span className="text-emerald-300 font-bold">ARMORIQ</span>
                      ) : (
                        <span className="text-cyan-300">DEV POLICY</span>
                      )}
                    </span>
                    <StatusBadge status={auth.decision} size="sm" />
                  </div>
                </div>

                <div className="text-[11px] font-sans text-pebble-300 leading-relaxed">
                  <span className="font-medium text-pebble-200">Reason:</span> {auth.reason}
                </div>

                <div className="flex items-center justify-between text-[10px] text-pebble-500 pt-1 border-t border-pebble-800/40">
                  <span>Target: <code className="text-pebble-300">{auth.target}</code></span>
                  <span>Execution: <strong className="text-pebble-300 uppercase">{auth.executionStatus}</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
