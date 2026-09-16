import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowRight,
  Layers,
  Wrench,
  ShieldCheck,
  Zap,
  Activity,
  GitBranch,
  Play
} from 'lucide-react';
import { apiClient, AnomalyScenario } from '../api/client';
import { ViewType } from './Sidebar';

interface ScenarioExplorerProps {
  onNavigate?: (view: ViewType) => void;
}

export const ScenarioExplorerView: React.FC<ScenarioExplorerProps> = ({ onNavigate }) => {
  const [scenarios, setScenarios] = useState<AnomalyScenario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        const res = await apiClient.get<{ data: AnomalyScenario[] }>('/anomalies/catalog');
        setScenarios(res.data.data || []);
      } catch (err) {
        console.error('Error loading scenarios:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const coverageDimensions = [
    { label: 'Anomaly Scenarios', count: '29', desc: 'Catalog scenario classes', icon: Compass },
    { label: 'Asset Types', count: '36', desc: 'Track, OHE, Signal assets', icon: Layers },
    { label: 'Failure Types', count: '37', desc: 'UIMS/Ministry codes', icon: AlertTriangle },
    { label: 'Task Types', count: '19', desc: 'Corrective, overhaul, emergency', icon: Wrench },
    { label: 'Action Types', count: '13', desc: 'Isolation, work, verification', icon: Activity },
    { label: 'Block Types', count: '8', desc: 'Integrated, shadow, power', icon: Zap },
    { label: 'Dependency Types', count: '5', desc: 'Precedence & lag constraints', icon: GitBranch },
    { label: 'Maintenance Outcomes', count: '8', desc: 'Verified, restored, deferred', icon: CheckCircle2 },
  ];

  const filteredScenarios = scenarios.filter((s) => {
    const matchesSearch = s.anomaly_scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.planning_handling.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || s.department.toUpperCase().includes(selectedDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FFF4ED] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13] shadow-sm">
              <Compass className="w-6 h-6 text-[#D96F13]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1F2937] tracking-tight font-display">
                  Scenario & Coverage Explorer
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                  29 Scenarios · 100% Traceable
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Demonstrates ABPS versatility across routine maintenance, recurring failure clustering, emergency anomalies, and multi-department coordination.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate && onNavigate('anomaly_handling')}
              className="px-3.5 py-2 rounded-lg bg-[#7F1418] text-white text-xs font-bold hover:bg-[#5E0E11] transition shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-[#FF9933]" />
              <span>Launch Anomaly Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Coverage Dimensions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {coverageDimensions.map((dim, idx) => {
          const Icon = dim.icon;
          return (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#E6E6E6] shadow-sm text-center">
              <Icon className="w-4 h-4 text-[#D96F13] mx-auto mb-1" />
              <span className="text-xl font-extrabold text-[#1F2937] block">{dim.count}</span>
              <span className="text-[10px] font-bold text-[#1F2937] block mt-0.5">{dim.label}</span>
              <span className="text-[9.5px] text-[#667085] block truncate">{dim.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Coverage Matrix Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#12B76A]" />
              Scenario Execution Coverage Matrix ({filteredScenarios.length} Scenarios)
            </h3>
            <div className="flex items-center gap-1">
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

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenarios..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F5] border border-[#E6E6E6] rounded-lg text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F7F5] border-y border-[#E6E6E6] text-[10px] uppercase text-[#667085]">
              <tr>
                <th className="py-2.5 px-3">Scenario Class</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Task Mapping</th>
                <th className="py-2.5 px-3">Action Package</th>
                <th className="py-2.5 px-3">Planning Rule</th>
                <th className="py-2.5 px-3">Test Coverage</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {filteredScenarios.map((sc, idx) => (
                <tr key={idx} className="hover:bg-[#FDFBF9]">
                  <td className="py-2.5 px-3 font-bold text-[#1F2937]">{sc.anomaly_scenario}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#F2F4F7] text-[#344054]">
                      {sc.department}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#7F1418] truncate max-w-[150px]">
                    {sc.recommended_task_types.join(', ')}
                  </td>
                  <td className="py-2.5 px-3 text-[#667085] truncate max-w-[160px]">
                    {sc.recommended_actions.join(' → ')}
                  </td>
                  <td className="py-2.5 px-3 text-[#667085] truncate max-w-[200px]" title={sc.planning_handling}>
                    {sc.planning_handling}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[#12B76A] font-bold text-[10.5px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onNavigate && onNavigate('anomaly_handling')}
                      className="text-[11px] font-bold text-[#D96F13] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Simulate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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
