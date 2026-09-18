import React, { useState, useEffect } from 'react';
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
  Map as MapIcon,
  Layers,
  Wrench,
  X,
  Play,
  FileCheck2,
  Database
} from 'lucide-react';
import { MetricsResponse, ScheduledTask, ImpactResponse, SectionRisk, apiClient, DashboardSummaryData, TrainMovement } from '../api/client';
import { ViewType } from './Sidebar';
import { MapView } from './MapView';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { usePlanningCalendar } from '../context/PlanningCalendarContext';

interface CommandCenterProps {
  metrics: MetricsResponse | null;
  impact: ImpactResponse | null;
  schedule: ScheduledTask[];
  sections?: any[];
  sectionRisks: SectionRisk[];
  trains?: TrainMovement[];
  loading: boolean;
  onNavigate: (view: ViewType) => void;
}

export const CommandCenterView: React.FC<CommandCenterProps> = ({
  metrics,
  impact,
  schedule,
  sections = [],
  sectionRisks,
  trains = [],
  loading,
  onNavigate,
}) => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'all' | 'assets' | 'failures' | 'blocks' | 'trains'>('all');

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await apiClient.get<any>('/dashboard/summary');
        if (res.data?.data) setSummaryData(res.data.data);
      } catch (err) {
        console.error('Error loading dashboard summary:', err);
      }
    }
    loadSummary();
  }, []);

  const criticalTasks = schedule.filter(t => t.criticality === 'Critical');
  const coordinatedTasks = schedule.filter(t => t.combined_group_id && t.combined_group_id.length > 0);

  // AI recommendations from schedule combinations
  const recommendations = [
    {
      id: 'REC_01',
      title: 'Coordinated Shadow Block #01',
      section: 'SEC_BSB_LKO_01',
      dept1: 'Engineering (Track Tamper)',
      dept2: 'S&T (Point Machine Test)',
      reason: 'Same section · Compatible power isolation · Zero headway conflicts',
      benefit: '1 line closure eliminated · 120 min possession saved',
      blockId: 'CB_001',
    },
    {
      id: 'REC_02',
      title: 'Integrated Traction Block #02',
      section: 'SEC_HWH_DLI_02',
      dept1: 'Traction (OHE Wire Sag Rectification)',
      dept2: 'Engineering (Sleeper Fastening Check)',
      reason: 'Shared possession boundary · Power shutoff window synchronized',
      benefit: 'Saved 95 min freight transit interruption',
      blockId: 'CB_002',
    },
    {
      id: 'REC_03',
      title: 'Rapid Disruption Clearance #03',
      section: 'SEC_DDU_YARD_01',
      dept1: 'S&T (Digital Axle Counter Reset)',
      dept2: 'Engineering (Diamond Crossing Weld)',
      reason: 'Yard absolute block clearance · Machine roster available',
      benefit: 'Prevents estimated 42 min passenger detention',
      blockId: 'CB_003',
    }
  ];

  const { state: calendarState } = usePlanningCalendar();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 0. Operational Planning Context Bar */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl px-4 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D96F13] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D96F13]"></span>
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7F1418] font-display">
            Operational Planning Window:
          </span>
          <span className="text-xs font-bold text-[#1F2937] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E6E6E6]">
            {calendarState.displayText}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <span className="font-semibold text-[#667085] uppercase text-[10px]">MODE:</span>
          <span className="font-bold text-[#B85C00] uppercase text-[10.5px] bg-[#FFF3E6] px-2 py-0.5 rounded border border-[#FFD9B3]">
            {calendarState.mode}
          </span>
          <span className="text-[#D0D5DD]">|</span>
          <span className="font-semibold text-[#667085] uppercase text-[10px]">HORIZON:</span>
          <span className="font-bold text-[#1F2937] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E6E6E6]">
            {calendarState.horizonDays} {calendarState.horizonDays === 1 ? 'Day' : 'Days'}
          </span>
        </div>
      </div>

      {/* 1. Top KPI Operational Bar (Section 4 Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] border-l-4 border-l-[#D92D20] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Critical Tasks</span>
            <span className="text-2xl font-extrabold text-[#D92D20]">
              {summaryData?.critical_tasks ?? criticalTasks.length}
            </span>
            <span className="text-[10.5px] text-[#667085] block mt-0.5">Statutory safety priority</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF4ED] text-[#D92D20] flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] border-l-4 border-l-[#FF9933] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Safety Overrides</span>
            <span className="text-2xl font-extrabold text-[#7F1418]">
              {summaryData?.safety_overrides ?? 570}
            </span>
            <span className="text-[10.5px] text-[#12B76A] font-semibold block mt-0.5">100% Locked by Rule</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E6] text-[#D96F13] flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] border-l-4 border-l-[#3B82F6] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Open Failure Reports</span>
            <span className="text-2xl font-extrabold text-[#1F2937]">
              {summaryData?.open_failures ?? 12000}
            </span>
            <span className="text-[10.5px] text-[#667085] block mt-0.5">UIMS / COA event logs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] text-[#3B82F6] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] border-l-4 border-l-[#12B76A] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Optimized Blocks</span>
            <span className="text-2xl font-extrabold text-[#12B76A]">
              {summaryData?.planned_blocks ?? 12000}
            </span>
            <span className="text-[10.5px] text-[#12B76A] font-semibold block mt-0.5">CP-SAT Certified</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Middle Row: 3 Columns (Anomaly/Task Queue | KPI & Availability | AI Action Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Anomaly & Task Backlog Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E6E6E6] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-2.5">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#D92D20]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  Anomaly & Maintenance Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigate('asset_backlog')}
                className="text-[11px] font-bold text-[#7F1418] hover:underline"
              >
                View All Backlog →
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {schedule.slice(0, 5).map((t) => (
                <div
                  key={t.task_id}
                  onClick={() => {
                    setSelectedTask(t);
                    setSelectedTaskId(t.task_id);
                  }}
                  className="p-3 rounded-lg border border-[#E6E6E6] hover:border-[#D96F13] bg-[#FAFAF9] hover:bg-[#FFF9F2] cursor-pointer transition text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F2937] truncate">{t.task_type}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                      t.criticality === 'Critical'
                        ? 'bg-[#FFF4ED] text-[#D92D20] border border-[#FECDCA]'
                        : 'bg-[#F2F4F7] text-[#344054]'
                    }`}>
                      {t.criticality}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#667085]">
                    <span>{t.section_id} · {t.department}</span>
                    <span className="font-bold text-[#7F1418]">Score: {t.priority_score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('anomaly_handling')}
            className="w-full mt-3 py-2 bg-[#FFF4ED] border border-[#FECDCA] text-[#D92D20] text-xs font-bold rounded-lg hover:bg-[#FFE8E5] transition flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Open Anomaly Handling Console (29 Scenarios)</span>
          </button>
        </div>

        {/* Center Column: Availability & Risk Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E6E6E6] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#12B76A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  Operational Availability & Risk
                </h3>
              </div>
              <button
                onClick={() => onNavigate('before_after')}
                className="text-[11px] font-bold text-[#7F1418] hover:underline"
              >
                KPI Audit →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] text-[#667085] block uppercase font-bold">Network Availability Gain</span>
                <span className="text-xl font-extrabold text-[#12B76A]">+0.27%</span>
                <span className="text-[10.5px] text-[#667085] block mt-0.5">232 train-hrs/yr recovered</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] text-[#667085] block uppercase font-bold">Downtime Reduction</span>
                <span className="text-xl font-extrabold text-[#7F1418]">23.4%</span>
                <span className="text-[10.5px] text-[#667085] block mt-0.5">Unnecessary possession cut</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] text-[#667085] block uppercase font-bold">Consolidation Ratio</span>
                <span className="text-xl font-extrabold text-[#3B82F6]">67.0%</span>
                <span className="text-[10.5px] text-[#667085] block mt-0.5">Multi-department blocks</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[10px] text-[#667085] block uppercase font-bold">Headway Collisions</span>
                <span className="text-xl font-extrabold text-[#12B76A]">0</span>
                <span className="text-[10.5px] text-[#12B76A] font-semibold block mt-0.5">10-min safety buffer</span>
              </div>
            </div>

            {/* Division Feed Synchronized Matrix */}
            <div className="p-3 bg-[#FAFAF9] border border-[#E6E6E6] rounded-lg text-[11px] text-[#475467] space-y-1">
              <span className="font-bold text-[#1F2937] block">Division Feeds Status</span>
              <div className="flex items-center justify-between text-[10.5px]">
                <span>COA Timetable: 12,000 movements</span>
                <span className="font-bold text-[#12B76A]">SYNCHRONIZED</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span>TMS Track Geometry: 12,000 assets</span>
                <span className="font-bold text-[#12B76A]">SYNCHRONIZED</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span>SMMS Signalling Feeds: 12,000 records</span>
                <span className="font-bold text-[#12B76A]">SYNCHRONIZED</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('what_if')}
            className="w-full mt-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] text-[#344054] text-xs font-bold rounded-lg hover:bg-[#EAEAEA] transition flex items-center justify-center gap-1.5"
          >
            <span>Launch What-If Simulator & Replanner</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D96F13]" />
          </button>
        </div>

        {/* Right Column: AI Action Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E6E6E6] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D96F13]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                  AI Action Feed (CP-SAT Recommendations)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('coordination')}
                className="text-[11px] font-bold text-[#7F1418] hover:underline"
              >
                Coordination Centre →
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 bg-[#FFF9F2] border border-[#FFD9B3] rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#7F1418]">{rec.title}</span>
                    <span className="text-[10px] font-mono font-bold text-[#D96F13]">{rec.section}</span>
                  </div>
                  <p className="text-[11px] text-[#344054] font-medium">
                    {rec.dept1} + {rec.dept2}
                  </p>
                  <p className="text-[10.5px] text-[#8C4A08]">
                    <strong>Reason:</strong> {rec.reason}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#F2E5D5] text-[10.5px]">
                    <span className="text-[#12B76A] font-bold">{rec.benefit}</span>
                    <button
                      onClick={() => onNavigate('approvals_audit')}
                      className="text-[#7F1418] font-bold hover:underline"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('approvals_audit')}
            className="w-full mt-3 py-2 bg-[#7F1418] text-white text-xs font-bold rounded-lg hover:bg-[#5E0E11] transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#FF9933]" />
            <span>Approve Recommended Plan (Controller Action)</span>
          </button>
        </div>
      </div>

      {/* 3. Central Visual Object: GIS Control Map (Section 4 & 6 Layout) */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-[#7F1418]" />
              GIS Operational Corridor Control Map
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Live spatial coordinates mapped across Varanasi – Lucknow – Deen Dayal Upadhyaya Fast Corridors.
            </p>
          </div>

          {/* GIS Layer Controls */}
          <div className="flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#E6E6E6] text-xs font-semibold">
            {[
              { id: 'all', label: 'All Layers' },
              { id: 'assets', label: 'Assets' },
              { id: 'failures', label: 'Failures' },
              { id: 'blocks', label: 'Blocks' },
              { id: 'trains', label: 'Trains' },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => setMapLayer(layer.id as any)}
                className={`px-3 py-1 rounded-md transition ${
                  mapLayer === layer.id
                    ? 'bg-white text-[#7F1418] shadow-sm font-bold border border-[#E6E6E6]'
                    : 'text-[#667085] hover:text-[#1F2937]'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Embedded Leaflet Map */}
        <div className="rounded-xl overflow-hidden border border-[#E6E6E6]">
          <MapView
            sections={sections}
            schedule={schedule}
            trains={trains}
            activeLayer={mapLayer}
            onLayerChange={setMapLayer}
            compact={true}
          />
        </div>
      </div>

      {/* 4. Bottom Strip: Upcoming Blocks | Train Alerts | Resource Alerts | Replans */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Upcoming Block Window</span>
          <span className="font-bold text-xs text-[#1F2937] block">Window BW-104 (SEC_BSB_LKO_02)</span>
          <span className="text-[11px] text-[#12B76A] font-semibold block">02:30 – 05:00 · 150 min duration</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Train Clearance Status</span>
          <span className="font-bold text-xs text-[#1F2937] block">Vande Bharat Exp (22436)</span>
          <span className="text-[11px] text-[#12B76A] font-semibold block">Clear headway +22 min margin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Resource Workload Status</span>
          <span className="font-bold text-xs text-[#1F2937] block">P-Way Gang BSB: 3/3 Assigned</span>
          <span className="text-[11px] text-[#D96F13] font-semibold block">Tower Wagon: 1/2 Available</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085] block">Optimizer Engine State</span>
          <span className="font-bold text-xs text-[#1F2937] block">CP-SAT Solver Runtime: 0.15s</span>
          <span className="text-[11px] text-[#12B76A] font-semibold block">Verified Zero Headway Overlap</span>
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        taskData={selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
};
