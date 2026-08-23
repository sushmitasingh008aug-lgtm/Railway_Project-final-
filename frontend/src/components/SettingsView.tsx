import React, { useState } from 'react';
import { Settings, Database, Cpu, ShieldAlert, Sliders, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [dbMode, setDbMode] = useState('SQLite / PostgreSQL Auto-Fallback');
  const [solverTime, setSolverTime] = useState('30 Seconds');
  const [horizon, setHorizon] = useState('7 Days (Weekly)');
  const [irPolicy, setIrPolicy] = useState(true);

  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="flex items-center justify-between border-b border-[#1a2336] pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>System Settings & Solver Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engine parameters, CP-SAT solver time limits, Indian Railways domain policies, and database connection state
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Config Saved</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CP-SAT Solver Config */}
        <div className="bg-[#101726] border border-[#1d273a] rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>CP-SAT Optimizer Settings</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Max Solver Wall-Time Limit</label>
            <select
              value={solverTime}
              onChange={(e) => setSolverTime(e.target.value)}
              className="w-full bg-[#141d30] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option>15 Seconds (Fast Preview)</option>
              <option>30 Seconds (Optimal Quality)</option>
              <option>60 Seconds (Deep Search)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Planning Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full bg-[#141d30] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option>7 Days (Weekly Plan)</option>
              <option>30 Days (Monthly Plan)</option>
            </select>
          </div>
        </div>

        {/* Domain Policy Config */}
        <div className="bg-[#101726] border border-[#1d273a] rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Indian Railways Operating Constraints</span>
          </h3>

          <div className="p-4 rounded-xl bg-[#141d30] border border-[#1e293b] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-100">12:00-18:00 Peak Window Restriction</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prohibit non-critical maintenance blocks during 12:00 PM – 6:00 PM peak passenger window.
              </p>
            </div>
            <input
              type="checkbox"
              checked={irPolicy}
              onChange={(e) => setIrPolicy(e.target.checked)}
              className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Database Connection Mode</label>
            <select
              value={dbMode}
              onChange={(e) => setDbMode(e.target.value)}
              className="w-full bg-[#141d30] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option>SQLite / PostgreSQL Auto-Fallback</option>
              <option>PostgreSQL Production Instance</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
