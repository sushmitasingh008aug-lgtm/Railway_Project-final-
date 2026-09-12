import React, { useState, useEffect } from 'react';
import { ListTodo, Search, Filter, Wrench, ShieldAlert, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { ScheduledTask, Section, apiClient } from '../api/client';

interface TasksViewProps {
  schedule: ScheduledTask[];
  sections: Section[];
}

interface TaskAction {
  action_id: string;
  action_type: string;
  required_crew: string;
  required_resources: string;
  setup_minutes: number;
  work_duration_minutes: number;
  isolation_requirement: string;
  sequence_order: number;
}

export const TasksView: React.FC<TasksViewProps> = ({ schedule, sections }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [critFilter, setCritFilter] = useState('ALL');
  const [secFilter, setSecFilter] = useState('ALL');
  const [activeTask, setActiveTask] = useState<ScheduledTask | null>(null);
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  useEffect(() => {
    if (!activeTask) return;
    setLoadingActions(true);
    apiClient.get<{ data: TaskAction[] }>(`/actions/${activeTask.task_id}`)
      .then(res => setActions(res.data.data || []))
      .catch(err => {
        console.error('Failed to load actions:', err);
        setActions([]);
      })
      .finally(() => setLoadingActions(false));
  }, [activeTask]);

  const filteredTasks = schedule.filter(t => {
    if (deptFilter !== 'ALL' && t.department !== deptFilter) return false;
    if (critFilter !== 'ALL' && t.criticality !== critFilter) return false;
    if (secFilter !== 'ALL' && t.section_id !== secFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.task_id.toLowerCase().includes(q) ||
        t.task_type.toLowerCase().includes(q) ||
        t.asset_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
              <ListTodo className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] font-display">
              Unified Maintenance Tasks Backlog
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1 ml-10">
            Normalized backlog across Engineering (TMS), Traction (TDMS), and Signalling (SMMS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search task, asset, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-[#E6E6E6] rounded-xl bg-[#F7F7F5] w-48 focus:outline-none focus:border-[#FF9933] focus:bg-white transition"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-[#E6E6E6] rounded-xl px-3 py-1.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering (TMS)</option>
            <option value="Traction">Traction (TDMS)</option>
            <option value="S&T">Signalling (SMMS)</option>
          </select>

          <select
            value={critFilter}
            onChange={(e) => setCritFilter(e.target.value)}
            className="text-xs border border-[#E6E6E6] rounded-xl px-3 py-1.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
          >
            <option value="ALL">All Criticality</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={secFilter}
            onChange={(e) => setSecFilter(e.target.value)}
            className="text-xs border border-[#E6E6E6] rounded-xl px-3 py-1.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
          >
            <option value="ALL">All Sections</option>
            {sections.map(s => (
              <option key={s.section_id} value={s.section_id}>{s.section_id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filterable Table */}
      <div className="bg-white rounded-2xl border border-[#E6E6E6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs text-[#1F2937]">
            <thead className="bg-[#F7F7F5] border-b border-[#E6E6E6] uppercase text-[10px] tracking-wider text-[#667085] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-bold">Task ID</th>
                <th className="py-3 px-4 font-bold">Dept</th>
                <th className="py-3 px-4 font-bold">Asset ID</th>
                <th className="py-3 px-4 font-bold">Task Description</th>
                <th className="py-3 px-4 font-bold">Section</th>
                <th className="py-3 px-4 font-bold">Criticality</th>
                <th className="py-3 px-4 font-bold">Priority</th>
                <th className="py-3 px-4 font-bold">Duration</th>
                <th className="py-3 px-4 font-bold">Track</th>
                <th className="py-3 px-4 font-bold">6-Stage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {filteredTasks.map((t) => {
                const isCrit = t.criticality === 'Critical';
                const isHigh = t.criticality === 'High';

                return (
                  <tr
                    key={t.task_id}
                    onClick={() => setActiveTask(t)}
                    className="hover:bg-[#FFF9F2] transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#1F2937] group-hover:text-[#D96F13]">
                      {t.task_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[9.5px] uppercase ${
                          t.department === 'Engineering'
                            ? 'bg-[#FEF0C7] text-[#B54708]'
                            : t.department === 'Traction'
                            ? 'bg-[#F4EBFF] text-[#6927DA]'
                            : 'bg-[#EFF8FF] text-[#175CD3]'
                        }`}
                      >
                        {t.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{t.asset_id}</td>
                    <td className="py-3 px-4 font-semibold text-[#1F2937]">{t.task_type}</td>
                    <td className="py-3 px-4 font-medium text-[#475467]">{t.section_id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                          isCrit
                            ? 'bg-[#FEE4E2] text-[#D92D20]'
                            : isHigh
                            ? 'bg-[#FEF0C7] text-[#B54708]'
                            : 'bg-[#EFF8FF] text-[#175CD3]'
                        }`}
                      >
                        {t.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-[#D92D20]">
                      {t.priority_score.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#667085]">{t.duration_minutes}m</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-[#475467] bg-[#F1F5F9] px-2 py-0.5 rounded-md font-semibold">
                        {t.affects_line || 'BOTH'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTask(t);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FFF3E6] hover:bg-[#FFE6CC] text-[#B85C00] font-bold text-[10.5px] flex items-center gap-1 border border-[#FFD9B3] transition"
                      >
                        <Wrench className="w-3 h-3 text-[#D96F13]" /> Actions Drawer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 18: 6-Stage Action Package Drawer / Modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E6E6E6] max-w-2xl w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E6E6E6] pb-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#D96F13] uppercase tracking-wider block">
                  Maintenance Action Engine Package
                </span>
                <h3 className="text-base font-bold text-[#1F2937] mt-0.5 font-display">
                  {activeTask.task_id}: {activeTask.task_type} ({activeTask.department})
                </h3>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-[#667085] hover:text-[#1F2937] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#667085]">
              Decomposed into standard 6-stage Indian Railways operational work sequence:
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {loadingActions ? (
                <div className="py-8 text-center text-xs text-[#667085] animate-pulse">Loading decomposed action steps...</div>
              ) : (
                actions.map((act) => (
                  <div
                    key={act.action_id}
                    className="p-3 bg-[#F7F7F5] border border-[#E6E6E6] rounded-xl flex items-start justify-between gap-3 text-xs hover:border-[#FF9933] transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#FF9933] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {act.sequence_order}
                      </span>
                      <div>
                        <h4 className="font-bold text-[#1F2937]">{act.action_type}</h4>
                        <div className="text-[11px] text-[#667085] mt-1 space-x-3">
                          <span>Crew: <b className="text-[#1F2937]">{act.required_crew}</b></span>
                          <span>Resource: <b className="text-[#1F2937]">{act.required_resources}</b></span>
                          <span>Isolation: <b className="text-[#1F2937]">{act.isolation_requirement}</b></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-[#1F2937]">{act.work_duration_minutes} min</span>
                      <span className="text-[10px] text-[#667085] block">(+{act.setup_minutes}m setup)</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#E6E6E6] pt-3.5 flex justify-end">
              <button
                onClick={() => setActiveTask(null)}
                className="px-5 py-2 bg-[#FF9933] hover:bg-[#D96F13] text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                Close Action Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
