import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-pebble-800 text-pebble-300 border-pebble-700';

  if (norm === 'completed' || norm === 'allow' || norm === 'passed') {
    styles = 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30';
  } else if (norm === 'running' || norm === 'in_progress' || norm === 'planning') {
    styles = 'bg-cyan-950/70 text-cyan-400 border-cyan-500/30 animate-pulse';
  } else if (norm === 'held' || norm === 'hold') {
    styles = 'bg-amber-950/70 text-amber-400 border-amber-500/40 ring-1 ring-amber-500/20';
  } else if (norm === 'failed' || norm === 'deny' || norm === 'blocked') {
    styles = 'bg-rose-950/70 text-rose-400 border-rose-500/30';
  } else if (norm === 'pending') {
    styles = 'bg-pebble-900 text-pebble-400 border-pebble-800';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${px} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </span>
  );
};
