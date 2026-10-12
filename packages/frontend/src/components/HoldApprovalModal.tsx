import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
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
    <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-pebble-900 to-amber-950/70 shadow-xl shadow-amber-950/30 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                HOLD Decision Triggered
              </span>
              <span className="text-xs text-pebble-400">
                Action requires explicit governance approval
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white mt-1">
              Agent <span className="text-cyan-400 capitalize">{heldRecord.agent} Pebble</span> requested{' '}
              <code className="text-amber-300 font-mono text-xs bg-pebble-950 px-1.5 py-0.5 rounded border border-pebble-800">
                {heldRecord.action}
              </code>
            </h4>

            <p className="text-xs text-pebble-300 mt-1.5 leading-relaxed">
              <span className="font-semibold text-pebble-200">Policy Reason:</span> {heldRecord.reason}
            </p>

            <div className="mt-2 flex items-center gap-4 text-xs font-mono text-pebble-400">
              <span>Target: <strong className="text-pebble-200">{heldRecord.target}</strong></span>
              {heldRecord.delegationId && (
                <span>Delegation ID: <strong className="text-pebble-300">{heldRecord.delegationId.slice(0, 16)}...</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onReject(heldRecord.delegationId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onApprove(heldRecord.delegationId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-pebble-950 text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Action</span>
          </button>
        </div>
      </div>
    </div>
  );
};
