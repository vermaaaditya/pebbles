import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, Lock, Fingerprint } from 'lucide-react';
import { AuthorizationRecord } from '../api/client';
import { StatusBadge } from './StatusBadge';

interface AuthorizationFeedProps {
  authorizations: AuthorizationRecord[];
}

type AuthFilter = 'all' | 'ALLOW' | 'HOLD' | 'DENY';

export const AuthorizationFeed: React.FC<AuthorizationFeedProps> = ({ authorizations }) => {
  const [filter, setFilter] = useState<AuthFilter>('all');

  const filteredAuths = authorizations.filter((a) => {
    if (filter === 'all') return true;
    return a.decision === filter;
  });

  return (
    <div className="flex flex-col h-full bg-pebble-950/90 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner backdrop-blur-sm">
      {/* Header & Filter Bar */}
      <div className="px-4 py-2.5 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider font-mono">
            Governed Authority Decisions
          </h3>
          <span className="text-[10px] bg-pebble-800 text-pebble-400 px-1.5 py-0.5 rounded font-mono">
            {authorizations.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {(['all', 'ALLOW', 'HOLD', 'DENY'] as AuthFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded transition-all ${
                filter === tab
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold'
                  : 'text-pebble-500 hover:text-pebble-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Decision List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 font-mono text-xs custom-scrollbar">
        {filteredAuths.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-pebble-600 text-xs italic">
            {authorizations.length === 0
              ? 'No authorization gates evaluated yet.'
              : 'No decisions match the selected filter.'}
          </div>
        ) : (
          filteredAuths.map((auth) => {
            const isAllow = auth.decision === 'ALLOW';
            const isHold = auth.decision === 'HOLD';

            const cardBorder = isAllow
              ? 'border-emerald-500/25 bg-emerald-950/15 hover:border-emerald-500/40'
              : isHold
              ? 'border-amber-500/35 bg-amber-950/25 hover:border-amber-500/50'
              : 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/40';

            const Icon = isAllow ? ShieldCheck : isHold ? ShieldAlert : AlertOctagon;
            const iconColor = isAllow
              ? 'text-emerald-400'
              : isHold
              ? 'text-amber-400'
              : 'text-rose-400';

            return (
              <div
                key={auth.id}
                className={`p-3 rounded-xl border ${cardBorder} transition-all space-y-2 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
                    <span className="font-semibold text-white capitalize text-xs">
                      {auth.agent} Pebble
                    </span>
                    <span className="text-pebble-500">→</span>
                    <code className="text-cyan-300 bg-pebble-950 px-1.5 py-0.5 rounded border border-pebble-800 text-[11px]">
                      {auth.action}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-pebble-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      {auth.providerMode === 'armoriq' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" />
                          ARMORIQ
                        </span>
                      ) : (
                        <span className="text-cyan-400">DEV POLICY</span>
                      )}
                    </span>
                    <StatusBadge status={auth.decision} size="sm" />
                  </div>
                </div>

                <div className="text-[11px] font-sans text-pebble-300 leading-relaxed bg-pebble-950/40 p-2 rounded-lg border border-pebble-800/50">
                  <span className="font-semibold text-pebble-200 font-mono">Policy Reason: </span>
                  {auth.reason}
                </div>

                <div className="flex items-center justify-between text-[10px] text-pebble-500 pt-1 border-t border-pebble-800/40">
                  <span className="truncate max-w-[200px]" title={auth.target}>
                    Target: <code className="text-pebble-300">{auth.target}</code>
                  </span>
                  <span>
                    Status: <strong className="text-pebble-300 uppercase">{auth.executionStatus}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
