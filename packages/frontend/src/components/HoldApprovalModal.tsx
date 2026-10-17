import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { AuthorizationRecord } from '../api/client';

interface HoldApprovalModalProps {
  heldRecord: AuthorizationRecord;
  onApprove: (delegationId: string) => void;
  onReject: (delegationId: string) => void;
  isSubmitting?: boolean;
}

export const HoldApprovalModal: React.FC<HoldApprovalModalProps> = ({
  heldRecord,
  onApprove,
  onReject,
  isSubmitting,
}) => {
  return (
    <div className="relative p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-pebble-900/90 to-amber-950/80 shadow-2xl shadow-amber-950/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 shadow-inner mt-0.5 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-600/50 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                HOLD Gate Active
              </span>
              <span className="text-xs text-pebble-300">
                Action halted pending human supervisor sign-off
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Agent</span>
              <span className="text-cyan-400 font-mono capitalize px-2 py-0.5 rounded bg-pebble-950 border border-pebble-800">
                {heldRecord.agent} Pebble
              </span>
              <span>requested</span>
              <code className="text-amber-300 font-mono text-xs bg-pebble-950 px-2 py-0.5 rounded border border-amber-500/30">
                {heldRecord.action}
              </code>
            </h4>

            <div className="mt-2 text-xs text-pebble-300 leading-relaxed max-w-2xl bg-pebble-950/50 p-2.5 rounded-lg border border-pebble-800/80">
              <span className="font-semibold text-amber-400 font-mono">Policy Reason: </span>
              {heldRecord.reason}
            </div>

            <div className="mt-2.5 flex items-center gap-4 text-xs font-mono text-pebble-400 flex-wrap">
              <span>
                Target Path: <strong className="text-pebble-100 font-semibold">{heldRecord.target}</strong>
              </span>
              {heldRecord.delegationId && (
                <span className="flex items-center gap-1 text-[11px]">
                  <KeyRound className="w-3 h-3 text-cyan-400" />
                  ID: <code className="text-cyan-300">{heldRecord.delegationId.slice(0, 18)}...</code>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onReject(heldRecord.delegationId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 hover:text-white text-xs font-medium transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>Deny & Abort Action</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onApprove(heldRecord.delegationId)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-pebble-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Cryptographically Approve</span>
          </button>
        </div>
      </div>
    </div>
  );
};
