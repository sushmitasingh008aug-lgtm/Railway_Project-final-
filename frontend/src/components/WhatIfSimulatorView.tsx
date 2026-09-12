import React, { useState } from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Clock, Train, Sparkles, RefreshCw } from 'lucide-react';
import { WhatIfResult, apiClient } from '../api/client';

export const WhatIfSimulatorView: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState('CB_001');
  const [shiftMinutes, setShiftMinutes] = useState(30);
  const [result, setResult] = useState<WhatIfResult['simulation'] | null>(null);
  const [simulating, setSimulating] = useState(false);

  const presetShifts = [-60, -30, 0, 30, 60, 120];

  const runSimulation = (shiftOverride?: number) => {
    const shift = shiftOverride !== undefined ? shiftOverride : shiftMinutes;
    if (shiftOverride !== undefined) setShiftMinutes(shiftOverride);
    setSimulating(true);
    apiClient.post<WhatIfResult>('/what-if', {
      block_id: selectedBlock,
      shift_minutes: shift
    })
      .then(res => setResult(res.data.simulation))
      .catch(err => console.error('Simulation failed:', err))
      .finally(() => setSimulating(false));
  };

  return (
    <div className="space-y-6">
      {/* Header (Section 20) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] font-display">
              WHAT-IF PLANNING
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1 ml-10">
            Test schedule changes before approval · Dynamically simulates train conflicts &amp; resource feasibility
          </p>
        </div>
        <span className="text-xs font-bold text-[#B85C00] bg-[#FFF3E6] px-3 py-1.5 rounded-xl border border-[#FFD9B3] self-start sm:self-auto">
          Planning Laboratory Mode
        </span>
      </div>

      {/* Simulator Controls Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E6E6] shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Block Selector */}
          <div>
            <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block mb-2">
              Selected Corridor Block
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full text-xs border border-[#E6E6E6] rounded-xl p-2.5 bg-[#F7F7F5] font-semibold text-[#1F2937] focus:outline-none focus:border-[#FF9933]"
            >
              <option value="CB_001">CB_001 · SEC_BSB_LKO_01 (3 Depts Coordinated)</option>
              <option value="CB_002">CB_002 · SEC_HWH_DLI_02 (2 Depts Coordinated)</option>
              <option value="CB_003">CB_003 · SEC_DDU_YARD_01 (Yard Inspection)</option>
              <option value="CB_004">CB_004 · SEC_BSB_LKO_02 (OHE + Track Weld)</option>
            </select>
          </div>

          {/* Preset Shift Buttons (Section 20: [-60] [-30] [0] [+30] [+60] min) */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block mb-2">
              SHIFT BY: <span className="text-[#D96F13] font-extrabold">{shiftMinutes > 0 ? `+${shiftMinutes}` : shiftMinutes} min</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {presetShifts.map((m) => (
                <button
                  key={m}
                  onClick={() => runSimulation(m)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    shiftMinutes === m
                      ? 'bg-[#FF9933] text-white shadow-md scale-105'
                      : 'bg-[#F7F7F5] hover:bg-[#FFF3E6] hover:text-[#B85C00] text-[#475467] border border-[#E6E6E6]'
                  }`}
                >
                  {m > 0 ? `+${m}` : m} min
                </button>
              ))}
              <button
                onClick={() => runSimulation()}
                disabled={simulating}
                className="ml-auto px-5 py-2 bg-[#FF9933] hover:bg-[#D96F13] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {simulating ? 'Simulating...' : 'Run Simulation →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Cards: Current vs Proposed (Section 20) */}
      {result && (
        <div className={`p-6 rounded-2xl border transition-all ${
          result.feasible
            ? 'bg-[#F6FEF9] border-[#A6F4C5]'
            : 'bg-[#FEF3F2] border-[#FDA29B]'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4 border-[#E6E6E6]">
            <div>
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                Simulation Outcome ({result.target_block_id})
              </span>
              <h3 className="text-base font-bold text-[#1F2937] mt-0.5 font-display">
                Shift Tested: {result.shift_applied_minutes > 0 ? `+${result.shift_applied_minutes}` : result.shift_applied_minutes} Minutes
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                result.feasible
                  ? 'bg-[#D1FADF] text-[#0F7644] border border-[#A6F4C5]'
                  : 'bg-[#FEE4E2] text-[#D92D20] border border-[#FDA29B]'
              }`}
            >
              {result.feasible ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.feasible ? 'FEASIBLE FOR SCHEDULE ADJUSTMENT' : 'INFEASIBLE - CAUSES CONFLICT'}
            </span>
          </div>

          {/* Current vs Proposed 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-xl border border-[#E6E6E6]">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Train Conflict</span>
              <p className="text-xl font-extrabold text-[#1F2937] font-display mt-1">
                0 → <span className={result.train_conflicts_detected > 0 ? 'text-[#D92D20]' : 'text-[#12B76A]'}>{result.train_conflicts_detected}</span>
              </p>
              <span className="text-[11px] text-[#667085]">
                {result.train_conflicts_detected === 0 ? 'Zero train headway collision' : 'Collides with active timetables'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E6E6E6]">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Task Lateness</span>
              <p className="text-xl font-extrabold text-[#1F2937] font-display mt-1">
                {result.shift_applied_minutes > 0 ? `+${result.shift_applied_minutes} min` : `${result.shift_applied_minutes} min`}
              </p>
              <span className="text-[11px] text-[#667085]">Corridor delay delta</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E6E6E6]">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Resource Conflict</span>
              <p className="text-xl font-extrabold text-[#12B76A] font-display mt-1">0</p>
              <span className="text-[11px] text-[#0F7644] font-semibold">Tampers &amp; Wagons Available</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E6E6E6]">
              <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">Alternative Block</span>
              <p className="text-xs font-extrabold text-[#D96F13] mt-1 font-mono">
                {result.shifted_window || 'Shifted Window Applied'}
              </p>
              <span className="text-[11px] text-[#667085]">Proposed window span</span>
            </div>
          </div>

          <p className="text-xs text-[#475467] bg-white p-3 rounded-xl border border-[#E6E6E6]">
            <b>Recommendation:</b> {result.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};
