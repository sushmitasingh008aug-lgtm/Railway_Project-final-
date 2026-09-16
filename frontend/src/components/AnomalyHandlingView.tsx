import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Flame,
  CloudRain,
  Zap,
  Radio,
  Clock,
  ArrowRight,
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Wrench,
  Check
} from 'lucide-react';
import { apiClient, AnomalyScenario } from '../api/client';

export const AnomalyHandlingView: React.FC = () => {
  const [scenarios, setScenarios] = useState<AnomalyScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<AnomalyScenario | null>(null);
  const [scenarioDetail, setScenarioDetail] = useState<any>(null);
  const [entryMode, setEntryMode] = useState<string>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [taskCreatedMessage, setTaskCreatedMessage] = useState<string | null>(null);

  // Fetch catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await apiClient.get<{ data: AnomalyScenario[] }>('/anomalies/catalog');
        const data = res.data.data || [];
        setScenarios(data);
        if (data.length > 0) {
          setSelectedScenario(data[4] || data[0]); // default to flooding or first
        }
      } catch (err) {
        console.error('Error loading anomaly catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Fetch detail when selected scenario changes
  useEffect(() => {
    if (!selectedScenario) return;
    async function loadDetail() {
      try {
        const res = await apiClient.get<any>(`/anomalies/${encodeURIComponent(selectedScenario.anomaly_scenario)}`);
        setScenarioDetail(res.data.data);
        setSimulationResult(null);
        setTaskCreatedMessage(null);
      } catch (err) {
        console.error('Error loading scenario detail:', err);
      }
    }
    loadDetail();
  }, [selectedScenario]);

  const handleSimulateImpact = async () => {
    if (!selectedScenario) return;
    setSimulating(true);
    try {
      const res = await apiClient.post<any>('/what-if/scenario', {
        scenario_name: selectedScenario.anomaly_scenario,
        section_id: scenarioDetail?.sample_asset?.section_id || 'SEC_BSB_LKO_01',
        disruption_minutes: 90
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleGenerateEmergencyTask = async () => {
    if (!selectedScenario) return;
    try {
      const targetSec = scenarioDetail?.sample_asset?.section_id || 'SEC_BSB_LKO_01';
      const res = await apiClient.post<any>('/tasks/submit', {
        department: selectedScenario.department.includes('/') ? selectedScenario.department.split('/')[0] : selectedScenario.department,
        target_section: targetSec,
        task_type: selectedScenario.recommended_task_types[0] || 'Emergency Repair',
        criticality: 'Critical',
        duration_minutes: 90,
        due_date: new Date().toISOString().split('T')[0]
      });
      setTaskCreatedMessage(`Emergency Task ${res.data.task_id} generated and inserted into prioritized backlog!`);
    } catch (err) {
      setTaskCreatedMessage('Failed to create emergency task.');
    }
  };

  const filteredScenarios = scenarios.filter((s) => {
    const matchesSearch = s.anomaly_scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.planning_handling.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || s.department.toUpperCase().includes(selectedDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FFF4ED] border border-[#FFD9B3] flex items-center justify-center text-[#D92D20] shadow-sm">
              <AlertTriangle className="w-6 h-6 text-[#D92D20]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1F2937] tracking-tight font-display">
                  Anomaly Handling & Rapid Response
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4ED] text-[#D92D20] border border-[#FECDCA]">
                  29 Scenario Classes
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Trace anomalies from detection → affected asset → historical evidence → recommended execution actions → restricted block re-plan.
              </p>
            </div>
          </div>

          {/* Entry Mode Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 rounded-lg border border-[#E6E6E6] text-xs font-semibold">
            {[
              { id: 'detected', label: 'Detected Anomaly' },
              { id: 'manual', label: 'Scenario Catalog' },
              { id: 'failure', label: 'Failure Event' },
              { id: 'defect', label: 'Defect' },
              { id: 'emergency', label: 'Emergency Task' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setEntryMode(m.id)}
                className={`px-3 py-1.5 rounded-md transition ${
                  entryMode === m.id
                    ? 'bg-white text-[#7F1418] shadow-sm font-bold border border-[#E6E6E6]'
                    : 'text-[#667085] hover:text-[#1F2937]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Catalog List on Left (4 cols), Scenario Card & Action Drawer on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 29 Anomaly Catalog */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Anomaly Scenarios ({filteredScenarios.length})
              </span>
              <div className="flex items-center gap-1.5">
                {['ALL', 'ENG', 'TRD', 'S&T'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDept(d === 'ENG' ? 'ENGINEERING' : d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (selectedDept === d || (d === 'ENG' && selectedDept === 'ENGINEERING'))
                        ? 'bg-[#7F1418] text-white'
                        : 'bg-[#F7F7F5] text-[#667085] hover:bg-[#E6E6E6]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 29 scenarios (e.g. Flooding, Fog, Wire, Signal)..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F7F5] border border-[#E6E6E6] rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#7F1418]"
              />
            </div>

            {/* Scenario List */}
            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredScenarios.map((sc) => {
                const isSelected = selectedScenario?.anomaly_scenario === sc.anomaly_scenario;
                return (
                  <div
                    key={sc.anomaly_scenario}
                    onClick={() => setSelectedScenario(sc)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FFF9F2] border-[#D96F13] shadow-sm ring-1 ring-[#D96F13]'
                        : 'bg-white border-[#E6E6E6] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#1F2937]">
                          {sc.anomaly_scenario}
                        </span>
                        <p className="text-[11px] text-[#667085] line-clamp-1 mt-0.5">
                          {sc.planning_handling}
                        </p>
                      </div>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#F2F4F7] text-[#344054] shrink-0 border border-[#EAECF0]">
                        {sc.department}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scenario Trace Card, Historical Evidence, Actions & Simulation */}
        <div className="lg:col-span-7 space-y-5">
          {selectedScenario ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm space-y-5">
              {/* Scenario Title Header */}
              <div className="flex items-start justify-between border-b border-[#F2F4F7] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF4ED] text-[#D92D20] border border-[#FECDCA]">
                      ACTIVE ANOMALY TRACE
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2F4F7] text-[#344054]">
                      {selectedScenario.department}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-[#1F2937] mt-1">
                    {selectedScenario.anomaly_scenario}
                  </h2>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateImpact}
                    disabled={simulating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7F1418] text-white text-xs font-bold hover:bg-[#5E0E11] transition shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-[#FF9933]" />
                    <span>{simulating ? 'Simulating...' : 'Simulate Impact'}</span>
                  </button>
                  <button
                    onClick={handleGenerateEmergencyTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF3E6] text-[#D96F13] border border-[#FFD9B3] text-xs font-bold hover:bg-[#FFE8CC] transition"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Generate Task</span>
                  </button>
                </div>
              </div>

              {taskCreatedMessage && (
                <div className="p-3 bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] text-xs rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                  <span>{taskCreatedMessage}</span>
                </div>
              )}

              {/* 1. Affected Asset & Spatial Context */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D96F13]" />
                  Affected Asset & Physical Location
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFAF9] p-3.5 rounded-lg border border-[#E6E6E6] text-xs">
                  <div>
                    <span className="text-[10px] text-[#667085] block">Asset ID</span>
                    <span className="font-bold text-[#1F2937]">{scenarioDetail?.sample_asset?.asset_id || 'DRAINAGE-1024'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block">Asset Subtype</span>
                    <span className="font-bold text-[#1F2937]">{scenarioDetail?.sample_asset?.asset_subtype || 'Ballast Drainage Pit'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block">Section</span>
                    <span className="font-bold text-[#1F2937]">{scenarioDetail?.sample_asset?.section_id || 'SEC_BSB_LKO_01'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#667085] block">Condition / Health</span>
                    <span className="font-bold text-[#D92D20]">
                      {scenarioDetail?.sample_asset?.condition_score || 32} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Historical Evidence */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D96F13]" />
                  Historical Failure & Defect Evidence
                </h3>
                {scenarioDetail?.recent_failures && scenarioDetail.recent_failures.length > 0 ? (
                  <div className="space-y-1.5">
                    {scenarioDetail.recent_failures.map((f: any) => (
                      <div key={f.af_id} className="flex items-center justify-between bg-white border border-[#E6E6E6] p-2.5 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-[#1F2937]">{f.failure_type}</span>
                          <span className="text-[11px] text-[#667085] ml-2">Cause: {f.cause}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[#D92D20] font-bold">{f.trains_delayed} trains delayed</span>
                          <span className="text-[10px] text-[#667085] block">({f.total_detention_min} min detention)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#FAFAF9] p-3 rounded-lg border border-[#E6E6E6] text-xs text-[#667085]">
                    • 3 historical defects detected in previous 90 days<br />
                    • 2 heavy-weather rain impact occurrences recorded<br />
                    • 1 recurring failure in this sectional block
                  </div>
                )}
              </div>

              {/* 3. Recommended Tasks & Execution Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FAFAF9] p-3.5 rounded-lg border border-[#E6E6E6] space-y-2">
                  <h4 className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#D96F13]" />
                    Recommended Tasks
                  </h4>
                  <ul className="space-y-1 text-xs text-[#344054]">
                    {selectedScenario.recommended_task_types.map((t, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D96F13]"></span>
                        <span className="font-semibold">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FAFAF9] p-3.5 rounded-lg border border-[#E6E6E6] space-y-2">
                  <h4 className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A]" />
                    Required Action Package
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedScenario.recommended_actions.map((act, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border border-[#E6E6E6] rounded text-[11px] font-semibold text-[#1F2937]">
                        {idx + 1}. {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Planning Restrictions & CP-SAT Handling */}
              <div className="bg-[#FFF9F2] border border-[#FFD9B3] rounded-lg p-3.5 space-y-1.5 text-xs text-[#8C4A08]">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#D96F13]" />
                  Operational Planning Handling Rule
                </span>
                <p className="leading-relaxed">
                  {selectedScenario.planning_handling}
                </p>
              </div>

              {/* 5. Simulation Output Drawer (if executed) */}
              {simulationResult && (
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#166534] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      Simulation Result: {simulationResult.recommendation}
                    </span>
                    <span className="text-[11px] text-[#166534]">
                      Section {simulationResult.section_id} · {simulationResult.disruption_minutes}m disruption
                    </span>
                  </div>
                  <p className="text-[11px] text-[#15803D]">
                    {simulationResult.available_alternative_windows?.length > 0
                      ? `Found ${simulationResult.available_alternative_windows.length} available alternative block windows in section ${simulationResult.section_id} with zero passenger train conflicts.`
                      : 'High traffic density in this section. Human controller review required for restricted block authority.'}
                  </p>
                  {simulationResult.available_alternative_windows?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {simulationResult.available_alternative_windows.map((w: any) => (
                        <div key={w.block_id} className="bg-white p-2 rounded border border-[#BBF7D0] text-[11px]">
                          <span className="font-bold text-[#1F2937]">{w.block_id}</span>
                          <span className="text-[#667085] block">{w.start_time} ({w.duration_min} min)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#667085] bg-white rounded-xl border border-[#E6E6E6]">
              Select an anomaly scenario to view operational trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
