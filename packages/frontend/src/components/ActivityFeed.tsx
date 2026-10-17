import React, { useState } from 'react';
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
  Filter,
} from 'lucide-react';
import { ActivityEvent } from '../api/client';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

type FeedFilter = 'all' | 'agents' | 'tools' | 'governance' | 'errors';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const getEventIcon = (event: ActivityEvent) => {
    switch (event.type) {
      case 'plan_created':
        return <Compass className="w-3.5 h-3.5 text-violet-400" />;
      case 'agent_started':
        if (event.agent === 'research') return <Search className="w-3.5 h-3.5 text-cyan-400" />;
        if (event.agent === 'builder') return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
        return <PlayCircle className="w-3.5 h-3.5 text-violet-400" />;
      case 'tool_call':
      case 'tool_result':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case 'auth_decision':
        if (event.message.includes('[ALLOW]')) return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
        if (event.message.includes('[HOLD]')) return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'hold_requested':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'subtask_completed':
      case 'task_completed':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'task_failed':
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-pebble-400" />;
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'agents') return e.type === 'agent_started' || e.type === 'plan_created';
    if (filter === 'tools') return e.type === 'tool_call' || e.type === 'tool_result';
    if (filter === 'governance') return e.type === 'auth_decision' || e.type === 'hold_requested';
    if (filter === 'errors') return e.type === 'error' || e.type === 'task_failed' || e.message.includes('error');
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-pebble-950/90 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner backdrop-blur-sm">
      {/* Header with Filters */}
      <div className="px-4 py-2.5 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider font-mono">
            Live Activity Feed
          </h3>
          <span className="text-[10px] bg-pebble-800 text-pebble-400 px-1.5 py-0.5 rounded font-mono">
            {events.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {(['all', 'tools', 'governance', 'errors'] as FeedFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-all ${
                filter === tab
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-pebble-500 hover:text-pebble-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 font-mono text-xs custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-pebble-600 text-xs italic">
            {events.length === 0 ? 'Waiting for activity events...' : 'No events match the selected filter.'}
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="group flex items-start gap-2.5 p-2.5 rounded-lg bg-pebble-900/40 hover:bg-pebble-900/80 border border-pebble-800/50 hover:border-pebble-700/80 transition-all"
            >
              <div className="mt-0.5 p-1 rounded-md bg-pebble-800/70 border border-pebble-700/50 shrink-0">
                {getEventIcon(evt)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-pebble-300 capitalize text-[11px] font-mono">
                    {evt.agent} Pebble
                  </span>
                  <span className="text-[10px] text-pebble-500 font-mono">
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
                  <div className="mt-1.5 p-2 rounded-md bg-pebble-950/80 border border-pebble-800/80 text-[11px] text-cyan-300 flex items-center gap-2">
                    <span className="text-pebble-500 font-mono">mcp::tool:</span>
                    <code className="text-cyan-400 font-semibold">{evt.data.tool}</code>
                    {evt.data.path && (
                      <span className="text-pebble-400 truncate font-mono text-[10px]">
                        ({evt.data.path})
                      </span>
                    )}
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
