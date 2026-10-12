import React, { useState } from 'react';
import { FileCode, CheckCircle2, XCircle, FileText, Shield, Terminal } from 'lucide-react';
import { TaskRecord } from '../api/client';

interface TaskOutputProps {
  task: TaskRecord;
}

export const TaskOutput: React.FC<TaskOutputProps> = ({ task }) => {
  const [tab, setTab] = useState<'report' | 'changes' | 'tests' | 'evidence'>('report');

  return (
    <div className="flex flex-col h-full bg-pebble-950 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner">
      {/* Tab Navigation */}
      <div className="px-4 py-2.5 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'report'
                ? 'bg-pebble-800 text-white border border-pebble-700'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Final Report</span>
          </button>

          <button
            onClick={() => setTab('changes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'changes'
                ? 'bg-pebble-800 text-white border border-pebble-700'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Changed Files ({task.changedFiles.length})</span>
          </button>

          <button
            onClick={() => setTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'tests'
                ? 'bg-pebble-800 text-white border border-pebble-700'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Execution</span>
            {task.testResults && (
              <span className={`w-2 h-2 rounded-full ${task.testResults.passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            )}
          </button>

          <button
            onClick={() => setTab('evidence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'evidence'
                ? 'bg-pebble-800 text-white border border-pebble-700'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Evidence Trail ({task.evidence.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'report' && (
          <div className="space-y-4">
            {task.finalReport ? (
              <div className="p-4 rounded-lg bg-pebble-900/60 border border-pebble-800/80 prose prose-invert max-w-none text-xs font-mono whitespace-pre-wrap leading-relaxed text-pebble-200">
                {task.finalReport}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-pebble-500 text-xs gap-2">
                <FileText className="w-8 h-8 text-pebble-700" />
                <span>Final report will be compiled by Lead Pebble upon task completion.</span>
              </div>
            )}
          </div>
        )}

        {tab === 'changes' && (
          <div className="space-y-3">
            {task.changedFiles.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-pebble-500 text-xs italic">
                No files modified by Builder Pebble yet.
              </div>
            ) : (
              task.changedFiles.map((file) => (
                <div
                  key={file}
                  className="flex items-center justify-between p-3 rounded-lg bg-pebble-900/60 border border-pebble-800 font-mono text-xs"
                >
                  <div className="flex items-center gap-2 text-cyan-300">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span>{file}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    Modified & Sandboxed
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'tests' && (
          <div>
            {!task.testResults ? (
              <div className="h-40 flex items-center justify-center text-pebble-500 text-xs italic">
                No test suite executed yet.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-pebble-900 border border-pebble-800">
                  <div className="flex items-center gap-2">
                    {task.testResults.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-white font-medium">{task.testResults.command}</span>
                  </div>
                  <span className="text-[11px] text-pebble-400">
                    Duration: {task.testResults.durationMs}ms
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-pebble-950 border border-pebble-800/80 overflow-x-auto">
                  <div className="text-[11px] text-pebble-500 mb-1">Terminal Output:</div>
                  <pre className="text-pebble-300 text-xs whitespace-pre-wrap leading-relaxed">
                    {task.testResults.stdout || task.testResults.stderr || 'No stdout/stderr recorded'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'evidence' && (
          <div className="space-y-2.5 font-mono text-xs">
            {task.evidence.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-pebble-500 text-xs italic">
                No cryptographic or tool evidence captured yet.
              </div>
            ) : (
              task.evidence.map((evi) => (
                <div
                  key={evi.id}
                  className="p-3 rounded-lg bg-pebble-900/40 border border-pebble-800/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-semibold text-white">{evi.agent}</span>
                      <span className="text-pebble-500">used</span>
                      <code className="text-cyan-300 bg-pebble-950 px-1 py-0.5 rounded text-[11px]">
                        {evi.tool}
                      </code>
                    </div>
                    <span className="text-[10px] text-pebble-500">
                      {new Date(evi.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-pebble-300 text-xs font-sans">{evi.observation}</p>
                  <div className="text-[10px] text-emerald-400 font-sans">
                    ✓ Supported Claim: {evi.supportedClaim}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
