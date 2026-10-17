import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let badgeStyle = 'bg-pebble-900/80 text-pebble-300 border-pebble-700/60';
  let dotStyle = 'bg-pebble-500';
  let ping = false;

  if (norm === 'completed' || norm === 'allow' || norm === 'passed') {
    badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/40';
    dotStyle = 'bg-emerald-400';
  } else if (norm === 'running' || norm === 'in_progress' || norm === 'planning') {
    badgeStyle = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950/40';
    dotStyle = 'bg-cyan-400';
    ping = true;
  } else if (norm === 'held' || norm === 'hold') {
    badgeStyle = 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/50';
    dotStyle = 'bg-amber-400';
    ping = true;
  } else if (norm === 'failed' || norm === 'deny' || norm === 'blocked') {
    badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/40';
    dotStyle = 'bg-rose-400';
  } else if (norm === 'pending') {
    badgeStyle = 'bg-pebble-900/60 text-pebble-400 border-pebble-800';
    dotStyle = 'bg-pebble-600';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border backdrop-blur-sm tracking-tight ${px} ${badgeStyle}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotStyle}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotStyle}`} />
      </span>
      <span className="uppercase">{status.replace('_', ' ')}</span>
    </span>
  );
};
