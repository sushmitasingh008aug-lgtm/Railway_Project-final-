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
      'Fishplate & Fastener Replacement',
    ],
    Traction: [
      'OHE Dropper Broken Replacement',
      'Cantilever Insulator Flashover Repair',
      'Contact Wire Tension & Sag Correction',
      'Neutral Section Inspection',
      'Substation Switchgear Maintenance',
    ],
    'S&T': [
      'Track Circuit Short-Circuit Rectification',
      'Axle Counter Counting Sensor Error',
      'Signal Aspect Lamp / LED Failure',
      'Point Machine Detection Circuit Fault',
      'Interlocking Relay Bank Servicing',
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
    setCriticality(critValues[parseInt(e.target.value, 10)]);
  };

  const inputCls =
    'w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors';

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Maintenance Block Request
        </h2>
        <p className="text-sm text-gray-400 mb-8">
          Fill in the parameters below to request a new track maintenance block window.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Department
                </label>
                <select value={department} onChange={(e) => handleDeptChange(e.target.value)} className={inputCls}>
                  <option value="Engineering">Engineering</option>
                  <option value="Traction">Traction</option>
                  <option value="S&T">S&amp;T</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Target Section
                </label>
                <select value={targetSection} onChange={(e) => setTargetSection(e.target.value)} className={inputCls}>
                  {sections.map((sec) => (
                    <option key={sec.section_id} value={sec.section_id}>
                      {sec.section_id} ({sec.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Maintenance Task Type
                </label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={inputCls}>
                  {(taskOptions[department] || []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Criticality Level
                  </label>
                  <span className={`text-xs font-bold ${
                    criticality === 'Critical' ? 'text-red-600'
                    : criticality === 'High' ? 'text-orange-500'
                    : criticality === 'Medium' ? 'text-amber-500'
                    : 'text-green-600'
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Required Duration (Minutes)
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <input
                    type="number"
                    min="15"
                    max="720"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full bg-transparent px-4 py-3 text-gray-800 text-sm focus:outline-none"
                  />
                  <div className="flex items-center pr-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.max(15, prev - 15))}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.min(720, prev + 15))}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Target Completion Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Calculating Priority & Submitting...' : 'Calculate Priority & Request Block Window'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Block Request Submitted Successfully!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 font-medium">Computed Priority Score</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {result.computed_priority_score.toFixed(1)} / 100.0
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 font-medium">Criticality Contribution</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {result.criticality_contribution.toFixed(1)} pts (60%)
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 font-medium">Urgency Contribution</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {result.urgency_contribution.toFixed(1)} pts (40%)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 shrink-0" />
              <span>
                {result.message} Background plan regeneration triggered —
                open <strong>Block Planning</strong> in ~1 minute to see this block scheduled.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
