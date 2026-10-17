import React from 'react';
import { Terminal, Shield, Hammer, Search, Compass } from 'lucide-react';

interface TeammateRosterProps {
  currentAgent?: string;
}

export const TeammateRoster: React.FC<TeammateRosterProps> = ({ currentAgent }) => {
  const teammates = [
    {
      role: 'lead',
      code: 'AGENT:01',
      name: 'Lead Pebble',
      title: 'Workforce Architect',
      description: 'Synthesizes plan, delegates subtasks, and certifies final governance report.',
      scope: 'COORDINATION & REPORTING',
      permissions: ['plan_synthesis', 'subtask_delegation', 'final_audit'],
      icon: Compass,
    },
    {
      role: 'research',
      code: 'AGENT:02',
      name: 'Research Pebble',
      title: 'Context & Security Analyst',
      description: 'Read-only inspection of repository layout, symbols, and tests.',
      scope: 'READ-ONLY INSPECTION',
      permissions: ['list_files', 'read_file', 'search_files'],
      restricted: 'WRITE_BLOCKED',
      icon: Search,
    },
    {
      role: 'builder',
      code: 'AGENT:03',
      name: 'Builder Pebble',
      title: 'Sandbox Engineer',
      description: 'Applies verified changes within sandbox and executes permitted test suites.',
      scope: 'SANDBOXED MODIFICATION & TESTS',
      permissions: ['read_file', 'write_file', 'run_tests'],
      restricted: 'TRAVERSAL_BLOCKED',
      icon: Hammer,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5 border-b border-zinc-800 pb-1.5">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
          Workforce Roster
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">[3 ACTIVE]</span>
      </div>

      <div className="space-y-1.5">
        {teammates.map((tm) => {
          const isActive = currentAgent === tm.role;

          return (
            <div
              key={tm.role}
              className={`p-2.5 border transition-none font-mono ${
                isActive
                  ? 'bg-zinc-900 border-zinc-500 text-zinc-100'
                  : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold">{tm.code}</span>
                  <span className="font-semibold text-zinc-200">{tm.name}</span>
                </div>
                {isActive ? (
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 uppercase tracking-wider">
                    RUNNING
                  </span>
                ) : (
                  <span className="text-[9px] text-zinc-600 uppercase">IDLE</span>
                )}
              </div>

              <div className="text-[11px] text-zinc-400 font-sans leading-tight mt-1">
                {tm.description}
              </div>

              <div className="mt-2 pt-1.5 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="text-zinc-400 truncate max-w-[150px]">{tm.scope}</span>
                {tm.restricted && (
                  <span className="text-rose-400 font-mono text-[9px] border border-rose-900/60 px-1 bg-rose-950/20">
                    {tm.restricted}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
