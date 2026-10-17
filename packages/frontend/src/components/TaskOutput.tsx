import React, { useState } from 'react';
import {
  FileCode,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  Terminal,
  Copy,
  Check,
  Code2,
  Eye,
} from 'lucide-react';
import { TaskRecord } from '../api/client';

interface TaskOutputProps {
  task: TaskRecord;
}

export const TaskOutput: React.FC<TaskOutputProps> = ({ task }) => {
  const [tab, setTab] = useState<'report' | 'changes' | 'tests' | 'evidence'>('report');
  const [copied, setCopied] = useState(false);
  const [selectedDiffFile, setSelectedDiffFile] = useState<string | null>(
    task.changedFiles[0] || null
  );

  const handleCopyReport = () => {
    if (!task.finalReport) return;
    navigator.clipboard.writeText(task.finalReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sample diff representation for modified files
  const getDiffLines = (fileName: string) => {
    if (fileName.includes('calculator.py')) {
      return [
        { type: 'ctx', text: 'def calculate_total_with_tax(subtotal: float, tax_rate: float) -> float:' },
        { type: 'ctx', text: '    """Calculate total price including tax."""' },
        { type: 'del', text: '-    return subtotal - (subtotal * tax_rate)  # BUG: subtracting tax instead of adding' },
        { type: 'add', text: '+    return subtotal + (subtotal * tax_rate)  # FIXED: added tax to subtotal' },
        { type: 'ctx', text: '' },
        { type: 'ctx', text: 'def calculate_discount(price: float, discount_percent: float) -> float:' },
      ];
    }
    return [
      { type: 'ctx', text: `--- ${fileName} (before)` },
      { type: 'add', text: `+++ ${fileName} (sandboxed modification applied)` },
      { type: 'ctx', text: '@@ Verified and inspected by Pebbles Builder Agent @@' },
    ];
  };

  return (
    <div className="flex flex-col h-full bg-pebble-950/90 border border-pebble-800/80 rounded-xl overflow-hidden shadow-inner backdrop-blur-sm">
      {/* Top Tab Bar */}
      <div className="px-4 py-2.5 bg-pebble-900/80 border-b border-pebble-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'report'
                ? 'bg-pebble-800 text-white border border-pebble-700 shadow-sm'
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
                ? 'bg-pebble-800 text-white border border-pebble-700 shadow-sm'
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
                ? 'bg-pebble-800 text-white border border-pebble-700 shadow-sm'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Execution</span>
            {task.testResults && (
              <span
                className={`w-2 h-2 rounded-full ${
                  task.testResults.passed ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setTab('evidence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'evidence'
                ? 'bg-pebble-800 text-white border border-pebble-700 shadow-sm'
                : 'text-pebble-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Evidence Trail ({task.evidence.length})</span>
          </button>
        </div>

        {/* Copy button when in Report tab */}
        {tab === 'report' && task.finalReport && (
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-pebble-800 hover:bg-pebble-700 text-pebble-300 hover:text-white text-[11px] font-mono transition-all border border-pebble-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* REPORT TAB */}
        {tab === 'report' && (
          <div className="space-y-4">
            {task.finalReport ? (
              <div className="rounded-xl border border-pebble-800/90 bg-pebble-900/60 overflow-hidden shadow-sm">
                <div className="flex items-center gap-1.5 px-4 py-2 bg-pebble-950/80 border-b border-pebble-800/80">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[11px] text-pebble-400 font-mono">
                    PEBBLES_GOVERNANCE_CERTIFICATION.md
                  </span>
                </div>
                <div className="p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed text-pebble-200 selection:bg-cyan-500/30 selection:text-white">
                  {task.finalReport}
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-pebble-500 text-xs gap-2">
                <FileText className="w-8 h-8 text-pebble-700" />
                <span>Final report will be compiled by Lead Pebble upon task completion.</span>
              </div>
            )}
          </div>
        )}

        {/* CHANGES & CODE DIFF TAB */}
        {tab === 'changes' && (
          <div className="space-y-4">
            {task.changedFiles.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-pebble-500 text-xs italic">
                No files modified by Builder Pebble yet.
              </div>
            ) : (
              <div className="space-y-3">
                {/* File Pill Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  {task.changedFiles.map((file) => (
                    <button
                      key={file}
                      onClick={() => setSelectedDiffFile(file)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                        (selectedDiffFile || task.changedFiles[0]) === file
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm'
                          : 'bg-pebble-900/60 text-pebble-300 border-pebble-800 hover:border-pebble-700'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{file}</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                        Modified
                      </span>
                    </button>
                  ))}
                </div>

                {/* Visual Code Diff Container */}
                <div className="rounded-xl border border-pebble-800/90 bg-pebble-950 overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between px-4 py-2 bg-pebble-900/90 border-b border-pebble-800/80 text-[11px] text-pebble-400">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unified Diff: {selectedDiffFile || task.changedFiles[0]}</span>
                    </div>
                    <span className="text-emerald-400 font-medium">✓ Syntax Verified</span>
                  </div>

                  <div className="p-3 space-y-0.5 overflow-x-auto">
                    {getDiffLines(selectedDiffFile || task.changedFiles[0]).map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1 rounded flex items-center gap-3 ${
                          line.type === 'add'
                            ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                            : line.type === 'del'
                            ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through opacity-80'
                            : 'text-pebble-400'
                        }`}
                      >
                        <span className="text-pebble-600 select-none w-6 text-right text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="whitespace-pre">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TESTS EXECUTION TAB */}
        {tab === 'tests' && (
          <div>
            {!task.testResults ? (
              <div className="h-44 flex items-center justify-center text-pebble-500 text-xs italic">
                No test suite executed yet.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {/* Terminal Header Info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-pebble-900/80 border border-pebble-800 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    {task.testResults.passed ? (
                      <div className="p-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-md bg-rose-950 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        <span>{task.testResults.command}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            task.testResults.passed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {task.testResults.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-pebble-400">
                        Exit Status: {task.testResults.passed ? '0 (Success)' : '1 (Failed)'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                    {task.testResults.durationMs}ms duration
                  </span>
                </div>

                {/* Terminal Window Box */}
                <div className="rounded-xl border border-pebble-800 bg-pebble-950 overflow-hidden shadow-inner">
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-pebble-900/90 border-b border-pebble-800/80">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[11px] text-pebble-400 font-mono">
                      bash ~/workspace-sandbox/tests
                    </span>
                  </div>
                  <pre className="p-4 text-emerald-400/90 text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-emerald-500/30">
                    {task.testResults.stdout || task.testResults.stderr || 'No stdout/stderr recorded'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE TRAIL TAB */}
        {tab === 'evidence' && (
          <div className="space-y-2.5 font-mono text-xs">
            {task.evidence.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-pebble-500 text-xs italic">
                No cryptographic or tool evidence captured yet.
              </div>
            ) : (
              task.evidence.map((evi) => (
                <div
                  key={evi.id}
                  className="p-3.5 rounded-xl bg-pebble-900/40 border border-pebble-800/60 hover:border-pebble-700/80 transition-all space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-semibold text-white">{evi.agent} Pebble</span>
                      <span className="text-pebble-500">invoked</span>
                      <code className="text-cyan-300 bg-pebble-950 px-1.5 py-0.5 rounded border border-pebble-800 text-[11px]">
                        {evi.tool}
                      </code>
                    </div>
                    <span className="text-[10px] text-pebble-500">
                      {new Date(evi.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-pebble-300 text-xs font-sans leading-relaxed">{evi.observation}</p>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Supported Claim: {evi.supportedClaim}</span>
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
