import React, { useState, useRef, useEffect } from 'react';
import { ScheduledTask, TrainMovement, apiClient } from '../api/client';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, Clock, Layers } from 'lucide-react';

interface GanttTabProps {
  schedule: ScheduledTask[];
  trains: TrainMovement[];
  onRefreshSchedule: () => void;
}

const HORIZON_OPTIONS = [
  { days: 7, label: 'Weekly', minutes: 7 * 1440 },
  { days: 30, label: 'Monthly', minutes: 30 * 1440 },
];

// Clock label like "D3 06:12" from an optimizer-relative minute.
const fmtClock = (min: number) => {
  const day = Math.floor(min / 1440) + 1;
  const h = String(Math.floor((min % 1440) / 60)).padStart(2, '0');
  const m = String(Math.floor(min % 60)).padStart(2, '0');
  return `D${day} ${h}:${m}`;
};

export const GanttTab: React.FC<GanttTabProps> = ({ schedule, trains, onRefreshSchedule }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const horizonMinutes = horizonDays * 1440;
  const dayLabels = Array.from({ length: horizonDays }, (_, i) => `D${i + 1}`);

  // Active view window (full horizon or a single zoomed day).
  const isDayView = selectedDay !== 'all';
  const viewStart = isDayView ? ((selectedDay as number) - 1) * 1440 : 0;
  const viewLen = isDayView ? 1440 : horizonMinutes;
  const posPct = (min: number) => ((min - viewStart) / viewLen) * 100;

  // Lanes keyed by section_id so train movements join reliably.
  const laneSections = Array.from(
    new Map(schedule.map((t) => [t.section_id, t.section_name])).entries()
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = () => {
    if (pollRef.current) return; // already polling
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      const elapsed = Math.round((Date.now() - started) / 1000);
      try {
        const st = await apiClient.get('/schedule/status');
        if (st.data?.running) {
          setOptimizing(true);
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
  };

  // Resume progress UI if an optimizer job was started elsewhere
  // (e.g., auto-triggered by the Submit tab).
  useEffect(() => {
    apiClient.get('/schedule/status').then((res) => {
      if (res.data?.running) startPolling();
    }).catch(() => {});
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunOptimizer = async (days: number) => {
    if (optimizing) return;
    setOptimizing(true);
    setNotification(null);
    try {
      // Kick off the optimizer as a background job — returns immediately.
      await apiClient.post(`/schedule/generate?horizon_days=${days}`);
      startPolling();
    } catch (err: any) {
      setOptimizing(false);
      if (err.response?.status === 409) {
        setNotification('Engine is already running — hold on, it will refresh automatically.');
        startPolling();
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
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Corridor &amp; Section Gantt Lanes — Trains vs Maintenance Blocks</span>
        </h3>

        {/* Day Zoom Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              selectedDay === 'all' ? 'bg-blue-600 text-white' : 'bg-[#182234] text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL
          </button>
          {Array.from({ length: horizonDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                selectedDay === d ? 'bg-blue-600 text-white' : 'bg-[#182234] text-slate-400 hover:text-slate-200'
              }`}
            >
              D{d}
            </button>
          ))}
          <span className="text-[10px] text-slate-500 ml-2">
            {isDayView ? `Zoomed into Day ${selectedDay} (00:00–24:00)` : 'Full horizon view'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-sky-500"></span>Engineering</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-orange-500"></span>Traction</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500"></span>S&amp;T</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-sky-500 ring-2 ring-white/70"></span>Combined Block</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-red-700"></span>Passenger Train</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-slate-500"></span>Freight Train</span>
        </div>

        {/* Timeline Ruler */}
        {isDayView ? (
          <div
            className="grid text-[9px] font-semibold text-slate-500 border-b border-[#1f2937] pb-2 text-left"
            style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
          >
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
              <div key={h}>{String(h).padStart(2, '0')}:00</div>
            ))}
          </div>
        ) : (
          <div
            className="grid text-[10px] font-semibold text-slate-400 border-b border-[#1f2937] pb-2 text-center"
            style={{ gridTemplateColumns: `repeat(${horizonDays}, minmax(0, 1fr))` }}
          >
            {dayLabels.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
        )}

        {/* Section Lanes */}
        <div className="space-y-4">
          {laneSections.map(([secId, secName]) => {
            const secTasks = schedule.filter((t) => t.section_id === secId);
            const secTrains = trains.filter((tr) => tr.section_id === secId);
            const inView = (s: number, e: number) => e > viewStart && s < viewStart + viewLen;
            return (
              <div key={secId} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{secName}</span>
                  <span className="text-slate-500 text-[11px]">
                    {secTasks.length} Blocks · {secTrains.length} Train Movements
                  </span>
                </div>
                {/* Lane Bar: trains behind, blocks on top */}
                <div className="h-8 w-full bg-[#0a101e] rounded-md relative border border-[#1f2937] overflow-hidden">
                  {secTrains.filter((tr) => inView(tr.entry_min, tr.exit_min)).map((tr) => (
                    <div
                      key={tr.movement_id}
                      style={{
                        left: `${Math.max(0, posPct(tr.entry_min))}%`,
                        width: `${Math.max(0.4, posPct(tr.exit_min) - posPct(Math.max(tr.entry_min, viewStart)))}%`,
                      }}
                      title={`${tr.train_id} · ${tr.train_type} | ${fmtClock(tr.entry_min)} → ${fmtClock(tr.exit_min)}`}
                      className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-sm z-0 ${
                        tr.train_type === 'Freight' ? 'bg-slate-500/80' : 'bg-red-700/90'
                      } hover:h-2.5 transition-all cursor-crosshair`}
                    ></div>
                  ))}
                  {secTasks.filter((t) => inView(t.start_minute, t.end_minute)).map((t) => {
                    const leftPct = Math.max(0, posPct(t.start_minute));
                    const widthPct = Math.max(0.4, posPct(t.end_minute) - posPct(Math.max(t.start_minute, viewStart)));

                    let bg = 'bg-sky-500';
                    if (t.department === 'Traction') bg = 'bg-orange-500';
                    if (t.department === 'S&T') bg = 'bg-emerald-500';

                    return (
                      <div
                        key={t.task_id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${t.task_id} (${t.department}): ${t.task_type} | ${t.assigned_start_time} - ${t.assigned_end_time} | Priority: ${t.priority_score}${t.combined_group_id ? ` | Combined Block ${t.combined_group_id}` : ''}`}
                        className={`absolute top-1/2 -translate-y-1/2 h-4 rounded cursor-pointer ${bg} opacity-90 hover:opacity-100 hover:h-5 transition-all shadow-sm z-[5] ${
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
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto rounded-lg border border-[#1f2937]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#182234] text-slate-400 uppercase font-semibold text-[11px] border-b border-[#334155] sticky top-0 z-10">
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
              {filteredTasks.map((t) => (
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
