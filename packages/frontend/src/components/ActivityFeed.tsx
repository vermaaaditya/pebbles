import React from 'react';
import {
  Compass,
  Search,
  Hammer,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { ActivityEvent } from '../api/client';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  const getEventIcon = (event: ActivityEvent) => {
    switch (event.type) {
      case 'plan_created':
        return <Compass className="w-4 h-4 text-violet-400" />;
      case 'agent_started':
        if (event.agent === 'research') return <Search className="w-4 h-4 text-cyan-400" />;
        if (event.agent === 'builder') return <Hammer className="w-4 h-4 text-amber-400" />;
        return <PlayCircle className="w-4 h-4 text-violet-400" />;
      case 'tool_call':
      case 'tool_result':
        return <Terminal className="w-4 h-4 text-cyan-400" />;
      case 'auth_decision':
        if (event.message.includes('[ALLOW]')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
        if (event.message.includes('[HOLD]')) return <ShieldAlert className="w-4 h-4 text-amber-400" />;
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'hold_requested':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'subtask_completed':
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'task_failed':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Terminal className="w-4 h-4 text-pebble-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-pebble-950 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner">
      <div className="px-4 py-3 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider">
            Live Activity Feed
          </h3>
        </div>
        <span className="text-[11px] font-mono text-pebble-400">
          {events.length} events recorded
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-pebble-600 text-xs italic">
            Waiting for activity events...
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="group flex items-start gap-3 p-2.5 rounded-lg bg-pebble-900/40 hover:bg-pebble-900/80 border border-pebble-800/40 transition-colors"
            >
              <div className="mt-0.5 p-1 rounded bg-pebble-800/60 border border-pebble-700/50 shrink-0">
                {getEventIcon(evt)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-pebble-300 capitalize text-[11px]">
                    {evt.agent} Pebble
                  </span>
                  <span className="text-[10px] text-pebble-500">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-pebble-200 mt-1 break-words font-sans text-xs leading-relaxed">
                  {evt.message}
                </p>

                {/* Optional nested details */}
                {evt.data?.tool && (
                  <div className="mt-1.5 p-1.5 rounded bg-pebble-950/80 border border-pebble-800/60 text-[11px] text-cyan-300">
                    <span className="text-pebble-500">tool:</span> {evt.data.tool}{' '}
                    {evt.data.path && <span className="text-pebble-400">({evt.data.path})</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
