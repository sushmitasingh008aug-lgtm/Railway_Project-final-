import React, { useState, useEffect, useCallback } from 'react';
import { ListTodo, Search, Filter, Wrench, ShieldAlert, ChevronLeft, ChevronRight, Layers, ArrowUpDown } from 'lucide-react';
import { ScheduledTask, Section, apiClient, PaginatedResponse } from '../api/client';
import { TaskDetailDrawer } from './TaskDetailDrawer';

interface TasksViewProps {
  schedule?: ScheduledTask[];
  sections?: Section[];
}

export const TasksView: React.FC<TasksViewProps> = ({ schedule = [], sections = [] }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [critFilter, setCritFilter] = useState('ALL');
  const [secFilter, setSecFilter] = useState('ALL');

  // Drawer
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [drawerTaskData, setDrawerTaskData] = useState<any>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (deptFilter !== 'ALL') params.append('department', deptFilter);
      if (critFilter !== 'ALL') params.append('criticality', critFilter);
      if (secFilter !== 'ALL') params.append('section', secFilter);

      const res = await apiClient.get<PaginatedResponse<any>>(`/tasks?${params.toString()}`);
      if (res.data && res.data.data) {
        setTasks(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.total_pages || Math.ceil(res.data.total / limit));
      } else {
        fallbackToSchedule();
      }
    } catch (err) {
      console.warn('Could not load paginated tasks, falling back to schedule prop:', err);
      fallbackToSchedule();
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, deptFilter, critFilter, secFilter]);

  const fallbackToSchedule = () => {
    let filtered = schedule;
    if (deptFilter !== 'ALL') filtered = filtered.filter(t => t.department === deptFilter);
    if (critFilter !== 'ALL') filtered = filtered.filter(t => t.criticality === critFilter);
    if (secFilter !== 'ALL') filtered = filtered.filter(t => t.section_id === secFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.task_id.toLowerCase().includes(q) ||
        t.task_type.toLowerCase().includes(q) ||
        t.asset_id.toLowerCase().includes(q)
      );
    }
    setTotal(filtered.length);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / limit)));
    setTasks(filtered.slice((page - 1) * limit, page * limit));
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenDrawer = (task: any) => {
    setDrawerTaskId(task.task_id);
    setDrawerTaskData(task);
  };

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
            Catalog of {total.toLocaleString()} multi-department tasks across Engineering (TMS), Traction (TDMS), and Signalling (SMMS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search task, asset, type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs border border-[#E6E6E6] rounded-xl bg-[#F7F7F5] w-48 focus:outline-none focus:border-[#FF9933] focus:bg-white transition"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-[#E6E6E6] rounded-xl px-3 py-1.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering (TMS)</option>
            <option value="Traction">Traction (TDMS)</option>
            <option value="S&T">Signalling (SMMS)</option>
          </select>

          <select
            value={critFilter}
            onChange={(e) => {
              setCritFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setSecFilter(e.target.value);
              setPage(1);
            }}
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
        <div className="overflow-x-auto min-h-[400px]">
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
                <th className="py-3 px-4 font-bold">Line</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-[#667085] animate-pulse">
                    Querying 12K maintenance tasks backlog...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-[#667085]">
                    No maintenance tasks matched the selected criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const isCrit = t.criticality === 'Critical';
                  const isHigh = t.criticality === 'High';
                  const prio = Number(t.priority_score || t.priority || 0);

                  return (
                    <tr
                      key={t.task_id}
                      onClick={() => handleOpenDrawer(t)}
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
                      <td className="py-3 px-4 font-semibold text-[#1F2937]">{t.task_type || t.description}</td>
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
                        {prio.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#667085]">{t.duration_minutes}m</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] text-[#475467] bg-[#F1F5F9] px-2 py-0.5 rounded-md font-semibold">
                          {t.affects_line || t.line_affected || 'BOTH'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(t);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FFF3E6] hover:bg-[#FFE6CC] text-[#B85C00] font-bold text-[10.5px] inline-flex items-center gap-1 border border-[#FFD9B3] transition"
                        >
                          <Wrench className="w-3 h-3 text-[#D96F13]" /> Detail &amp; Actions
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 border-t border-[#E6E6E6] bg-[#F7F7F5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#475467]">
          <div>
            Showing <b className="text-[#1F2937]">{tasks.length > 0 ? (page - 1) * limit + 1 : 0}</b> to{' '}
            <b className="text-[#1F2937]">{Math.min(page * limit, total)}</b> of{' '}
            <b className="text-[#1F2937]">{total.toLocaleString()}</b> total tasks
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] bg-white text-xs font-semibold disabled:opacity-40 hover:bg-[#F7F7F5] transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="font-semibold text-xs px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] bg-white text-xs font-semibold disabled:opacity-40 hover:bg-[#F7F7F5] transition flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={drawerTaskId}
        taskData={drawerTaskData}
        onClose={() => {
          setDrawerTaskId(null);
          setDrawerTaskData(null);
        }}
      />
    </div>
  );
};
