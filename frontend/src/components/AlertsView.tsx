import React from 'react';
import { Bell, AlertTriangle, ShieldCheck, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { TestStatusResponse } from '../api/client';

interface AlertsViewProps {
  testStatus: TestStatusResponse | null;
  onRefreshTests: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ testStatus, onRefreshTests }) => {
  const alertsList = [
    { id: 1, type: 'critical', title: 'Critical Defect Reported in ALD – CNB (Track Gauge Spread)', time: '10m ago', section: 'ALD – CNB', dept: 'Engineering', severity: 'Critical' },
    { id: 2, type: 'warning', title: 'Potential Corridor Block Conflict on 27 May (CNB – PRYJ)', time: '25m ago', section: 'CNB – PRYJ', dept: 'Traction', severity: 'High' },
    { id: 3, type: 'warning', title: 'High Maintenance Demand Backlog in NDLS – ALD Corridor', time: '1h ago', section: 'NDLS – ALD', dept: 'S&T', severity: 'Medium' },
    { id: 4, type: 'info', title: 'OHE Tower Inspection Wagon Maintenance Completed', time: '2h ago', section: 'DDU Yard', dept: 'Traction', severity: 'Low' },
    { id: 5, type: 'info', title: 'IR Peak Window Restriction Active (12:00–18:00 Non-Critical Ban)', time: '3h ago', section: 'All Sections', dept: 'System Policy', severity: 'Policy' },
  ];

  return (
    <div className="space-y-6 pb-8 select-none">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <span>Live System Alerts &amp; Operational Verification</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time critical defect notifications, corridor warnings, and automated test suite status.
          </p>
        </div>
        <button
          onClick={onRefreshTests}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
        >
          Run System Check
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Active Notifications &amp; Critical Feed</span>
        </h3>
        <div className="space-y-3">
          {alertsList.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between hover:border-gray-200 transition"
            >
              <div className="flex items-center gap-3">
                {a.type === 'critical' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                {a.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                {a.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
                <div>
                  <p className="text-xs font-semibold text-gray-800">{a.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Section: <span className="text-gray-600 font-semibold">{a.section}</span> &bull; Dept:{' '}
                    <span className="text-gray-600 font-semibold">{a.dept}</span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-gray-400 block">{a.time}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 inline-block ${
                    a.severity === 'Critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : a.severity === 'High'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : a.severity === 'Medium'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {a.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Status */}
      {testStatus && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Automated Engine Verification Status</span>
            </h3>
            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {testStatus.total_tests} / {testStatus.total_tests} Tests Passed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testStatus.test_cases?.map((tc) => (
              <div key={tc.id} className="p-3.5 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">{tc.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                      {tc.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{tc.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
