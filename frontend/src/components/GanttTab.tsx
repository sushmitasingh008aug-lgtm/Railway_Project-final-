import React, { useState, useRef, useEffect } from 'react';
import { ScheduledTask, Section, TrainMovement, apiClient } from '../api/client';
import { Play, RefreshCw, CheckCircle2, Clock, Layers, RotateCw } from 'lucide-react';

interface GanttTabProps {
  schedule: ScheduledTask[];
  trains: TrainMovement[];
  sections: Section[];
  onRefreshSchedule: () => void;
}

const HORIZON_OPTIONS = [
  { days: 7, label: 'Weekly', minutes: 7 * 1440 },
  { days: 30, label: 'Monthly', minutes: 30 * 1440 },
];

const fmtClock = (min: number) => {
  const day = Math.floor(min / 1440) + 1;
  const h = String(Math.floor((min % 1440) / 60)).padStart(2, '0');
  const m = String(Math.floor(min % 60)).padStart(2, '0');
  return `D${day} ${h}:${m}`;
};

export const GanttTab: React.FC<GanttTabProps> = ({ schedule, trains, sections, onRefreshSchedule }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [horizonDays, setHorizonDays] = useState(7);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const horizonMinutes = horizonDays * 1440;
  const dayLabels = Array.from({ length: horizonDays }, (_, i) => `D${i + 1}`);

  const isDayView = selectedDay !== 'all';
  const viewStart = isDayView ? ((selectedDay as number) - 1) * 1440 : 0;
  const viewLen = isDayView ? 1440 : horizonMinutes;
  const posPct = (min: number) => ((min - viewStart) / viewLen) * 100;

  const laneSections = Array.from(
    new Map(schedule.map((t) => [t.section_id, t.section_name])).entries()
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const secGeo = new Map(sections.map((sec) => [sec.section_id, sec]));
  const boundaryLabel = (sid: string, fallback: string) => {
    const g = secGeo.get(sid);
    return g && g.start_station ? `${g.start_station} → ${g.end_station}` : fallback;
  };

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = () => {
    if (pollRef.current) return;
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      const elapsed = Math.round((Date.now() - started) / 1000);
      try {
        const st = await apiClient.get('/schedule/status');
        if (st.data?.running) {
          setOptimizing(true);
          setNotification(`Optimizer running for ${elapsed}s — exploring coordinated block arrangements...`);
          return;
        }
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setOptimizing(false);
        if (st.data?.success) {
          setNotification(st.data.message || 'Optimization complete!');
          onRefreshSchedule();
        } else {
          setNotification('Optimizer finished. ' + (st.data?.output_tail || '').split('\n').slice(-3).join(' | '));
        }
      } catch {
        /* transient poll error */
      }
    }, 2000);
  };

  useEffect(() => {
    onRefreshSchedule();
    apiClient.get('/schedule/status').then((res) => {
      if (res.data?.running) startPolling();
    }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshSchedule();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleRunOptimizer = async (days: number) => {
    if (optimizing) return;
    setOptimizing(true);
    setNotification(null);
    try {
      await apiClient.post(`/schedule/generate?horizon_days=${days}`);
      startPolling();
    } catch (err: any) {
      setOptimizing(false);
      if (err.response?.status === 409) {
        setNotification('Optimizer already running — will refresh automatically.');
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
    <div className="space-y-6 pb-12">

      {/* Action Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📅</span> Interactive Master Block Schedule ({horizonDays}-Day {horizonDays > 7 ? 'Monthly' : 'Weekly'} Horizon)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Time-aware maintenance intervals avoiding train movements ({horizonMinutes.toLocaleString()} min). Outlined bars = combined multi-dept blocks.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Horizon Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {HORIZON_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setHorizonDays(opt.days)}
                disabled={optimizing}
                className={`px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                  horizonDays === opt.days
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:text-gray-800'
                }`}
              >
                {opt.label} ({opt.days}d)
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || optimizing}
            title="Reload latest schedule from server"
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Regenerate Button */}
          <button
            onClick={() => handleRunOptimizer(horizonDays)}
            disabled={optimizing}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {optimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Optimizer Running...</span>
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
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Gantt Visual */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Corridor &amp; Section Gantt — Trains vs Maintenance Blocks</span>
        </h3>

        {/* Day zoom */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
              selectedDay === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'
            }`}
          >
            ALL
          </button>
          {Array.from({ length: horizonDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                selectedDay === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'
              }`}
            >
              D{d}
            </button>
          ))}
          <span className="text-[10px] text-gray-400 ml-2">
            {isDayView ? `Zoomed: Day ${selectedDay} (00:00–24:00)` : 'Full horizon'}
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-blue-500" />Engineering</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-orange-500" />Traction</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500" />S&amp;T</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-blue-500 ring-2 ring-gray-400/50" />Combined Block</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-red-600" />Passenger Train</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-slate-400" />Freight Train</span>
        </div>

        {/* Timeline ruler */}
        {isDayView ? (
          <div className="grid text-[9px] font-semibold text-gray-400 border-b border-gray-100 pb-2"
            style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => <div key={h}>{String(h).padStart(2, '0')}:00</div>)}
          </div>
        ) : (
          <div className="grid text-[10px] font-semibold text-gray-400 border-b border-gray-100 pb-2 text-center"
            style={{ gridTemplateColumns: `repeat(${horizonDays}, minmax(0, 1fr))` }}>
            {dayLabels.map((label) => <div key={label}>{label}</div>)}
          </div>
        )}

        {/* Section lanes */}
        <div className="space-y-4">
          {laneSections.map(([secId, secName]) => {
            const secTasks = schedule.filter((t) => t.section_id === secId);
            const secTrains = trains.filter((tr) => tr.section_id === secId);
            const inView = (s: number, e: number) => e > viewStart && s < viewStart + viewLen;
            const vert = (line?: string) =>
              line === 'BOTH'
                ? { top: '8%', height: '84%' }
                : line === 'UP'
                ? { top: '6%', height: '38%' }
                : { top: '56%', height: '38%' };
            return (
              <div key={secId} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-700 font-medium">
                  <span>
                    {boundaryLabel(secId, secName)}
                    <span className="text-gray-400 font-normal"> · {secName}</span>
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {secTasks.length} Blocks · {secTrains.length} Train Movements
                  </span>
                </div>
                <div className="flex items-stretch gap-1.5">
                  <div className="w-9 flex flex-col justify-between py-1 text-[9px] font-semibold text-gray-400 shrink-0 text-right leading-tight">
                    <span>↑UP</span>
                    <span>↓DN</span>
                  </div>
                  <div className="relative flex-1 h-16 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />

                    {secTrains.filter((tr) => inView(tr.entry_min, tr.exit_min)).map((tr) => {
                      const v = vert(tr.direction);
                      return (
                        <div
                          key={tr.movement_id}
                          style={{
                            left: `${Math.max(0, posPct(tr.entry_min))}%`,
                            width: `${Math.max(0.4, posPct(tr.exit_min) - posPct(Math.max(tr.entry_min, viewStart)))}%`,
                            top: v.top,
                            height: '30%',
                          }}
                          title={`${tr.train_id} · ${tr.train_type} · ${tr.direction} | ${fmtClock(tr.entry_min)} → ${fmtClock(tr.exit_min)}`}
                          className={`absolute rounded-sm z-0 ${tr.train_type === 'Freight' ? 'bg-slate-400' : 'bg-red-600'} hover:h-[45%] transition-all cursor-crosshair`}
                        />
                      );
                    })}

                    {secTasks.filter((t) => inView(t.start_minute, t.end_minute)).map((t) => {
                      const leftPct = Math.max(0, posPct(t.start_minute));
                      const widthPct = Math.max(0.4, posPct(t.end_minute) - posPct(Math.max(t.start_minute, viewStart)));
                      const v = vert(t.affects_line || 'BOTH');
                      let bg = 'bg-blue-500';
                      if (t.department === 'Traction') bg = 'bg-orange-500';
                      if (t.department === 'S&T') bg = 'bg-emerald-500';
                      return (
                        <div
                          key={t.task_id}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, top: v.top, height: v.height }}
                          title={`${t.task_id} (${t.department}): ${t.task_type} | Line: ${t.affects_line || 'BOTH'} | ${t.assigned_start_time} - ${t.assigned_end_time} | Priority: ${t.priority_score}${t.combined_group_id ? ` | Combined Block ${t.combined_group_id}` : ''}`}
                          className={`absolute rounded cursor-pointer ${bg} opacity-90 hover:opacity-100 transition-all shadow-sm z-[5] ${t.combined_group_id ? 'ring-2 ring-gray-600/40 z-10' : ''}`}
                        >
                          {(t.affects_line || 'BOTH') !== 'BOTH' && widthPct > 3 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/90">
                              {t.affects_line}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Tasks Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span>Assigned Maintenance Blocks ({filteredTasks.length} Tasks)</span>
          </h3>

          <div className="flex items-center gap-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Traction">Traction</option>
              <option value="S&T">S&amp;T</option>
            </select>

            <input
              type="text"
              placeholder="Search task ID (e.g. TSK_464567), section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 w-64 focus:outline-none focus:border-blue-400 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[560px] overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Task Type</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">End</th>
                <th className="py-3 px-4">Line</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400 text-xs">
                    No tasks found matching your search. Try adjusting the search term or department filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.task_id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">{t.task_id}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.department === 'Engineering'
                          ? 'bg-blue-50 text-blue-700'
                          : t.department === 'Traction'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {t.department}
                      </span>
                    </td>
                    <td className="py-3 px-4">{t.section_name}</td>
                    <td className="py-3 px-4">{t.task_type}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        t.criticality === 'Critical' ? 'text-red-600'
                        : t.criticality === 'High' ? 'text-orange-500'
                        : t.criticality === 'Medium' ? 'text-amber-500'
                        : 'text-green-600'
                      }`}>
                        {t.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">{t.priority_score.toFixed(1)}</td>
                    <td className="py-3 px-4">{t.duration_minutes}m</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{t.assigned_start_time}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{t.assigned_end_time}</td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                        {t.affects_line || 'BOTH'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
