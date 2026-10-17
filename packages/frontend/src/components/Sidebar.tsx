import React, { useState } from 'react';
import { Plus, ShieldCheck, ShieldAlert, Cpu, Terminal, Layers, Search, Sparkles } from 'lucide-react';
import { TaskRecord, HealthInfo } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { TeammateRoster } from './TeammateRoster';

interface SidebarProps {
  tasks: TaskRecord[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onNewTask: () => void;
  health: HealthInfo | null;
  currentAgent?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
  onNewTask,
  health,
  currentAgent,
}) => {
  const [filter, setFilter] = useState('');
  const isArmorIQ = health?.authorization.mode === 'armoriq';
  const isConfigured = health?.authorization.configured;

  const filteredTasks = tasks.filter((t) =>
    t.prompt.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <aside className="w-80 bg-pebble-900/90 backdrop-blur-md border-r border-pebble-800/80 flex flex-col h-screen select-none z-10">
      {/* Brand Header */}
      <div className="p-4 border-b border-pebble-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-cyan-500/20 ring-1 ring-white/20">
              <span className="font-mono font-black text-white text-base tracking-tighter">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">Pebbles</h1>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800/60 font-semibold">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] text-pebble-400">Governed AI Workforce</p>
            </div>
          </div>
        </div>

        {/* Governance Mode Pill */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-pebble-950/70 border border-pebble-800/80 flex items-center justify-between text-xs transition-colors hover:border-pebble-700">
          <div className="flex items-center gap-2.5 min-w-0">
            {isArmorIQ ? (
              isConfigured ? (
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-500/30 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              )
            ) : (
              <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-pebble-200 text-xs truncate">
                {isArmorIQ ? 'ArmorIQ Production' : 'Local Policy Engine'}
              </div>
              <div className="text-[10px] text-pebble-400 truncate font-mono">
                {isArmorIQ
                  ? isConfigured
                    ? 'Cryptographic Ed25519 Verified'
                    : 'Fail-closed active (no API key)'
                  : 'Explicit Local Dev (Safe)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Button */}
      <div className="p-3 border-b border-pebble-800/60">
        <button
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-pebble-950 font-semibold text-xs tracking-tight transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Governed Task</span>
        </button>
      </div>

      {/* Middle Content: Task History + Teammates */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {/* Previous Tasks */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold text-pebble-400 uppercase tracking-wider font-mono">
              Task History
            </span>
            <span className="text-[10px] bg-pebble-800 text-pebble-400 px-1.5 py-0.5 rounded font-mono">
              {tasks.length}
            </span>
          </div>

          {tasks.length > 3 && (
            <div className="mb-2.5 relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-pebble-500" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-pebble-950 border border-pebble-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-pebble-200 placeholder-pebble-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}

          <div className="space-y-1.5">
            {filteredTasks.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-pebble-800/80 rounded-xl text-xs text-pebble-500">
                {tasks.length === 0 ? 'No tasks yet. Create one above.' : 'No matching tasks.'}
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isSelected = t.id === activeTaskId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-pebble-800/90 border-cyan-500/40 text-white shadow-md shadow-pebble-950/40 ring-1 ring-cyan-500/20'
                        : 'bg-pebble-950/40 border-pebble-800/60 text-pebble-300 hover:bg-pebble-800/40 hover:text-white hover:border-pebble-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium line-clamp-2 leading-snug">
                        {t.prompt}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-pebble-500 font-mono">
                      <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex items-center gap-1.5">
                        <span>{t.subtasks.length} subtasks</span>
                        <StatusBadge status={t.status} size="sm" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Teammates Roster */}
        <TeammateRoster currentAgent={currentAgent} />
      </div>

      {/* Footer Diagnostic Bar */}
      <div className="p-3 border-t border-pebble-800 bg-pebble-950/90 text-[11px] text-pebble-400 font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-pebble-400">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            MCP Server:
          </span>
          <span className={`flex items-center gap-1 ${health?.mcp.connected ? 'text-emerald-400' : 'text-pebble-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${health?.mcp.connected ? 'bg-emerald-400 animate-pulse' : 'bg-pebble-600'}`} />
            {health?.mcp.connected ? `Connected (${health.mcp.availableToolsCount} tools)` : 'Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-pebble-400">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            LLM Engine:
          </span>
          <span className="text-pebble-300 truncate max-w-[140px]" title={health?.llm.provider}>
            {health?.llm.isLiveConfigured ? 'Groq / Llama 3.3' : 'Fallback Engine'}
          </span>
        </div>
      </div>
    </aside>
  );
};
