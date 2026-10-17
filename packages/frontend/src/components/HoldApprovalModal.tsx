import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
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
    <div className="border-2 border-amber-500 bg-zinc-950 p-4 font-mono text-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 text-[10px] uppercase">
              HOLD GATE TRIGGERED
            </span>
            <span className="text-zinc-400 text-[11px]">
              ACTION SUSPENDED PENDING SUPERVISOR AUTHORIZATION
            </span>
          </div>

          <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400">AGENT:</span>
            <span className="text-zinc-200 uppercase">{heldRecord.agent} Pebble</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">ACTION:</span>
            <span className="bg-zinc-900 border border-zinc-700 text-amber-300 px-1.5 py-0.5 text-xs">
              {heldRecord.action}
            </span>
          </div>

          <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 leading-relaxed font-sans text-xs">
            <span className="font-mono text-amber-400 font-bold uppercase mr-1">[REASON]:</span>
            {heldRecord.reason}
          </div>

          <div className="flex items-center gap-4 text-[10px] text-zinc-500 flex-wrap">
            <span>TARGET: <code className="text-zinc-300">{heldRecord.target}</code></span>
            {heldRecord.delegationId && (
              <span>DELEGATION_ID: <code className="text-zinc-400">{heldRecord.delegationId}</code></span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onReject(heldRecord.delegationId)}
            className="flex items-center gap-1.5 px-3 py-2 border border-rose-600 bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white uppercase font-bold text-xs tracking-wider transition-none disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span>DENY_ACTION</span>
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => heldRecord.delegationId && onApprove(heldRecord.delegationId)}
            className="flex items-center gap-1.5 px-4 py-2 border border-emerald-500 bg-emerald-500 hover:bg-emerald-400 text-black uppercase font-bold text-xs tracking-wider transition-none disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>APPROVE & SIGN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
