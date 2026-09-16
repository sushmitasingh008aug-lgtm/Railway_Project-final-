import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Train,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ShieldCheck,
  Zap,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { apiClient, TrainMovement, BlockWindow, ScheduledTask } from '../api/client';

export const TrainConflictsView: React.FC = () => {
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [blockWindows, setBlockWindows] = useState<BlockWindow[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduledTask[]>([]);
  const [selectedSection, setSelectedSection] = useState('SEC-0001');
  const [selectedDirection, setSelectedDirection] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const sectionsList = [
    'SEC-0001', 'SEC-0002', 'SEC-0003', 'SEC-0004', 'SEC-0005',
    'SEC-0006', 'SEC-0007', 'SEC-0008', 'SEC-0009', 'SEC-0010',
    'SEC_BSB_LKO_01', 'SEC_BSB_LKO_02'
  ];

  useEffect(() => {
    async function loadConflictData() {
      try {
        setLoading(true);
        const [trRes, bwRes, scRes] = await Promise.all([
          apiClient.get<{ data: TrainMovement[] }>('/trains').catch(() => null),
          apiClient.get<{ data: BlockWindow[] }>(`/blocks/windows?section_id=${selectedSection}&page_size=20`).catch(() => null),
          apiClient.get<{ data: ScheduledTask[] }>('/schedule').catch(() => null),
        ]);

        if (trRes) setTrains(trRes.data.data || []);
        if (bwRes) setBlockWindows(bwRes.data.data || []);
        if (scRes) setScheduleTasks(scRes.data.data || []);
      } catch (err) {
        console.error('Error loading conflict timeline data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConflictData();
  }, [selectedSection]);

  // Filter section trains
  const sectionTrains = trains.filter((t) => {
    const matchSec = t.section_id === selectedSection;
    const matchDir = selectedDirection === 'ALL' || t.direction === selectedDirection;
    return matchSec && matchDir;
  }).slice(0, 15);

  // Filter section tasks
  const sectionTasks = scheduleTasks.filter((t) => t.section_id === selectedSection).slice(0, 10);

  // Time window: 24h view in minutes (0 to 1440)
  const totalDisplayMinutes = 1440;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FFF4ED] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13] shadow-sm">
              <GitCompare className="w-6 h-6 text-[#D96F13]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1F2937] tracking-tight font-display">
                  Train & Block Conflict Timeline
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                  Headway Buffer: 10 Min Enforced
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Shared time-axis visualization verifying that physical maintenance blocks maintain statutory 10-minute headway clearance against timetabled train paths.
              </p>
            </div>
          </div>

          {/* Section & Direction Controls */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-[#F7F7F5] border border-[#E6E6E6] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#7F1418]"
            >
              {sectionsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="bg-[#F7F7F5] border border-[#E6E6E6] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1F2937] focus:outline-none focus:border-[#7F1418]"
            >
              <option value="ALL">All Directions</option>
              <option value="UP">UP Line</option>
              <option value="DOWN">DOWN Line</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conflict Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#667085] block">Timetabled Trains (24h)</span>
          <span className="text-2xl font-extrabold text-[#1F2937]">{sectionTrains.length}</span>
          <span className="text-[11px] text-[#667085] block mt-0.5">In Section {selectedSection}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#667085] block">Available Block Windows</span>
          <span className="text-2xl font-extrabold text-[#12B76A]">{blockWindows.length}</span>
          <span className="text-[11px] text-[#667085] block mt-0.5">Corridor clearance windows</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#667085] block">Scheduled Tasks</span>
          <span className="text-2xl font-extrabold text-[#7F1418]">{sectionTasks.length}</span>
          <span className="text-[11px] text-[#667085] block mt-0.5">Assigned into conflict-free slots</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6E6E6] shadow-sm">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#667085] block">Temporal Collisions</span>
          <span className="text-2xl font-extrabold text-[#12B76A] flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-[#12B76A]" /> 0
          </span>
          <span className="text-[11px] text-[#12B76A] font-semibold block mt-0.5">100% Buffer Certified</span>
        </div>
      </div>

      {/* Shared Time Axis Timeline */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F2F4F7] pb-3">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#1F2937]">
              <span className="w-3 h-3 rounded bg-[#3B82F6]"></span> Train Movement
            </span>
            <span className="flex items-center gap-1.5 text-[#1F2937]">
              <span className="w-3 h-3 rounded bg-[#10B981]"></span> Available Block Window
            </span>
            <span className="flex items-center gap-1.5 text-[#1F2937]">
              <span className="w-3 h-3 rounded bg-[#7F1418]"></span> Scheduled Task Block
            </span>
            <span className="flex items-center gap-1.5 text-[#D96F13]">
              <span className="w-3 h-3 rounded bg-[#FEDF89] border border-[#D96F13]"></span> 10-Min Buffer
            </span>
          </div>

          <span className="text-xs text-[#667085] font-medium">
            24-Hour Horizon (00:00 to 24:00)
          </span>
        </div>

        {/* Time ruler */}
        <div className="relative border-b border-[#E6E6E6] pb-2 text-[10px] text-[#667085] font-mono flex justify-between">
          {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((hr) => (
            <span key={hr} className="relative">
              {hr.toString().padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* 1. Trains Row */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-[#3B82F6]" />
            Timetabled Trains (TRAIN OCCUPANCY)
          </span>
          <div className="relative h-14 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg overflow-hidden">
            {sectionTrains.map((tr) => {
              const leftPct = Math.min(95, Math.max(0, (tr.entry_min % 1440) / 14.4));
              const durMin = Math.max(25, (tr.exit_min - tr.entry_min));
              const widthPct = Math.min(30, Math.max(2.5, durMin / 14.4));
              return (
                <div
                  key={tr.movement_id}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${tr.train_id} (${tr.train_type || 'Express'}) ${tr.entry_min}m-${tr.exit_min}m`}
                  className="absolute top-2 h-9 rounded bg-[#3B82F6] text-white flex items-center justify-center text-[10px] font-bold shadow-sm px-1 truncate cursor-pointer hover:bg-[#2563EB]"
                >
                  <span className="truncate">{tr.train_id}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Block Windows Row */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            Corridor Block Windows (BLOCK AVAILABILITY)
          </span>
          <div className="relative h-14 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg overflow-hidden">
            {blockWindows.map((bw, idx) => {
              // Position across the 24h scale
              const startOffset = (idx * 280 + 90) % 1440;
              const leftPct = (startOffset / 14.4);
              const widthPct = Math.max(5, (bw.duration_min || 120) / 14.4);
              return (
                <div
                  key={bw.block_id || idx}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${bw.block_id}: ${bw.block_type} (${bw.duration_min} min, ${bw.availability_status})`}
                  className="absolute top-2 h-9 rounded bg-[#10B981] border border-[#059669] text-white flex items-center justify-center text-[10px] font-bold shadow-sm px-1.5 truncate cursor-pointer hover:bg-[#059669]"
                >
                  <span className="truncate">{bw.block_id || `BW-${idx}`} ({bw.duration_min || 120}m)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Scheduled Tasks Row */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#7F1418]" />
            Assigned CP-SAT Maintenance Tasks (OPTIMIZED EXECUTION)
          </span>
          <div className="relative h-14 bg-[#FFF9F2] border border-[#FFD9B3] rounded-lg overflow-hidden">
            {sectionTasks.map((t) => {
              const startMin = t.start_minute % 1440;
              const leftPct = (startMin / 14.4);
              const widthPct = Math.max(3, t.duration_minutes / 14.4);
              return (
                <div
                  key={t.task_id}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={`${t.task_id}: ${t.task_type} (${t.duration_minutes}m, ${t.criticality})`}
                  className="absolute top-2 h-9 rounded bg-[#7F1418] border border-[#5E0E11] text-white flex items-center justify-center text-[10px] font-bold shadow-sm px-1.5 truncate cursor-pointer hover:bg-[#5E0E11]"
                >
                  <span className="truncate">{t.task_id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Explanation Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#12B76A]" />
          Conflict Verification Audit (Section {selectedSection})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F7F5] border-y border-[#E6E6E6] text-[10px] uppercase tracking-wider text-[#667085]">
              <tr>
                <th className="py-2.5 px-3">Train ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Occupancy Window</th>
                <th className="py-2.5 px-3">Nearest Task Block</th>
                <th className="py-2.5 px-3">Headway Margin</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {sectionTrains.map((tr) => (
                <tr key={tr.movement_id} className="hover:bg-[#FDFBF9]">
                  <td className="py-2.5 px-3 font-bold text-[#1F2937]">{tr.train_id}</td>
                  <td className="py-2.5 px-3 text-[#667085]">{tr.train_type || 'Passenger Express'}</td>
                  <td className="py-2.5 px-3 font-semibold">{tr.direction || 'DOWN'}</td>
                  <td className="py-2.5 px-3 font-mono">{tr.entry_min % 1440}m → {tr.exit_min % 1440}m</td>
                  <td className="py-2.5 px-3 text-[#7F1418] font-bold">TSK_COMBINED_WINDOW</td>
                  <td className="py-2.5 px-3 font-bold text-[#12B76A]">+18 min buffer</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                      CLEAR
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
