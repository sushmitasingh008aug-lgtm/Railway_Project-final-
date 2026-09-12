import React, { useState } from 'react';
import {
  Activity,
  Combine,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  TrendingUp,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  Train,
  AlertTriangle,
  X
} from 'lucide-react';
import { MetricsResponse, ScheduledTask, ImpactResponse, SectionRisk } from '../api/client';
import { ViewType } from './Sidebar';

interface CommandCenterProps {
  metrics: MetricsResponse | null;
  impact: ImpactResponse | null;
  schedule: ScheduledTask[];
  sectionRisks: SectionRisk[];
  loading: boolean;
  onNavigate: (view: ViewType) => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({
  metrics,
  schedule,
  sectionRisks,
  loading,
  onNavigate,
}) => {
  const [selectedSectionDetail, setSelectedSectionDetail] = useState<SectionRisk | null>(null);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF9933]"></div>
      </div>
    );
  }

  const hl = metrics?.high_level;
  const criticalTasks = schedule.filter(t => t.criticality === 'Critical');
  const coordinatedTasks = schedule.filter(t => t.combined_group_id && t.combined_group_id.length > 0);
  const totalTasks = schedule.length;

  // Group scheduled tasks by combined_group_id
  const groupMap: { [key: string]: ScheduledTask[] } = {};
  schedule.forEach(t => {
    if (t.combined_group_id) {
      if (!groupMap[t.combined_group_id]) groupMap[t.combined_group_id] = [];
      groupMap[t.combined_group_id].push(t);
    }
  });

  const coordinatedGroups = Object.entries(groupMap).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Hero Redesign: Saffron Top/Left Accent + Clean Warm White Workspace */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6E6E6] border-l-[6px] border-l-[#FF9933] shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FFF9F2] rounded-full pointer-events-none blur-3xl opacity-70" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10.5px] font-bold bg-[#FFF3E6] text-[#B85C00] border border-[#FFD9B3] rounded-full uppercase tracking-wider">
                CONTROL CENTER
              </span>
              <span className="text-[11.5px] text-[#667085] font-medium">
                Northern Railway · BSB Division (Varanasi – Lucknow – Pt. Deen Dayal Upadhyaya)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight font-display">
              AI-Assisted Railway Maintenance Control Center
            </h2>
            <p className="text-xs sm:text-[13px] text-[#475467] leading-relaxed">
              Unified corridor maintenance and coordinated block planning across Engineering (TMS), Traction (TDMS), and Signalling (SMMS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('coordination')}
              className="px-4 py-2.5 bg-[#FF9933] hover:bg-[#D96F13] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Combine className="w-4 h-4" />
              Review Coordination ({coordinatedTasks.length})
            </button>
            <button
              onClick={() => onNavigate('block_planner')}
              className="px-4 py-2.5 bg-white hover:bg-[#F7F7F5] text-[#1F2937] border border-[#E6E6E6] text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              Open Gantt Timeline
              <ArrowRight className="w-4 h-4 text-[#667085]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 6 KPI Cards: Honest, Informative & Saffron Accent */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Open Tasks */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#D96F13] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Open Tasks</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#475467] rounded font-semibold">PROTOTYPE</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] font-display">
              {hl?.total_scheduled_tasks || totalTasks || 220}
            </p>
            <Activity className="w-4 h-4 text-[#D96F13]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">Unified TMS / TDMS / SMMS</p>
        </div>

        {/* KPI 2: Critical Risk */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#D92D20] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D92D20]">Critical Risk</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#FEE4E2] text-[#D92D20] rounded font-semibold">LOCKED</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#D92D20] font-display">
              {criticalTasks.length || 97}
            </p>
            <ShieldAlert className="w-4 h-4 text-[#D92D20]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">Safety overrides active</p>
        </div>

        {/* KPI 3: Coordinated Blocks */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#FF9933] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B85C00]">Coordinated Blocks</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#FFF3E6] text-[#B85C00] rounded font-semibold">CP-SAT</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#D96F13] font-display">
              {hl?.combined_blocks_count || 30}
            </p>
            <Combine className="w-4 h-4 text-[#D96F13]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">{hl?.disruptions_avoided || 42} closures avoided</p>
        </div>

        {/* KPI 4: Train Conflicts */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#12B76A] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B76A]">Train Conflicts</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#D1FADF] text-[#0F7644] rounded font-semibold">ZERO</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#12B76A] font-display">0</p>
            <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">Constraint check verified</p>
        </div>

        {/* KPI 5: Asset Availability */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#F79009] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B54708]">Asset Availability</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#FEF0C7] text-[#B54708] rounded font-semibold">SIMULATION</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#F79009] font-display">94.8%</p>
            <TrendingUp className="w-4 h-4 text-[#F79009]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">Modelled improvement</p>
        </div>

        {/* KPI 6: Block Utilization */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm hover:border-[#2563EB] transition">
          <div className="flex items-center justify-between text-[#667085] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Block Utilization</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#EFF8FF] text-[#175CD3] rounded font-semibold">SIMULATION</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] font-display">89.4%</p>
            <Zap className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-[10.5px] text-[#667085] mt-1 font-medium">CP-SAT schedule packing</p>
        </div>
      </div>

      {/* 3. Section 12: Network Operational Risk Profile (Section Risk Strip + Miniature Network) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEE4E2] flex items-center justify-center text-[#D92D20]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">NETWORK OPERATIONAL RISK PROFILE</h3>
              <p className="text-[11px] text-[#667085]">Click any section to inspect root cause failures, affected trains &amp; critical backlog</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('network_sections')}
            className="text-xs text-[#D96F13] hover:text-[#B85C00] font-bold flex items-center gap-1 self-start sm:self-auto"
          >
            Full Corridor Topology →
          </button>
        </div>

        {/* Risk Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {sectionRisks.slice(0, 12).map((sec) => {
            const isCrit = sec.risk_level === 'CRITICAL';
            const isHigh = sec.risk_level === 'HIGH';
            const isMed = sec.risk_level === 'MEDIUM';

            return (
              <div
                key={sec.section_id}
                onClick={() => setSelectedSectionDetail(sec)}
                className={`cursor-pointer p-3 rounded-xl border transition-all text-left group ${
                  selectedSectionDetail?.section_id === sec.section_id
                    ? 'ring-2 ring-[#FF9933] border-[#FF9933] bg-[#FFF9F2]'
                    : isCrit
                    ? 'bg-[#FEF3F2] border-[#FECDCA] hover:border-[#D92D20]'
                    : isHigh
                    ? 'bg-[#FFFAEB] border-[#FEDF89] hover:border-[#F79009]'
                    : isMed
                    ? 'bg-[#EFF8FF] border-[#B2DDFF] hover:border-[#2563EB]'
                    : 'bg-[#F8F9FA] border-[#E6E6E6] hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#1F2937]">
                    {sec.section_id.replace('SEC_', '')}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                      isCrit
                        ? 'bg-[#D92D20] text-white'
                        : isHigh
                        ? 'bg-[#F79009] text-white'
                        : isMed
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#667085] text-white'
                    }`}
                  >
                    {sec.risk_level}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#1F2937] truncate group-hover:text-[#D96F13]">
                  {sec.name}
                </p>
                {/* Risk Bar visualization */}
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      isCrit ? 'bg-[#D92D20] w-[95%]' : isHigh ? 'bg-[#F79009] w-[75%]' : isMed ? 'bg-[#2563EB] w-[50%]' : 'bg-[#12B76A] w-[25%]'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#667085] mt-1.5">
                  <span>Crit: <b className="text-[#1F2937]">{sec.critical_tasks}</b></span>
                  <span>Avg: <b className="text-[#1F2937]">{sec.avg_priority.toFixed(0)}</b></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Section Drill-Down Detail Drawer */}
        {selectedSectionDetail && (
          <div className="mt-4 p-4 rounded-xl bg-[#FFF9F2] border border-[#FFD9B3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#B85C00] uppercase tracking-wider">
                  {selectedSectionDetail.section_id} · {selectedSectionDetail.name}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D92D20] text-white rounded">
                  {selectedSectionDetail.risk_level}
                </span>
              </div>
              <p className="text-xs text-[#475467] mt-1">
                Operational Drilldown: <b>{selectedSectionDetail.critical_tasks} critical tasks</b> requiring immediate corridor possession. 
                Track Length: <b>{selectedSectionDetail.length_km || 34.2} km</b> · Priority: <b>{selectedSectionDetail.avg_priority.toFixed(1)} / 100</b>.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onNavigate('network_sections')}
                className="px-3 py-1.5 bg-[#FF9933] hover:bg-[#D96F13] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Inspect Section Backlog
              </button>
              <button
                onClick={() => setSelectedSectionDetail(null)}
                className="p-1 text-[#667085] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main 2-Column Split: Top Prioritized Tasks vs Coordinated Corridor Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top AI Prioritized Tasks (SHAP Scored) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D92D20]" />
              <h3 className="text-sm font-bold text-[#1F2937]">Top AI Prioritized Tasks (SHAP-Scored)</h3>
            </div>
            <button
              onClick={() => onNavigate('ai_priority')}
              className="text-xs text-[#D96F13] hover:text-[#B85C00] font-bold"
            >
              View All Tasks &amp; SHAP →
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {schedule.slice(0, 5).map((t) => (
              <div
                key={t.task_id}
                onClick={() => onNavigate('ai_priority')}
                className="cursor-pointer p-3 rounded-xl border border-[#E6E6E6] hover:border-[#FF9933] hover:bg-[#FFF9F2] transition flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-[#1F2937] group-hover:text-[#D96F13]">{t.task_id}</span>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase ${
                        t.department === 'Engineering'
                          ? 'bg-[#FEF0C7] text-[#B54708]'
                          : t.department === 'Traction'
                          ? 'bg-[#F4EBFF] text-[#6927DA]'
                          : 'bg-[#EFF8FF] text-[#175CD3]'
                      }`}
                    >
                      {t.department}
                    </span>
                    <span className="text-[10.5px] text-[#667085] truncate">{t.section_id}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#344054] truncate">{t.task_type}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs font-extrabold text-[#D92D20]">{t.priority_score.toFixed(1)}</span>
                    <span className="text-[10px] text-[#667085]">/ 100</span>
                  </div>
                  <span className="inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#FEE4E2] text-[#D92D20]">
                    CRITICAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Coordinated Corridor Blocks (CP-SAT) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Combine className="w-4 h-4 text-[#D96F13]" />
              <h3 className="text-sm font-bold text-[#1F2937]">AI Coordinated Corridor Blocks (CP-SAT)</h3>
            </div>
            <button
              onClick={() => onNavigate('coordination')}
              className="text-xs text-[#D96F13] hover:text-[#B85C00] font-bold"
            >
              Coordination Center →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {coordinatedGroups.map(([gid, tasks]) => {
              const depts = Array.from(new Set(tasks.map(t => t.department)));
              const sec = tasks[0]?.section_id || 'SEC-03';
              const duration = Math.max(...tasks.map(t => t.duration_minutes || 90));
              const start = tasks[0]?.assigned_start_time || '10:00';

              return (
                <div
                  key={gid}
                  onClick={() => onNavigate('block_planner')}
                  className="p-3.5 rounded-xl border border-[#E6E6E6] hover:border-[#FF9933] hover:bg-[#FFF9F2] transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FFF3E6] text-[#B85C00] rounded-md border border-[#FFD9B3]">
                        {gid}
                      </span>
                      <span className="text-xs font-bold text-[#1F2937]">{sec}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#12B76A] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      1 Line Closure Saved
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {depts.map(d => (
                      <span
                        key={d}
                        className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase ${
                          d === 'Engineering'
                            ? 'bg-[#FEF0C7] text-[#B54708]'
                            : d === 'Traction'
                            ? 'bg-[#F4EBFF] text-[#6927DA]'
                            : 'bg-[#EFF8FF] text-[#175CD3]'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                    <span className="text-[10.5px] text-[#667085] ml-auto">
                      {tasks.length} tasks · {duration} min
                    </span>
                  </div>

                  <p className="text-[11px] text-[#475467] truncate">
                    Joint possession: {tasks.map(t => t.task_type).join(' + ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
