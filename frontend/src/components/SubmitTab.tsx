import React, { useState } from 'react';
import { Section, SubmitBlockRequest, SubmitBlockResponse, apiClient } from '../api/client';
import { Minus, Plus, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface SubmitTabProps {
  sections: Section[];
  onSubmissionSuccess?: () => void;
}

export const SubmitTab: React.FC<SubmitTabProps> = ({ sections, onSubmissionSuccess }) => {
  const [department, setDepartment] = useState('Engineering');
  const [targetSection, setTargetSection] = useState(sections[0]?.section_id || 'SEC_BSB_LKO_01');
  const [taskType, setTaskType] = useState('Broken Rail Weld Repair');
  const [criticality, setCriticality] = useState('High');
  const [duration, setDuration] = useState(90);
  const [dueDate, setDueDate] = useState('2026-08-25');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitBlockResponse | null>(null);

  const taskOptions: Record<string, string[]> = {
    Engineering: [
      'Broken Rail Weld Repair',
      'Track Gauge Spread Correction',
      'Ballast Deep Screening & Tamping',
      'Point Machine Mechanical Overhaul',
      'Fishplate & Fastener Replacement'
    ],
    Traction: [
      'OHE Dropper Broken Replacement',
      'Cantilever Insulator Flashover Repair',
      'Contact Wire Tension & Sag Correction',
      'Neutral Section Inspection',
      'Substation Switchgear Maintenance'
    ],
    'S&T': [
      'Track Circuit Short-Circuit Rectification',
      'Axle Counter Counting Sensor Error',
      'Signal Aspect Lamp / LED Failure',
      'Point Machine Detection Circuit Fault',
      'Interlocking Relay Bank Servicing'
    ],
  };

  const handleDeptChange = (dept: string) => {
    setDepartment(dept);
    setTaskType(taskOptions[dept]?.[0] || 'Routine Maintenance');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const payload: SubmitBlockRequest = {
      department,
      target_section: targetSection,
      task_type: taskType,
      criticality,
      duration_minutes: duration,
      due_date: dueDate,
    };

    try {
      const res = await apiClient.post<SubmitBlockResponse>('/tasks/submit', payload);
      setResult(res.data);
      // Fire-and-forget: kick off background plan regeneration so the new
      // request flows into the live schedule without a manual re-run.
      apiClient.post('/schedule/generate').catch(() => {});
      if (onSubmissionSuccess) onSubmissionSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit block request. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const critValues = ['Low', 'Medium', 'High', 'Critical'];
  const getCritIndex = () => critValues.indexOf(criticality);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value, 10);
    setCriticality(critValues[idx]);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-1">
          <span>📝</span> Emergency / Routine Maintenance Block Submission
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Fill in the parameters below to request a new track maintenance block window:
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full bg-[#182234] border border-[#334155] rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Traction">Traction</option>
                  <option value="S&T">S&T</option>
                </select>
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Section
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full bg-[#182234] border border-[#334155] rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  {sections.map((sec) => (
                    <option key={sec.section_id} value={sec.section_id}>
                      {sec.section_id} ({sec.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Maintenance Task Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Maintenance Task Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full bg-[#182234] border border-[#334155] rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  {(taskOptions[department] || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Criticality Level Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Criticality Level
                  </label>
                  <span className={`text-xs font-bold ${
                    criticality === 'Critical' ? 'text-red-500' :
                    criticality === 'High' ? 'text-orange-500' :
                    criticality === 'Medium' ? 'text-yellow-500' : 'text-emerald-400'
                  }`}>
                    {criticality}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={getCritIndex()}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-[#1f2937] rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Required Duration Spinner */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Required Duration (Minutes)
                </label>
                <div className="flex items-center bg-[#182234] border border-[#334155] rounded-lg overflow-hidden">
                  <input
                    type="number"
                    min="15"
                    max="720"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full bg-transparent px-4 py-3 text-slate-200 text-sm focus:outline-none"
                  />
                  <div className="flex items-center pr-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.max(15, prev - 15))}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#334155] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.min(720, prev + 15))}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#334155] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Completion Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Completion Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#182234] border border-[#334155] rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <span>🖹</span>
              {submitting ? 'Calculating Priority & Submitting...' : 'Calculate Priority & Request Block Window'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Card (Matching Screenshot 4) */}
        {result && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-300">
            {/* Green Banner */}
            <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 text-sm font-semibold flex items-center gap-2 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Block Request Submitted Successfully!</span>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#0b1324] border border-[#1e293b] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium">Computed Priority Score</p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {result.computed_priority_score.toFixed(1)} / 100.0
                </p>
              </div>
              <div className="bg-[#0b1324] border border-[#1e293b] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium">Criticality Contribution</p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {result.criticality_contribution.toFixed(1)} pts (60%)
                </p>
              </div>
              <div className="bg-[#0b1324] border border-[#1e293b] rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium">Urgency Contribution</p>
                <p className="text-3xl font-extrabold text-white mt-1">
                  {result.urgency_contribution.toFixed(1)} pts (40%)
                </p>
              </div>
            </div>

            {/* Blue Info Banner */}
            <div className="p-4 rounded-lg bg-[#0e1d38] border border-[#1e3a8a]/60 text-blue-300 text-sm flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span>
                {result.message} Background plan regeneration has been triggered automatically —
                open <strong className="text-white">Master Block Schedule &amp; Gantt</strong> in ~1 minute to see this block placed.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
