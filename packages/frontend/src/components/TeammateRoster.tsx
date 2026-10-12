import React from 'react';
import { Compass, Search, Hammer, ShieldAlert, ShieldCheck } from 'lucide-react';

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
    },
    {
      role: 'research',
      name: 'Research Pebble',
      title: 'Context & Security Analyst',
      description: 'Inspects repository layout, searches symbols, and verifies test assertions. Strict read-only.',
      scope: 'Read-Only Inspection',
      permissions: ['workspace_list_files', 'workspace_read_file', 'workspace_search_files'],
      restricted: ['workspace_write_file', 'workspace_run_tests'],
      icon: Search,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-500/30',
    },
    {
      role: 'builder',
      name: 'Builder Pebble',
      title: 'Sandbox Engineer',
      description: 'Applies verified bugfixes within sandbox and executes permitted test suites.',
      scope: 'Sandboxed Modification & Tests',
      permissions: ['workspace_read_file', 'workspace_write_file', 'workspace_run_tests'],
      restricted: ['Path Traversal', 'Secrets Access', 'Production Deploy'],
      icon: Hammer,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-pebble-400 uppercase tracking-wider">
          Active Teammates
        </h3>
        <span className="text-[10px] bg-pebble-800 text-pebble-400 px-2 py-0.5 rounded-full border border-pebble-700">
          Governed Roster
        </span>
      </div>

      <div className="space-y-2">
        {teammates.map((tm) => {
          const Icon = tm.icon;
          const isActive = currentAgent === tm.role;

          return (
            <div
              key={tm.role}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? `${tm.bgColor} ${tm.borderColor} ring-1 ring-cyan-500/30 shadow-lg`
                  : 'bg-pebble-900/60 border-pebble-800/80 hover:border-pebble-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${tm.bgColor} ${tm.color} border ${tm.borderColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-pebble-100">{tm.name}</span>
                      {isActive && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30 animate-pulse">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-pebble-400">{tm.title}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-pebble-400 mt-2 leading-relaxed">
                {tm.description}
              </p>

              <div className="mt-2.5 pt-2 border-t border-pebble-800/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-emerald-400 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{tm.scope}</span>
                </div>
                {tm.restricted && (
                  <div className="flex items-center gap-1 text-rose-400 font-mono">
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
