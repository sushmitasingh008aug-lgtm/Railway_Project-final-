import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navigation & App Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 pt-8">
        {activeTab === 'overview' && (
          <OverviewTab metrics={metrics} impact={impact} loading={loading} />
        )}

        {activeTab === 'gantt' && (
          <GanttTab
            schedule={schedule}
            trains={trains}
            onRefreshSchedule={fetchAllData}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuiteTab
            testStatus={testStatus}
            onRefreshTests={async () => {
              const res = await apiClient.get<TestStatusResponse>('/tests/status').catch(() => null);
              if (res) setTestStatus(res.data);
            }}
          />
        )}

        {activeTab === 'submit' && (
          <SubmitTab
            sections={sections}
            onSubmissionSuccess={fetchAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-darkBorder py-6 text-center text-xs text-slate-500 bg-[#0c1220]">
        Smart India Hackathon 2026 • AI-Powered Automatic Block Planning Engine • Clean Architecture
      </footer>
    </div>
  );
}

export default App;
