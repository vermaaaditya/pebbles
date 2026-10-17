import React, { useState } from 'react';
import { Play, Square, Terminal, Shield, Check, Clock, AlertCircle } from 'lucide-react';
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
    tag: 'FIX_BUG',
    text: 'Inspect this repository, investigate a bug, implement a fix, run the available tests, and prepare the changes for review.',
  },
  {
    tag: 'AUDIT_SECURITY',
    text: 'Audit workspace file layout and verify read-only boundaries are enforced before writing any modifications.',
  },
  {
    tag: 'EXECUTE_TESTS',
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

  // Subtask metrics
  const completedCount = task?.subtasks.filter((s) => s.status === 'completed').length || 0;
  const totalCount = task?.subtasks.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950 font-mono">
      {/* Top Header & Task Dispatcher */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs font-bold">[CONSOLE]</span>
            <h2 className="text-sm font-bold text-zinc-100 tracking-wider uppercase">
              WORKFORCE EXECUTION CONTROLLER
            </h2>
            {task && <StatusBadge status={task.status} />}
          </div>

          {task && (task.status === 'running' || task.status === 'held' || task.status === 'planning') && (
            <button
              onClick={() => onAbortTask(task.id)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 border border-rose-700 text-rose-300 hover:bg-rose-900 text-xs uppercase font-bold tracking-wider transition-none"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>ABORT_PROCESS</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative border border-zinc-800 bg-zinc-900/60 focus-within:border-zinc-500">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 text-[10px] text-zinc-500 bg-zinc-950/80">
              <span>PROMPT_DISPATCHER // STDIN</span>
              <span>PRESS [CTRL + ENTER] TO SUBMIT</span>
            </div>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter software engineering instructions for Pebbles workforce..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none font-mono custom-scrollbar"
            />
            <div className="flex items-center justify-between p-2 border-t border-zinc-800/60 bg-zinc-950/40">
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-500 uppercase">PRESETS:</span>
                {PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.tag}
                    type="button"
                    onClick={() => setPrompt(preset.text)}
                    className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] uppercase transition-none"
                  >
                    [{preset.tag}]
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs uppercase font-bold tracking-wider border border-zinc-200 disabled:opacity-40 transition-none"
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-zinc-950 border-t-transparent animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>DISPATCH_TASK</span>
              </button>
            </div>
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
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-12 gap-4 custom-scrollbar">
        {/* Left Column: Plan & Subtasks (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
          <div className="p-3.5 border border-zinc-800 bg-zinc-950 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
                EXECUTION_PLAN // DELEGATED_PIPELINE
              </span>
              {task?.subtasks && totalCount > 0 && (
                <span className="text-[10px] text-zinc-400">
                  [{completedCount}/{totalCount} COMPLETED - {progressPercent}%]
                </span>
              )}
            </div>

            {/* Brutalist linear progress bar */}
            {task && totalCount > 0 && (
              <div className="w-full bg-zinc-900 h-1 border border-zinc-800">
                <div
                  className="bg-zinc-200 h-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {!task?.plan ? (
              <div className="h-40 flex items-center justify-center text-zinc-600 text-xs border border-zinc-900 border-dashed">
                AWAITING TASK DISPATCH TO SYNTHESIZE PLAN...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2 bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="text-zinc-500 font-bold uppercase mr-1">[GOAL]:</span>
                  <span className="text-zinc-200 font-sans">{task.plan.goal}</span>
                </div>

                <div className="space-y-1.5">
                  {task.subtasks.map((st, idx) => {
                    const isCurrent = task.currentSubtaskId === st.id;
                    const isDone = st.status === 'completed';
                    const isFail = st.status === 'failed';

                    return (
                      <div
                        key={st.id}
                        className={`p-2.5 border text-xs transition-none ${
                          isCurrent
                            ? 'bg-zinc-900 border-zinc-400 text-zinc-100'
                            : isDone
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 font-bold">
                                [STEP 0{idx + 1}]
                              </span>
                              <span className="font-semibold text-zinc-200 font-sans">
                                {st.title}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase mt-0.5">
                              DELEGATED_TO: {st.agent} Pebble
                            </div>
                          </div>
                          <StatusBadge status={st.status} size="sm" />
                        </div>

                        {st.findings && (
                          <div className="mt-2 pt-1.5 border-t border-zinc-900 text-[11px] text-zinc-300 font-sans">
                            <span className="text-emerald-400 font-mono font-bold mr-1">[OBSERVED]:</span>
                            {st.findings}
                          </div>
                        )}

                        {st.error && (
                          <div className="mt-2 pt-1.5 border-t border-zinc-900 text-[11px] text-rose-300 font-sans">
                            <span className="text-rose-400 font-mono font-bold mr-1">[ERROR]:</span>
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
              <div className="h-full flex items-center justify-center p-8 bg-zinc-950 border border-zinc-900 text-zinc-600 text-xs">
                AWAITING WORKFORCE EXECUTION DATA...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
