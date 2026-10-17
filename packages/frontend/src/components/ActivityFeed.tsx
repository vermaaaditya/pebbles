import React, { useState } from 'react';
import { Terminal, Shield, Check, AlertTriangle } from 'lucide-react';
import { ActivityEvent } from '../api/client';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

type FeedFilter = 'all' | 'tools' | 'governance' | 'errors';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'tools') return e.type === 'tool_call' || e.type === 'tool_result';
    if (filter === 'governance') return e.type === 'auth_decision' || e.type === 'hold_requested';
    if (filter === 'errors') return e.type === 'error' || e.type === 'task_failed' || e.message.includes('error');
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 font-mono text-xs">
      {/* Header with Filters */}
      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400" />
          <span className="font-bold text-zinc-200 uppercase tracking-widest text-[11px]">
            EVENT_STREAM // REALTIME_STDOUT
          </span>
          <span className="text-[10px] text-zinc-500">[{events.length}]</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          {(['all', 'tools', 'governance', 'errors'] as FeedFilter[]).map((tab) => (
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

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar text-[11px]">
        {filteredEvents.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-zinc-600 italic">
            NO_EVENTS_RECORDED
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-2 border border-zinc-900 bg-zinc-950/80 hover:border-zinc-800 transition-none"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-400 uppercase">
                    [{evt.agent}_AGENT]
                  </span>
                  <span className="text-zinc-600 font-mono">
                    TYPE:{evt.type.toUpperCase()}
                  </span>
                </div>
                <span>
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-zinc-200 mt-1 font-sans text-xs leading-relaxed">
                {evt.message}
              </div>

              {evt.data?.tool && (
                <div className="mt-1.5 p-1.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono">
                  <span className="text-zinc-500">TOOL_INVOCATION:</span> {evt.data.tool}{' '}
                  {evt.data.path && <span className="text-zinc-400">({evt.data.path})</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
