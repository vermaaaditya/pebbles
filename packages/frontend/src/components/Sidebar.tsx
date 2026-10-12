import React from 'react';
import { Plus, ShieldCheck, ShieldAlert, Cpu, Layers, Terminal } from 'lucide-react';
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
  const isArmorIQ = health?.authorization.mode === 'armoriq';
  const isConfigured = health?.authorization.configured;

  return (
    <aside className="w-80 bg-pebble-900 border-r border-pebble-800 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-pebble-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="font-mono font-bold text-white text-base">P</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">Pebbles</h1>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800/50">
                MVP
              </span>
            </div>
            <p className="text-xs text-pebble-400">Governed AI Workforce</p>
          </div>
        </div>

        {/* Governance Mode Pill */}
        <div className="mt-3 p-2 rounded-md bg-pebble-950/70 border border-pebble-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            {isArmorIQ ? (
              isConfigured ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              )
            ) : (
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <div className="truncate">
              <div className="font-medium text-pebble-200 truncate">
                {isArmorIQ ? 'ArmorIQ Production' : 'Local Policy Engine'}
              </div>
              <div className="text-[11px] text-pebble-400 truncate">
                {isArmorIQ
                  ? isConfigured
                    ? 'Active cryptographic verification'
                    : 'Failing closed (no API key)'
                  : 'Explicit Dev Mode (Safe)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Button */}
      <div className="p-3 border-b border-pebble-800/60">
        <button
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-pebble-950 font-medium text-sm transition-all shadow-md shadow-cyan-500/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Middle Content: Task History + Teammates */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Previous Tasks */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-semibold text-pebble-400 uppercase tracking-wider">
              Task History
            </span>
            <span className="text-xs text-pebble-500">{tasks.length}</span>
          </div>

          <div className="space-y-1.5">
            {tasks.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-pebble-800 rounded-lg text-xs text-pebble-500">
                No tasks yet. Create one above.
              </div>
            ) : (
              tasks.map((t) => {
                const isSelected = t.id === activeTaskId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-pebble-800 border-pebble-700 text-white shadow'
                        : 'bg-pebble-950/40 border-pebble-800/60 text-pebble-300 hover:bg-pebble-800/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium line-clamp-2 leading-relaxed">
                        {t.prompt}
                      </p>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-pebble-500 font-mono">
                      <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{t.subtasks.length} subtasks</span>
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
      <div className="p-3 border-t border-pebble-800 bg-pebble-950 text-[11px] text-pebble-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            MCP Server:
          </span>
          <span className={health?.mcp.connected ? 'text-emerald-400' : 'text-pebble-500'}>
            {health?.mcp.connected ? `Connected (${health.mcp.availableToolsCount} tools)` : 'Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            LLM Engine:
          </span>
          <span className="text-pebble-300 truncate max-w-[140px]" title={health?.llm.provider}>
            {health?.llm.isLiveConfigured ? 'Live Model' : 'Fallback Engine'}
          </span>
        </div>
      </div>
    </aside>
  );
};
