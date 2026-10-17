import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let border = 'border-zinc-800 text-zinc-400 bg-zinc-900/60';
  let pip = 'bg-zinc-500';

  if (norm === 'completed' || norm === 'allow' || norm === 'passed') {
    border = 'border-emerald-600/60 text-emerald-400 bg-emerald-950/30';
    pip = 'bg-emerald-400';
  } else if (norm === 'running' || norm === 'in_progress' || norm === 'planning') {
    border = 'border-cyan-600/60 text-cyan-400 bg-cyan-950/30';
    pip = 'bg-cyan-400';
  } else if (norm === 'held' || norm === 'hold') {
    border = 'border-amber-600/70 text-amber-300 bg-amber-950/40';
    pip = 'bg-amber-400';
  } else if (norm === 'failed' || norm === 'deny' || norm === 'blocked') {
    border = 'border-rose-600/60 text-rose-400 bg-rose-950/30';
    pip = 'bg-rose-400';
  } else if (norm === 'pending') {
    border = 'border-zinc-800 text-zinc-500 bg-zinc-950';
    pip = 'bg-zinc-600';
  }

  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider border rounded-none ${px} ${border}`}
    >
      <span className={`w-1 h-1 shrink-0 ${pip}`} />
      <span>{status.replace('_', ' ')}</span>
    </span>
  );
};
