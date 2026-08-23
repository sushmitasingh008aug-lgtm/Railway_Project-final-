import React, { useState, useEffect } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ReportsView } from './components/ReportsView';
import { AlertsView } from './components/AlertsView';
import { SettingsView } from './components/SettingsView';
import { GanttTab } from './components/GanttTab';
import { TestSuiteTab } from './components/TestSuiteTab';
import { SubmitTab } from './components/SubmitTab';
import {
  MetricsResponse,
  ScheduledTask,
  Section,
  TestStatusResponse,
  ImpactResponse,
  TrainMovement,
  apiClient,
} from './api/client';

export function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [testStatus, setTestStatus] = useState<TestStatusResponse | null>(null);
  const [impact, setImpact] = useState<ImpactResponse | null>(null);
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes, secRes, tRes, iRes, trRes] = await Promise.all([
        apiClient.get<MetricsResponse>('/metrics').catch(() => null),
        apiClient.get<{ data: ScheduledTask[] }>('/schedule').catch(() => null),
        apiClient.get<{ data: Section[] }>('/sections').catch(() => null),
        apiClient.get<TestStatusResponse>('/tests/status').catch(() => null),
        apiClient.get<ImpactResponse>('/impact').catch(() => null),
        apiClient.get<{ data: TrainMovement[] }>('/trains').catch(() => null),
      ]);

      if (mRes) setMetrics(mRes.data);
      if (sRes) setSchedule(sRes.data.data || []);
      if (secRes) setSections(secRes.data.data || []);
      if (tRes) setTestStatus(tRes.data);
      if (iRes) setImpact(iRes.data);
      if (trRes) setTrains(trRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-row font-sans">
      {/* Left Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top App Header */}
        <Header onNavigate={setActiveView} />

        {/* Dynamic Body Content */}
        <main className="flex-1 px-6 pt-6 pb-10">
          {activeView === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              impact={impact}
              loading={loading}
              onNavigate={setActiveView}
            />
          )}

          {(activeView === 'planning' || activeView === 'calendar' || activeView === 'traffic') && (
            <GanttTab
              schedule={schedule}
              trains={trains}
              onRefreshSchedule={fetchAllData}
            />
          )}

          {(activeView === 'demand' || activeView === 'optimization' || activeView === 'departments') && (
            <SubmitTab
              sections={sections}
              onSubmissionSuccess={fetchAllData}
            />
          )}

          {activeView === 'assets' && (
            <TestSuiteTab
              testStatus={testStatus}
              onRefreshTests={async () => {
                const res = await apiClient.get<TestStatusResponse>('/tests/status').catch(() => null);
                if (res) setTestStatus(res.data);
              }}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView metrics={metrics} impact={impact} />
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

          {activeView === 'settings' && <SettingsView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1a2336] py-4 px-6 text-center text-xs text-slate-500 bg-[#0b101d]">
          Smart India Hackathon 2026 • AI-Powered Automatic Block Planning Engine • Clean Architecture
        </footer>
      </div>
    </div>
  );
}

export default App;
