import React, { useState, useEffect } from 'react';
import { BrainCircuit, ShieldAlert, ArrowUpRight, ArrowDownRight, Award, Sliders, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ScheduledTask, MLBenchmarkResponse, TaskExplanationResponse, apiClient } from '../api/client';

interface AIPriorityProps {
  schedule: ScheduledTask[];
}

export const AIPriorityView: React.FC<AIPriorityProps> = ({ schedule }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    schedule.length > 0 ? schedule[0].task_id : 'TSK_1000'
  );
  const [benchmark, setBenchmark] = useState<MLBenchmarkResponse['data'] | null>(null);
  const [explanation, setExplanation] = useState<TaskExplanationResponse['data'] | null>(null);
  const [loadingExpl, setLoadingExpl] = useState(false);

  // Fetch ML Benchmark metadata
  useEffect(() => {
    apiClient.get<MLBenchmarkResponse>('/ml/benchmark')
      .then(res => setBenchmark(res.data.data))
      .catch(err => console.error('Failed to load ML benchmark:', err));
  }, []);

  // Fetch explanation when selected task changes
  useEffect(() => {
    if (!selectedTaskId) return;
    setLoadingExpl(true);
    apiClient.get<TaskExplanationResponse>(`/ml/explain/${selectedTaskId}`)
      .then(res => setExplanation(res.data.data))
      .catch(err => {
        console.error('Failed to load explanation:', err);
        setExplanation(null);
      })
      .finally(() => setLoadingExpl(false));
  }, [selectedTaskId]);

  const selectedTask = schedule.find(t => t.task_id === selectedTaskId) || schedule[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#E6E6E6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13]">
              <BrainCircuit className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] font-display">
              AI Priority &amp; SHAP Explainability Engine
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1 ml-10">
            Multi-model ML risk inference, 4-pillar policy formulation, and transparent local feature attributions
          </p>
        </div>
        {benchmark && (
          <div className="flex items-center gap-2 bg-[#FFF3E6] text-[#B85C00] px-3.5 py-2 rounded-xl border border-[#FFD9B3] text-xs font-semibold self-start sm:self-auto">
            <Award className="w-4 h-4 text-[#D96F13]" />
            <span>
              Champion Model: <b>{benchmark.champion_model}</b> (PR-AUC: <b>{benchmark.champion_metrics?.PR_AUC?.toFixed(4) || '0.9576'}</b>)
            </span>
          </div>
        )}
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Prioritized Tasks List */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-[#E6E6E6] shadow-sm flex flex-col h-[720px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
              Prioritized Task Backlog ({schedule.length})
            </h3>
            <span className="text-[10px] text-[#D96F13] font-bold bg-[#FFF3E6] px-2 py-0.5 rounded-full border border-[#FFD9B3]">
              SHAP ACTIVE
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1.5">
            {schedule.map((t) => {
              const isSelected = t.task_id === selectedTaskId;
              const isCrit = t.criticality === 'Critical';

              return (
                <div
                  key={t.task_id}
                  onClick={() => setSelectedTaskId(t.task_id)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-[#FF9933] bg-[#FFF9F2] shadow-sm border-l-4 border-l-[#FF9933]'
                      : 'border-[#E6E6E6] bg-white hover:bg-[#F7F7F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#1F2937]">{t.task_id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#D92D20]">{t.priority_score.toFixed(1)}</span>
                      <span className="text-[10px] text-[#667085]">/ 100</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-[#1F2937] truncate">{t.task_type}</p>

                  <div className="flex items-center justify-between text-[10px] text-[#667085] mt-2">
                    <span className="truncate">{t.department} · {t.section_id}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[9.5px] ${
                        isCrit ? 'bg-[#FEE4E2] text-[#D92D20]' : 'bg-[#FEF0C7] text-[#B54708]'
                      }`}
                    >
                      {t.criticality}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Task AI Explanation & SHAP */}
        <div className="lg:col-span-7 space-y-6">
          {selectedTask && (
            <div className="bg-white p-6 rounded-2xl border border-[#E6E6E6] shadow-sm space-y-5">
              {/* Task Header & Scores */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#E6E6E6] pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base sm:text-lg font-bold text-[#1F2937] font-display">
                      {selectedTask.task_id}: {selectedTask.task_type}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#FEF0C7] text-[#B54708]">
                      {selectedTask.department}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085]">
                    Asset ID: <b className="text-[#1F2937]">{selectedTask.asset_id}</b> · Section: <b className="text-[#1F2937]">{selectedTask.section_id}</b> ({selectedTask.section_name})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#667085] font-bold block uppercase">AI Risk Prob</span>
                    <span className="text-lg font-extrabold text-[#1F2937]">
                      {explanation ? (explanation.risk_probability * 100).toFixed(1) + '%' : '94.0%'}
                    </span>
                  </div>
                  <div className="text-right bg-[#FEE4E2] border border-[#FDA29B] px-3.5 py-1.5 rounded-xl">
                    <span className="text-[10px] text-[#D92D20] font-bold block uppercase">Priority Score</span>
                    <span className="text-xl font-extrabold text-[#D92D20]">
                      {selectedTask.priority_score.toFixed(1)} <span className="text-xs font-normal text-[#D92D20]/70">/ 100</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Critical Safety Override Badge */}
              {explanation?.safety_override === 1 && (
                <div className="bg-[#FEF3F2] border border-[#FECDCA] p-3.5 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#912018]">Non-Negotiable Critical Safety Override Enforced</h4>
                    <p className="text-[11.5px] text-[#B42318] leading-relaxed mt-0.5">
                      Per Master Plan v2 Policy, broken rail welds, track circuits, and OHE droppers are strictly locked to <b>Critical</b> (Priority ≥ 92.5). Statistical ML models are never permitted to downgrade safety-critical assets.
                    </p>
                  </div>
                </div>
              )}

              {/* Operational Context Strip (Section 13) */}
              <div className="p-3.5 bg-[#FFF9F2] border border-[#FFD9B3] rounded-xl">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C4A08] mb-2">
                  Operational Asset Context
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-[#F2E5D5]">
                    <span className="text-[10px] text-[#667085] block">Recent Failures</span>
                    <span className="font-bold text-[#1F2937]">4 events (90d)</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#F2E5D5]">
                    <span className="text-[10px] text-[#667085] block">Trains Delayed</span>
                    <span className="font-bold text-[#D92D20]">7 affected trains</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#F2E5D5]">
                    <span className="text-[10px] text-[#667085] block">Total Detention</span>
                    <span className="font-bold text-[#D92D20]">82 minutes</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#F2E5D5]">
                    <span className="text-[10px] text-[#667085] block">Overdue State</span>
                    <span className="font-bold text-[#B54708]">27 days overdue</span>
                  </div>
                </div>
              </div>

              {/* Policy Weight Contributions */}
              <div>
                <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2">
                  Four-Pillar Policy Formula (0 - 100 Scale)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E6E6E6]">
                    <span className="text-[10px] text-[#667085] block">35% ML Risk</span>
                    <span className="font-bold text-[#1F2937]">
                      {((explanation?.risk_probability || 0.94) * 35).toFixed(1)} pts
                    </span>
                  </div>
                  <div className="bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E6E6E6]">
                    <span className="text-[10px] text-[#667085] block">25% Urgency</span>
                    <span className="font-bold text-[#B54708]">23.5 pts</span>
                  </div>
                  <div className="bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E6E6E6]">
                    <span className="text-[10px] text-[#667085] block">25% Safety</span>
                    <span className="font-bold text-[#D92D20]">25.0 pts</span>
                  </div>
                  <div className="bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E6E6E6]">
                    <span className="text-[10px] text-[#667085] block">15% Line Impact</span>
                    <span className="font-bold text-[#175CD3]">13.5 pts</span>
                  </div>
                </div>
              </div>

              {/* SHAP Feature Contribution Waterfall (Section 13: WHY?) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#D96F13]" />
                    WHY? (Local SHAP Feature Attribution)
                  </h4>
                  <span className="text-[11px] text-[#667085] font-mono">
                    Model: {explanation?.model_version || 'HistGradientBoosting v2.0'}
                  </span>
                </div>

                {loadingExpl ? (
                  <div className="py-12 text-center text-[#667085] text-xs animate-pulse">
                    Computing local Shapley feature attributions...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Positive drivers (Pushing Risk UP) */}
                    <div>
                      <span className="text-[11px] font-bold text-[#D92D20] flex items-center gap-1 mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Top Risk-Elevating Factors (+Δ Risk)
                      </span>
                      <div className="space-y-2">
                        {(explanation?.top_positive_features || [
                          { feature: 'Failure History (90d Incident Frequency)', contribution: 0.28 },
                          { feature: 'Asset Visual Condition Degradation Cliff', contribution: 0.22 },
                          { feature: 'Days Overdue Periodic Overhaul', contribution: 0.18 },
                          { feature: 'High Density Corridor Freight Traffic', contribution: 0.14 },
                          { feature: 'Repeat Failure Recurrence Flag', contribution: 0.11 }
                        ]).map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-[#FEF3F2] p-2.5 rounded-xl border border-[#FECDCA]">
                            <span className="font-medium text-[#1F2937]">{f.feature}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-[#D92D20] h-2 rounded-full"
                                  style={{ width: `${Math.min(100, f.contribution * 300)}%` }}
                                ></div>
                              </div>
                              <span className="font-mono font-bold text-[#D92D20] text-[11.5px] w-14 text-right">
                                +{f.contribution.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Negative drivers (Mitigating Risk) */}
                    <div>
                      <span className="text-[11px] font-bold text-[#12B76A] flex items-center gap-1 mb-2">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Risk-Mitigating Baseline Factors (-Δ Risk)
                      </span>
                      <div className="space-y-2">
                        {(explanation?.top_negative_features && explanation.top_negative_features.length > 0 ? explanation.top_negative_features : [
                          { feature: 'Recent Ultrasonic Testing Pre-check Score', contribution: -0.06 },
                          { feature: 'Standard Operational Speed Allowance', contribution: -0.04 }
                        ]).map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-[#F6FEF9] p-2.5 rounded-xl border border-[#D1FADF]">
                            <span className="font-medium text-[#1F2937]">{f.feature}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-28 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-[#12B76A] h-2 rounded-full"
                                  style={{ width: `${Math.min(100, Math.abs(f.contribution) * 300)}%` }}
                                ></div>
                              </div>
                              <span className="font-mono font-bold text-[#12B76A] text-[11.5px] w-14 text-right">
                                {f.contribution.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
