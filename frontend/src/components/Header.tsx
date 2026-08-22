import React from 'react';
import { BarChart3, CalendarRange, ShieldCheck, FilePenLine } from 'lucide-react';

export type TabType = 'overview' | 'gantt' | 'tests' | 'submit';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview' as TabType, label: 'Executive Overview', icon: BarChart3 },
    { id: 'gantt' as TabType, label: 'Master Block Schedule & Gantt', icon: CalendarRange },
    { id: 'tests' as TabType, label: 'Live Verification Suite', icon: ShieldCheck },
    { id: 'submit' as TabType, label: 'Submit New Block Request', icon: FilePenLine },
  ];

  return (
    <header className="border-b border-darkBorder bg-[#0c1220] px-8 pt-6 pb-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 tracking-tight flex items-center gap-3">
              <span>AI-Powered Automatic Block Planning System</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              SIH 2026 Core Engine Control Center & Interactive Schedule Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PostgreSQL & CP-SAT Engine Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 px-1 font-medium text-sm transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-primaryRed text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primaryRed' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
