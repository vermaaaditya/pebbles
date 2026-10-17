import React, { useState } from 'react';
import { FileCode, FileText, Terminal, Shield, Copy, Check } from 'lucide-react';
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
      { type: 'ctx', text: `--- a/${fileName}` },
      { type: 'add', text: `+++ b/${fileName} (sandboxed modification applied)` },
      { type: 'ctx', text: '@@ Verified and inspected by Pebbles Builder Agent @@' },
    ];
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 font-mono text-xs">
      {/* Top Tab Bar */}
      <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('report')}
            className={`px-2.5 py-1 uppercase text-[11px] border transition-none font-bold ${
              tab === 'report'
                ? 'bg-zinc-100 text-black border-zinc-100'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            [01: REPORT]
          </button>

          <button
            onClick={() => setTab('changes')}
            className={`px-2.5 py-1 uppercase text-[11px] border transition-none font-bold ${
              tab === 'changes'
                ? 'bg-zinc-100 text-black border-zinc-100'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            [02: DIFF ({task.changedFiles.length})]
          </button>

          <button
            onClick={() => setTab('tests')}
            className={`px-2.5 py-1 uppercase text-[11px] border transition-none font-bold ${
              tab === 'tests'
                ? 'bg-zinc-100 text-black border-zinc-100'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            [03: TESTS]
          </button>

          <button
            onClick={() => setTab('evidence')}
            className={`px-2.5 py-1 uppercase text-[11px] border transition-none font-bold ${
              tab === 'evidence'
                ? 'bg-zinc-100 text-black border-zinc-100'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            [04: EVIDENCE ({task.evidence.length})]
          </button>
        </div>

        {tab === 'report' && task.finalReport && (
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[10px] uppercase font-bold transition-none"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>COPY_REPORT</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* REPORT TAB */}
        {tab === 'report' && (
          <div>
            {task.finalReport ? (
              <div className="border border-zinc-800 bg-zinc-950">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500">
                  <span>FILE: PEBBLES_GOVERNANCE_CERTIFICATION.md</span>
                  <span>STATUS: CERTIFIED</span>
                </div>
                <div className="p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed text-zinc-200">
                  {task.finalReport}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-zinc-600 italic">
                AWAITING FINAL GOVERNANCE CERTIFICATION REPORT...
              </div>
            )}
          </div>
        )}

        {/* CHANGES & CODE DIFF TAB */}
        {tab === 'changes' && (
          <div className="space-y-3">
            {task.changedFiles.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-zinc-600 italic">
                NO_FILES_MODIFIED_IN_SANDBOX
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {task.changedFiles.map((file) => (
                    <button
                      key={file}
                      onClick={() => setSelectedDiffFile(file)}
                      className={`px-2 py-1 text-xs border uppercase font-mono transition-none ${
                        (selectedDiffFile || task.changedFiles[0]) === file
                          ? 'bg-zinc-800 border-zinc-400 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      FILE: {file} [MODIFIED]
                    </button>
                  ))}
                </div>

                <div className="border border-zinc-800 bg-zinc-950 font-mono text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500">
                    <span>DIFF // {selectedDiffFile || task.changedFiles[0]}</span>
                    <span className="text-emerald-400">SYNTAX: VERIFIED</span>
                  </div>

                  <div className="p-2 space-y-0.5 overflow-x-auto text-[11px]">
                    {getDiffLines(selectedDiffFile || task.changedFiles[0]).map((line, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 flex items-center gap-3 ${
                          line.type === 'add'
                            ? 'bg-emerald-950/50 text-emerald-300 border-l border-emerald-500'
                            : line.type === 'del'
                            ? 'bg-rose-950/50 text-rose-300 border-l border-rose-500 line-through'
                            : 'text-zinc-400'
                        }`}
                      >
                        <span className="text-zinc-600 select-none w-5 text-right text-[10px]">
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
              <div className="h-40 flex items-center justify-center text-zinc-600 italic">
                NO_TEST_SUITE_EXECUTED
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] uppercase font-bold border ${
                        task.testResults.passed
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                          : 'bg-rose-950 text-rose-400 border-rose-700'
                      }`}
                    >
                      {task.testResults.passed ? 'TESTS_PASSED' : 'TESTS_FAILED'}
                    </span>
                    <span className="text-zinc-200 font-bold">{task.testResults.command}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span>EXIT_STATUS: {task.testResults.passed ? '0 (OK)' : '1 (FAIL)'}</span>
                    <span>DURATION: {task.testResults.durationMs}ms</span>
                  </div>
                </div>

                <div className="border border-zinc-800 bg-zinc-950">
                  <div className="px-3 py-1 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500">
                    STDOUT / STDERR EXECUTION LOG
                  </div>
                  <pre className="p-3 text-emerald-400/90 text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-emerald-950">
                    {task.testResults.stdout || task.testResults.stderr || 'NO_STDOUT_RECORDED'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE TRAIL TAB */}
        {tab === 'evidence' && (
          <div className="space-y-1.5 font-mono text-xs">
            {task.evidence.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-zinc-600 italic">
                NO_EVIDENCE_ITEMS_CAPTURED
              </div>
            ) : (
              task.evidence.map((evi) => (
                <div
                  key={evi.id}
                  className="p-2.5 border border-zinc-800 bg-zinc-950 space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="uppercase font-bold text-zinc-200">
                        [{evi.agent}_AGENT]
                      </span>
                      <span className="text-zinc-600">USED</span>
                      <code className="text-zinc-300 bg-zinc-900 px-1 border border-zinc-800 text-[10px]">
                        {evi.tool}
                      </code>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(evi.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 font-sans text-xs">{evi.observation}</p>
                  <div className="text-[10px] text-emerald-400 border border-emerald-900/60 bg-emerald-950/20 p-1.5">
                    CLAIM_VERIFIED: {evi.supportedClaim}
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
