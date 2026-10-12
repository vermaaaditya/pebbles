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
  Shield,
  Layers,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmitTask(prompt.trim());
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
        return <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-pebble-600 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-pebble-950">
      {/* Top Header & Task Input */}
      <div className="p-5 border-b border-pebble-800 bg-pebble-900/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Task Orchestration</span>
              {task && <StatusBadge status={task.status} />}
            </h2>
            <p className="text-xs text-pebble-400 mt-0.5">
              Autonomous multi-agent execution governed by ArmorIQ authorization gates.
            </p>
          </div>

          {task && (task.status === 'running' || task.status === 'held' || task.status === 'planning') && (
            <button
              onClick={() => onAbortTask(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-medium transition-all"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Abort Task</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the software engineering task for Pebbles workforce..."
              className="w-full bg-pebble-950 border border-pebble-800 rounded-xl px-4 py-3 text-sm text-pebble-100 placeholder-pebble-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute right-3 bottom-3 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-pebble-950 text-xs font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-pebble-950 border-t-transparent animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Delegate to Pebbles</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-pebble-500">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Try MVP task:</span>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  'Inspect this repository, investigate a bug, implement a fix, run the available tests, and prepare the changes for review.'
                )
              }
              className="text-cyan-400 hover:underline truncate max-w-xl text-left"
            >
              "Inspect this repository, investigate a bug, implement a fix, run the available tests..."
            </button>
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
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-12 gap-5">
        {/* Left Column: Plan & Subtasks (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
          <div className="p-4 rounded-xl border border-pebble-800 bg-pebble-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-pebble-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-pebble-200 uppercase tracking-wider">
                  Plan & Delegated Subtasks
                </h3>
              </div>
              {task?.subtasks && (
                <span className="text-[11px] font-mono text-pebble-400">
                  {task.subtasks.filter((s) => s.status === 'completed').length}/{task.subtasks.length} Done
                </span>
              )}
            </div>

            {!task?.plan ? (
              <div className="h-44 flex flex-col items-center justify-center text-pebble-500 text-xs gap-2 italic">
                <Compass className="w-6 h-6 text-pebble-700" />
                <span>Lead Pebble will synthesize a structured plan here.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-pebble-950 border border-pebble-800/80 text-xs">
                  <span className="text-pebble-400 font-medium">Goal: </span>
                  <span className="text-pebble-200">{task.plan.goal}</span>
                </div>

                <div className="space-y-2">
                  {task.subtasks.map((st, idx) => {
                    const isCurrent = task.currentSubtaskId === st.id;
                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isCurrent
                            ? 'bg-cyan-950/20 border-cyan-500/40 ring-1 ring-cyan-500/20'
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
                            <span className="text-emerald-400 font-mono font-medium">Observed: </span>
                            {st.findings}
                          </div>
                        )}

                        {st.error && (
                          <div className="mt-2.5 pt-2 border-t border-pebble-800/60 text-[11px] text-rose-300">
                            <span className="text-rose-400 font-mono font-medium">Error: </span>
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
          <div className="flex-1 min-h-[360px]">
            {task ? (
              <TaskOutput task={task} />
            ) : (
              <div className="h-full flex items-center justify-center p-8 bg-pebble-950 border border-pebble-800/80 rounded-xl text-pebble-500 text-xs italic">
                Task output, changed files, test results, and final report will be displayed here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
