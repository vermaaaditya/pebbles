import React from 'react';
import { Compass, Search, Hammer, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

interface TeammateRosterProps {
  currentAgent?: string;
}

export const TeammateRoster: React.FC<TeammateRosterProps> = ({ currentAgent }) => {
  const teammates = [
    {
      role: 'lead',
      name: 'Lead Pebble',
      title: 'Workforce Architect',
      description: 'Understands objective, synthesizes execution plan, delegates subtasks, and certifies reports.',
      scope: 'Coordination & Reporting',
      permissions: ['Plan Synthesis', 'Task Delegation', 'Final Certification'],
      icon: Compass,
      color: 'text-violet-400',
      bgColor: 'bg-violet-950/40',
      borderColor: 'border-violet-500/30',
      accentGlow: 'shadow-violet-500/20',
    },
    {
      role: 'research',
      name: 'Research Pebble',
      title: 'Context & Security Analyst',
      description: 'Inspects repository layout, searches symbols, and verifies test assertions. Strict read-only.',
      scope: 'Read-Only Inspection',
      permissions: ['list_files', 'read_file', 'search_files'],
      restricted: ['write_file', 'run_tests'],
      icon: Search,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-500/30',
      accentGlow: 'shadow-cyan-500/20',
    },
    {
      role: 'builder',
      name: 'Builder Pebble',
      title: 'Sandbox Engineer',
      description: 'Applies verified bugfixes within sandbox and executes permitted test suites.',
      scope: 'Sandboxed Modification & Tests',
      permissions: ['read_file', 'write_file', 'run_tests'],
      restricted: ['Path Traversal', 'Secrets Access'],
      icon: Hammer,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-500/30',
      accentGlow: 'shadow-amber-500/20',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold text-pebble-400 uppercase tracking-wider font-mono">
          Governed Workforce
        </h3>
        <span className="text-[10px] bg-pebble-900 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800/40 font-mono">
          3 Agents
        </span>
      </div>

      <div className="space-y-2.5">
        {teammates.map((tm) => {
          const Icon = tm.icon;
          const isActive = currentAgent === tm.role;

          return (
            <div
              key={tm.role}
              className={`p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? `${tm.bgColor} ${tm.borderColor} ring-1 ring-cyan-500/40 shadow-lg ${tm.accentGlow}`
                  : 'bg-pebble-900/40 border-pebble-800/80 hover:bg-pebble-900/70 hover:border-pebble-700'
              }`}
            >
              {/* Active top subtle accent line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-violet-400 to-transparent" />
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${tm.bgColor} ${tm.color} border ${tm.borderColor} shadow-inner shrink-0`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white tracking-tight">{tm.name}</span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/40 animate-pulse">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          Executing
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-pebble-400 block">{tm.title}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-pebble-300 mt-2 leading-relaxed">
                {tm.description}
              </p>

              {/* Scope & Restrictions badges */}
              <div className="mt-2.5 pt-2 border-t border-pebble-800/60 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1 text-emerald-400 truncate max-w-[160px]" title={tm.scope}>
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{tm.scope}</span>
                </div>
                {tm.restricted && (
                  <div className="flex items-center gap-1 text-rose-400 shrink-0">
                    <ShieldAlert className="w-3 h-3" />
                    <span>No Writes</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
