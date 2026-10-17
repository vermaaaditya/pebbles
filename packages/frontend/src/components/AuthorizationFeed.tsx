import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 font-mono text-xs">
      {/* Header & Filter Bar */}
      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400" />
          <span className="font-bold text-zinc-200 uppercase tracking-widest text-[11px]">
            AUDIT_LEDGER // GOVERNED_DECISIONS
          </span>
          <span className="text-[10px] text-zinc-500">[{authorizations.length}]</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          {(['all', 'ALLOW', 'HOLD', 'DENY'] as AuthFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-1.5 py-0.5 uppercase border transition-none ${
                filter === tab
                  ? 'bg-zinc-100 text-black border-zinc-100 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              [{tab}]
            </button>
          ))}
        </div>
      </div>

      {/* Decision List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar text-[11px]">
        {filteredAuths.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-zinc-600 italic">
            NO_DECISIONS_EVALUATED
          </div>
        ) : (
          filteredAuths.map((auth) => {
            const isAllow = auth.decision === 'ALLOW';
            const isHold = auth.decision === 'HOLD';

            const cardBorder = isAllow
              ? 'border-emerald-900/60 bg-emerald-950/10'
              : isHold
              ? 'border-amber-700/70 bg-amber-950/20'
              : 'border-rose-900/60 bg-rose-950/10';

            return (
              <div
                key={auth.id}
                className={`p-2.5 border ${cardBorder} transition-none space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 uppercase">
                      [{auth.agent}_AGENT]
                    </span>
                    <span className="text-zinc-600">-&gt;</span>
                    <code className="text-zinc-300 bg-zinc-900 px-1 py-0.2 border border-zinc-800 text-[10px]">
                      {auth.action}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                      {auth.providerMode === 'armoriq' ? 'ARMORIQ_ED25519' : 'LOCAL_DEV'}
                    </span>
                    <StatusBadge status={auth.decision} size="sm" />
                  </div>
                </div>

                <div className="text-[11px] font-sans text-zinc-300 leading-snug p-2 bg-zinc-900 border border-zinc-800">
                  <span className="font-mono text-zinc-500 text-[10px] uppercase font-bold mr-1">
                    POLICY_REASON:
                  </span>
                  {auth.reason}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span className="truncate max-w-[220px]" title={auth.target}>
                    TARGET: <code className="text-zinc-300">{auth.target}</code>
                  </span>
                  <span>
                    EXECUTION: <strong className="text-zinc-300 uppercase">[{auth.executionStatus}]</strong>
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
