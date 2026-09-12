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
  const [activeView, setActiveView] = useState<ViewType>('command_center');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionRisks, setSectionRisks] = useState<SectionRisk[]>([]);
  const [testStatus, setTestStatus] = useState<TestStatusResponse | null>(null);
  const [impact, setImpact] = useState<ImpactResponse | null>(null);
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [mRes, sRes, secRes, tRes, iRes, trRes, rRes] = await Promise.all([
        apiClient.get<MetricsResponse>('/metrics').catch(() => null),
        apiClient.get<{ data: ScheduledTask[] }>('/schedule').catch(() => null),
        apiClient.get<{ data: Section[] }>('/sections').catch(() => null),
        apiClient.get<TestStatusResponse>('/tests/status').catch(() => null),
        apiClient.get<ImpactResponse>('/impact').catch(() => null),
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
  }, []);

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
        />

        {/* Dynamic Body Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 pb-12 w-full max-w-[1720px] mx-auto">
          {activeView === 'command_center' && (
            <CommandCenterView
              metrics={metrics}
              impact={impact}
              schedule={schedule}
              sectionRisks={sectionRisks}
              loading={loading}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'network_sections' && (
            <NetworkSectionsView
              sectionRisks={sectionRisks}
              sections={sections}
              schedule={schedule}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'maintenance_tasks' && (
            <TasksView
              schedule={schedule}
              sections={sections}
            />
          )}

          {activeView === 'ai_priority' && (
            <AIPriorityView
              schedule={schedule}
            />
          )}

          {activeView === 'coordination' && (
            <CoordinationView
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'block_planner' && (
            <GanttTab
              schedule={schedule}
              trains={trains}
              sections={sections}
              onRefreshSchedule={() => fetchAllData(false)}
            />
          )}

          {activeView === 'before_after' && (
            <BeforeAfterView
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'weekly_monthly' && (
            <WeeklyMonthlyView
              schedule={schedule}
              sections={sections}
            />
          )}

          {activeView === 'failure_intelligence' && (
            <FailureIntelligenceView />
          )}

          {activeView === 'what_if' && (
            <WhatIfSimulatorView />
          )}

          {activeView === 'approvals_audit' && (
            <ApprovalAuditView />
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
            />
          )}

          {activeView === 'alerts' && (
            <AlertsView
              testStatus={testStatus}
              onRefreshTests={async () => {
                const res = await apiClient.get<TestStatusResponse>('/tests/status').catch(() => null);
                if (res) setTestStatus(res.data);
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#E6E6E6] py-3.5 px-6 text-center text-xs text-[#667085] bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Assisted Automatic Block Planning System · Bharat Rail Operations (Saffron Control)</span>
          <span className="text-[11px] text-[#98A2B3]">Ministry of Railways · Smart India Hackathon 2026</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
