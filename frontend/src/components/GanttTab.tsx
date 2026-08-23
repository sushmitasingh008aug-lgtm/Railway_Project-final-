import React, { useState, useRef, useEffect } from 'react';
import { ScheduledTask, apiClient } from '../api/client';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, Clock, Layers } from 'lucide-react';

interface GanttTabProps {
  schedule: ScheduledTask[];
  onRefreshSchedule: () => void;
}

const HORIZON_OPTIONS = [
  { days: 7, label: 'Weekly', minutes: 7 * 1440 },
  { days: 30, label: 'Monthly', minutes: 30 * 1440 },
];

export const GanttTab: React.FC<GanttTabProps> = ({ schedule, onRefreshSchedule }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);

  const horizonMinutes = horizonDays * 1440;
  const dayLabels = Array.from({ length: horizonDays }, (_, i) => `D${i + 1}`);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const handleRunOptimizer = async (days: number) => {
    if (optimizing) return;
    setOptimizing(true);
    setNotification(null);
    try {
      // Kick off the optimizer as a background job — returns immediately.
      await apiClient.post(`/schedule/generate?horizon_days=${days}`);

      // Poll status every 3s until the engine finishes.
      const started = Date.now();
      pollRef.current = setInterval(async () => {
        const elapsed = Math.round((Date.now() - started) / 1000);
        try {
          const st = await apiClient.get('/schedule/status');
          if (st.data?.running) {
            setNotification(`CP-SAT engine running for ${elapsed}s — exploring coordinated block arrangements...`);
            return;
          }
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setOptimizing(false);
          if (st.data?.success) {
            setNotification(st.data.message || 'Optimization Complete!');
            onRefreshSchedule();
          } else {
            setNotification('Optimizer failed. ' + (st.data?.output_tail || '').split('\n').slice(-3).join(' | '));
          }
        } catch {
          /* transient poll error — keep waiting */
        }
      }, 3000);
    } catch (err: any) {
      setOptimizing(false);
      if (err.response?.status === 409) {
        setNotification('Engine is already running — hold on, it will refresh automatically.');
      } else {
        setNotification('Failed to start optimizer: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredTasks = schedule.filter((t) => {
    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    const matchesSearch =
      t.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.task_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Group tasks by section for visual timeline
  const sections = Array.from(new Set(schedule.map((t) => t.section_name))).sort();

  return (
    <div className="space-y-8 pb-12">
      {/* Action Header */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>📅</span> Interactive Master Block Schedule ({horizonDays}-Day {horizonDays > 7 ? 'Monthly' : 'Weekly'} Horizon)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Time-aware maintenance intervals dodging train movements ({horizonMinutes.toLocaleString()} minutes). White-outlined bars = combined multi-department blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Planning Horizon Selector (PS Point 4: Weekly & Monthly) */}
          <div className="flex rounded-lg overflow-hidden border border-[#334155]">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setHorizonDays(opt.days)}
                disabled={optimizing}
                className={`px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                  horizonDays === opt.days
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#182234] text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label} ({opt.days}d)
              </button>
            ))}
          </div>

          <button
            onClick={() => handleRunOptimizer(horizonDays)}
            disabled={optimizing}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {optimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Engine Running (CP-SAT)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Regenerate {horizonDays > 7 ? 'Monthly' : 'Weekly'} Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Visual Gantt Matrix by Section */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Corridor & Section Gantt Lanes</span>
        </h3>

        {/* Dynamic Horizon Timeline Ruler */}
        <div
          className="grid text-[10px] font-semibold text-slate-400 border-b border-[#1f2937] pb-2 text-center"
          style={{ gridTemplateColumns: `repeat(${horizonDays}, minmax(0, 1fr))` }}
        >
          {dayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        {/* Section Lanes */}
        <div className="space-y-4">
          {sections.map((secName) => {
            const secTasks = schedule.filter((t) => t.section_name === secName);
            return (
              <div key={secName} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{secName}</span>
                  <span className="text-slate-500 text-[11px]">{secTasks.length} Blocks Assigned</span>
                </div>
                {/* Lane Bar */}
                <div className="h-7 w-full bg-[#0d1424] rounded-md relative border border-[#1f2937] overflow-hidden flex items-center">
                  {secTasks.map((t) => {
                    const leftPct = (t.start_minute / horizonMinutes) * 100;
                    const widthPct = Math.max(0.6, (t.duration_minutes / horizonMinutes) * 100);

                    let bg = 'bg-sky-500';
                    if (t.department === 'Traction') bg = 'bg-orange-500';
                    if (t.department === 'S&T') bg = 'bg-emerald-500';

                    return (
                      <div
                        key={t.task_id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${t.task_id} (${t.department}): ${t.task_type} | ${t.assigned_start_time} - ${t.assigned_end_time} | Priority: ${t.priority_score}${t.combined_group_id ? ` | Combined Block ${t.combined_group_id}` : ''}`}
                        className={`absolute h-5 rounded cursor-pointer ${bg} opacity-85 hover:opacity-100 hover:scale-110 transition-transform shadow-sm ${
                          t.combined_group_id ? 'ring-2 ring-white/70 z-10' : ''
                        }`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Scheduled Tasks Table */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Assigned Maintenance Blocks Table ({filteredTasks.length} Tasks)</span>
          </h3>

          <div className="flex items-center gap-3">
            {/* Dept Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-[#182234] border border-[#334155] text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Traction">Traction</option>
              <option value="S&T">S&T</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search task, section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#182234] border border-[#334155] text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none placeholder-slate-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#182234] text-slate-400 uppercase font-semibold text-[11px] border-b border-[#334155]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Task Type</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Assigned Start</th>
                <th className="py-3 px-4">Assigned End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {filteredTasks.slice(0, 50).map((t) => (
                <tr key={t.task_id} className="hover:bg-[#182234]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-white">{t.task_id}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.department === 'Engineering'
                          ? 'bg-sky-500/20 text-sky-400'
                          : t.department === 'Traction'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {t.department}
                    </span>
                  </td>
                  <td className="py-3 px-4">{t.section_name}</td>
                  <td className="py-3 px-4">{t.task_type}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        t.criticality === 'Critical'
                          ? 'text-red-400'
                          : t.criticality === 'High'
                          ? 'text-orange-400'
                          : t.criticality === 'Medium'
                          ? 'text-yellow-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {t.criticality}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{t.priority_score.toFixed(1)}</td>
                  <td className="py-3 px-4">{t.duration_minutes}m</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{t.assigned_start_time}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{t.assigned_end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
