import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenterView } from './components/CommandCenterView';
import { NetworkSectionsView } from './components/NetworkSectionsView';
import { TasksView } from './components/TasksView';
import { AIPriorityView } from './components/AIPriorityView';
import { CoordinationView } from './components/CoordinationView';
import { GanttTab } from './components/GanttTab';
import { BeforeAfterView } from './components/BeforeAfterView';
import { WeeklyMonthlyView } from './components/WeeklyMonthlyView';
import { FailureIntelligenceView } from './components/FailureIntelligenceView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { ApprovalAuditView } from './components/ApprovalAuditView';
import { SubmitTab } from './components/SubmitTab';
import { MapView } from './components/MapView';
import { AlertsView } from './components/AlertsView';
import { AnomalyHandlingView } from './components/AnomalyHandlingView';
import { TrainConflictsView } from './components/TrainConflictsView';
import { AssetHealthView } from './components/AssetHealthView';
import { DataIngestionView } from './components/DataIngestionView';
import { DataQualityView } from './components/DataQualityView';
import { ScenarioExplorerView } from './components/ScenarioExplorerView';
import { ModelVersionsView } from './components/ModelVersionsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  MetricsResponse,
  ScheduledTask,
  Section,
  TestStatusResponse,
  ImpactResponse,
  TrainMovement,
  SectionRisk,
  apiClient,
} from './api/client';

export function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionRisks, setSectionRisks] = useState<SectionRisk[]>([]);
  const [testStatus, setTestStatus] = useState<TestStatusResponse | null>(null);
  const [impact, setImpact] = useState<ImpactResponse | null>(null);
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async (showLoading = true, days = horizonDays) => {
    try {
      if (showLoading) setLoading(true);
      const [mRes, sRes, secRes, tRes, iRes, trRes, rRes] = await Promise.all([
        apiClient.get<MetricsResponse>('/metrics').catch(() => null),
        apiClient.get<{ data: ScheduledTask[] }>('/schedule').catch(() => null),
        apiClient.get<{ data: Section[] }>('/sections').catch(() => null),
        apiClient.get<TestStatusResponse>('/tests/status').catch(() => null),
        apiClient.get<ImpactResponse>(`/impact?horizon_days=${days}`).catch(() => null),
        apiClient.get<{ data: TrainMovement[] }>('/trains').catch(() => null),
        apiClient.get<{ data: SectionRisk[] }>('/sections/risk').catch(() => null),
      ]);

      if (mRes) setMetrics(mRes.data);
      if (sRes) setSchedule(sRes.data.data || []);
      if (secRes) setSections(secRes.data.data || []);
      if (tRes) setTestStatus(tRes.data);
      if (iRes) setImpact(iRes.data);
      if (trRes) setTrains(trRes.data.data || []);
      if (rRes) setSectionRisks(rRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [horizonDays]);

  // Initial fetch
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Refresh data on view change
  useEffect(() => {
    fetchAllData(false);
  }, [activeView, fetchAllData]);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2937] flex flex-row font-sans antialiased">
      {/* Left Sidebar (Desktop fixed + Mobile off-canvas drawer) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top App Header */}
        <Header
          onToggleSidebar={() => setIsMobileNavOpen(!isMobileNavOpen)}
          onNavigate={(view: any) => setActiveView(view)}
          horizonDays={horizonDays}
          onHorizonChange={(days) => {
            setHorizonDays(days);
            fetchAllData(false, days);
          }}
        />

        {/* Dynamic Body Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 pb-12 w-full max-w-[1720px] mx-auto">
          <ErrorBoundary key={activeView} fallbackTitle={`Error Loading ${activeView.replace(/_/g, ' ')}`}>
          {/* OPERATIONS */}
          {(activeView === 'dashboard' || activeView === 'command_center') && (
            <CommandCenterView
              metrics={metrics}
              impact={impact}
              schedule={schedule}
              sections={sections}
              sectionRisks={sectionRisks}
              trains={trains}
              loading={loading}
              onNavigate={setActiveView}
            />
          )}

          {(activeView === 'asset_backlog' || activeView === 'maintenance_tasks') && (
            <TasksView
              schedule={schedule}
              sections={sections}
            />
          )}

          {(activeView === 'weekly_planner' || activeView === 'block_planner') && (
            <GanttTab
              schedule={schedule}
              trains={trains}
              sections={sections}
              loading={loading}
              onRefreshSchedule={() => fetchAllData(false)}
            />
          )}

          {(activeView === 'monthly_forecast' || activeView === 'weekly_monthly') && (
            <WeeklyMonthlyView
              schedule={schedule}
              sections={sections}
              loading={loading}
              onHorizonChange={(days) => {
                setHorizonDays(days);
                fetchAllData(false, days);
              }}
            />
          )}

          {activeView === 'anomaly_handling' && (
            <AnomalyHandlingView />
          )}

          {/* COORDINATION */}
          {activeView === 'coordination' && (
            <CoordinationView
              onNavigate={setActiveView}
            />
          )}

          {(activeView === 'shadow_blocks' || activeView === 'before_after') && (
            <BeforeAfterView
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'train_conflicts' && (
            <TrainConflictsView />
          )}

          {/* INTELLIGENCE */}
          {activeView === 'ai_priority' && (
            <AIPriorityView
              schedule={schedule}
            />
          )}

          {activeView === 'failure_intelligence' && (
            <FailureIntelligenceView />
          )}

          {activeView === 'asset_health' && (
            <AssetHealthView />
          )}

          {activeView === 'what_if' && (
            <WhatIfSimulatorView />
          )}

          {/* DATA */}
          {activeView === 'data_ingestion' && (
            <DataIngestionView />
          )}

          {activeView === 'data_quality' && (
            <DataQualityView />
          )}

          {activeView === 'scenario_explorer' && (
            <ScenarioExplorerView
              onNavigate={(view) => setActiveView(view as ViewType)}
            />
          )}

          {activeView === 'model_versions' && (
            <ModelVersionsView />
          )}

          {/* CONTROL */}
          {activeView === 'approvals_audit' && (
            <ApprovalAuditView />
          )}

          {(activeView === 'verification_suite' || activeView === 'alerts') && (
            <AlertsView
              testStatus={testStatus}
              onRefreshTests={async () => {
                const res = await apiClient.get<TestStatusResponse>('/tests/status').catch(() => null);
                if (res) setTestStatus(res.data);
              }}
            />
          )}

          {/* Legacy Extra Views */}
          {activeView === 'network_sections' && (
            <NetworkSectionsView
              sectionRisks={sectionRisks}
              sections={sections}
              schedule={schedule}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'demand' && (
            <SubmitTab
              sections={sections}
              onSubmissionSuccess={() => fetchAllData(false)}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'networkmap' && (
            <MapView
              sections={sections}
              schedule={schedule}
              trains={trains}
            />
          )}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E6E6E6] py-3.5 px-6 text-center text-xs text-[#667085] bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ABPS v4 — Railway Maintenance Decision-Support Control Centre (Delhi Division · SIMULATION / DEMO MODE)</span>
          <span className="text-[11px] text-[#98A2B3]">Ministry of Railways · Smart India Hackathon 2026</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
