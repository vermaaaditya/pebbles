import React, { useState } from 'react';
import {
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Compass,
  Search,
  Hammer,
  Layers,
  ChevronRight,
  ShieldCheck,
  Bug,
} from 'lucide-react';
import { TaskRecord, Subtask } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { HoldApprovalModal } from './HoldApprovalModal';
import { ActivityFeed } from './ActivityFeed';
import { AuthorizationFeed } from './AuthorizationFeed';
import { TaskOutput } from './TaskOutput';

interface TaskWorkspaceProps {
  task: TaskRecord | null;
  onSubmitTask: (prompt: string) => void;
  onAbortTask: (id: string) => void;
  onResolveHold: (delegationId: string, approved: boolean) => void;
  isLoading?: boolean;
}

const PROMPT_PRESETS = [
  {
    label: 'Fix Calculation Bug',
    icon: Bug,
    text: 'Inspect this repository, investigate a bug, implement a fix, run the available tests, and prepare the changes for review.',
  },
  {
    label: 'Audit Sandbox Security',
    icon: ShieldCheck,
    text: 'Audit workspace file layout and verify read-only boundaries are enforced before writing any modifications.',
  },
  {
    label: 'Execute Test Suite',
    icon: Sparkles,
    text: 'Run the existing test suite, analyze any failing test cases, and produce an evidence log.',
  },
];

export const TaskWorkspace: React.FC<TaskWorkspaceProps> = ({
  task,
  onSubmitTask,
  onAbortTask,
  onResolveHold,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState(
    'Inspect this repository, investigate a bug, implement a fix, run the available tests, and prepare the changes for review.'
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmitTask(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const heldRecord = task?.authorizations.find(
    (a) => a.decision === 'HOLD' && a.executionStatus === 'held'
  );

  const getAgentIcon = (agent: string) => {
    if (agent === 'research') return <Search className="w-3.5 h-3.5 text-cyan-400" />;
    if (agent === 'builder') return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
    return <Compass className="w-3.5 h-3.5 text-violet-400" />;
  };

  const getSubtaskStatusIcon = (status: Subtask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'in_progress':
        return (
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
        );
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-pebble-600 shrink-0" />;
    }
  };

  // Progress metrics
  const completedCount = task?.subtasks.filter((s) => s.status === 'completed').length || 0;
  const totalCount = task?.subtasks.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-pebble-950">
      {/* Top Header & Task Input Form */}
      <div className="p-5 border-b border-pebble-800/80 bg-pebble-900/40 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Workforce Orchestration
              </h2>
              {task && <StatusBadge status={task.status} />}
            </div>
            <p className="text-xs text-pebble-400 mt-0.5">
              Autonomous multi-agent execution governed by ArmorIQ authorization gates.
            </p>
          </div>

          {task && (task.status === 'running' || task.status === 'held' || task.status === 'planning') && (
            <button
              onClick={() => onAbortTask(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Abort Task</span>
            </button>
          )}
        </div>

        {/* Input Form with Glass Texture */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative group">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the software engineering task for Pebbles workforce..."
              className="w-full bg-pebble-950/80 border border-pebble-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-pebble-100 placeholder-pebble-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all resize-none shadow-inner custom-scrollbar"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] text-pebble-500 font-mono px-1.5 py-0.5 rounded bg-pebble-900 border border-pebble-800">
                Ctrl + Enter
              </span>
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-pebble-950 text-xs font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all active:scale-95"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-pebble-950 border-t-transparent animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>Delegate to Workforce</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-pebble-500 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Presets:
            </span>
            {PROMPT_PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setPrompt(preset.text)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-pebble-900/60 hover:bg-pebble-800/80 text-pebble-300 hover:text-white border border-pebble-800 transition-all active:scale-95"
                >
                  <Icon className="w-3 h-3 text-cyan-400" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </form>

        {/* Hold Banner if an action is currently held */}
        {heldRecord && (
          <HoldApprovalModal
            heldRecord={heldRecord}
            onApprove={(delId) => onResolveHold(delId, true)}
            onReject={(delId) => onResolveHold(delId, false)}
          />
        )}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-12 gap-5 custom-scrollbar">
        {/* Left Column: Plan & Subtasks (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
          <div className="p-4 rounded-xl border border-pebble-800/80 bg-pebble-900/40 backdrop-blur-sm space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-pebble-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider font-mono">
                  Plan & Delegated Subtasks
                </h3>
              </div>
              {task?.subtasks && totalCount > 0 && (
                <span className="text-[11px] font-mono text-cyan-400">
                  {completedCount}/{totalCount} Completed ({progressPercent}%)
                </span>
              )}
            </div>

            {/* Subtask Progress Bar */}
            {task && totalCount > 0 && (
              <div className="w-full bg-pebble-950 rounded-full h-1.5 overflow-hidden border border-pebble-800/60">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {!task?.plan ? (
              <div className="h-44 flex flex-col items-center justify-center text-pebble-500 text-xs gap-2 italic">
                <Compass className="w-6 h-6 text-pebble-700" />
                <span>Lead Pebble will synthesize a structured plan here.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-pebble-950/80 border border-pebble-800 text-xs">
                  <span className="text-cyan-400 font-mono font-medium">Goal: </span>
                  <span className="text-pebble-200">{task.plan.goal}</span>
                </div>

                <div className="space-y-2">
                  {task.subtasks.map((st, idx) => {
                    const isCurrent = task.currentSubtaskId === st.id;
                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border text-xs transition-all duration-200 ${
                          isCurrent
                            ? 'bg-cyan-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/30'
                            : st.status === 'completed'
                            ? 'bg-pebble-900/60 border-pebble-800'
                            : 'bg-pebble-950/60 border-pebble-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            {getSubtaskStatusIcon(st.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-pebble-200">
                                  {idx + 1}. {st.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-pebble-400">
                                {getAgentIcon(st.agent)}
                                <span className="capitalize font-mono">{st.agent} Pebble</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={st.status} size="sm" />
                        </div>

                        {st.findings && (
                          <div className="mt-2.5 pt-2 border-t border-pebble-800/60 text-[11px] text-pebble-300">
                            <span className="text-emerald-400 font-mono font-semibold">Observed: </span>
                            {st.findings}
                          </div>
                        )}

                        {st.error && (
                          <div className="mt-2.5 pt-2 border-t border-pebble-800/60 text-[11px] text-rose-300">
                            <span className="text-rose-400 font-mono font-semibold">Error: </span>
                            {st.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Governed Authority Quick Feed */}
          <div className="flex-1 min-h-[300px]">
            <AuthorizationFeed authorizations={task?.authorizations || []} />
          </div>
        </div>

        {/* Right Column: Live Activity + Task Output Tabs (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col space-y-4">
          <div className="h-80">
            <ActivityFeed events={task?.events || []} />
          </div>
          <div className="flex-1 min-h-[380px]">
            {task ? (
              <TaskOutput task={task} />
            ) : (
              <div className="h-full flex items-center justify-center p-8 bg-pebble-950/60 border border-pebble-800/80 rounded-xl text-pebble-500 text-xs italic">
                Task output, changed files, test results, and final report will be displayed here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
