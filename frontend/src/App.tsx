import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { MapView } from './components/MapView';
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

  const fetchAllData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Refresh schedule and metrics when switching tabs
  useEffect(() => {
    fetchAllData(false);
  }, [activeView, fetchAllData]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-gray-900 flex flex-row font-sans">
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
              schedule={schedule}
            />
          )}

          {(activeView === 'planning' || activeView === 'traffic') && (
            <GanttTab
              schedule={schedule}
              trains={trains}
              sections={sections}
              onRefreshSchedule={() => fetchAllData(false)}
            />
          )}

          {activeView === 'networkmap' && <MapView sections={sections} schedule={schedule} />}

          {activeView === 'demand' && (
            <SubmitTab
              sections={sections}
              onSubmissionSuccess={() => fetchAllData(false)}
              onNavigate={setActiveView}
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
        <footer className="border-t border-gray-200 py-3 px-6 text-center text-[11px] text-gray-400 bg-white">
          Automatic Block Planning System · v2.1 · Divisional Control Office, BSB
        </footer>
      </div>
    </div>
  );
}

export default App;
