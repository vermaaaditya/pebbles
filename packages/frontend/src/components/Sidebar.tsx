import React, { useState } from 'react';
import { Plus, Shield, Terminal, Cpu, Search } from 'lucide-react';
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
    <aside className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen select-none font-mono">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-zinc-100 inline-block" />
            <h1 className="text-xs font-bold text-zinc-100 tracking-wider uppercase">
              PEBBLES // KERNEL
            </h1>
          </div>
          <span className="text-[10px] text-zinc-400 border border-zinc-700 px-1.5 py-0.2 bg-zinc-900">
            v0.1.0
          </span>
        </div>

        {/* Governance Mode */}
        <div className="mt-3 p-2 bg-zinc-900/80 border border-zinc-800 text-[11px] leading-tight">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="text-zinc-500 text-[10px]">AUTH_GATE:</span>
            <span className="font-semibold text-zinc-200 uppercase">
              {isArmorIQ ? 'ARMORIQ [ED25519]' : 'LOCAL_POLICY'}
            </span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {isArmorIQ
              ? isConfigured
                ? 'VERIFIED CRYPTOGRAPHIC GATE'
                : 'FAIL-CLOSED: MISSING KEY'
              : 'DEV_MODE: NO CRYPTO VERIFY'}
          </div>
        </div>
      </div>

      {/* New Task Action */}
      <div className="p-3 border-b border-zinc-800">
        <button
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-none border border-zinc-200 active:translate-y-px"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>INITIALIZE TASK</span>
        </button>
      </div>

      {/* Task History + Workforce */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* Previous Tasks */}
        <div>
          <div className="flex items-center justify-between px-0.5 mb-2 border-b border-zinc-900 pb-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              TASK LOG
            </span>
            <span className="text-[10px] text-zinc-500">[{tasks.length}]</span>
          </div>

          {tasks.length > 3 && (
            <div className="mb-2">
              <input
                type="text"
                placeholder="grep tasks..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 rounded-none"
              />
            </div>
          )}

          <div className="space-y-1">
            {filteredTasks.length === 0 ? (
              <div className="p-3 text-center border border-zinc-900 text-zinc-600 text-xs">
                {tasks.length === 0 ? 'NO TASKS IN QUEUE' : 'NO MATCH FOUND'}
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isSelected = t.id === activeTaskId;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTask(t.id)}
                    className={`w-full text-left p-2.5 border transition-none block ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-400 text-zinc-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <p className="text-xs line-clamp-2 leading-snug font-sans text-zinc-300">
                      {t.prompt}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <StatusBadge status={t.status} size="sm" />
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

      {/* Diagnostics Terminal Bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-[10px] text-zinc-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">MCP_SERVER:</span>
          <span className={health?.mcp.connected ? 'text-emerald-400' : 'text-zinc-600'}>
            {health?.mcp.connected ? `ONLINE [${health.mcp.availableToolsCount}_TOOLS]` : 'OFFLINE'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">LLM_PROVIDER:</span>
          <span className="text-zinc-300 truncate max-w-[150px]">
            {health?.llm.isLiveConfigured ? 'GROQ_LLAMA_3.3' : 'FALLBACK_ENGINE'}
          </span>
        </div>
      </div>
    </aside>
  );
};
