import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  Zap,
  Calendar,
  ShieldCheck,
  TrainTrack,
  Building2,
  FileBarChart,
  Bell,
  Settings,
  Sparkles,
  Train
} from 'lucide-react';

export type ViewType = 'dashboard' | 'demand' | 'planning' | 'optimization' | 'calendar' | 'assets' | 'traffic' | 'departments' | 'reports' | 'alerts' | 'settings';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'demand' as ViewType, label: 'Maintenance Demand', icon: ClipboardList },
    { id: 'planning' as ViewType, label: 'Block Planning', icon: CalendarRange },
    { id: 'optimization' as ViewType, label: 'AI Optimization', icon: Zap },
    { id: 'calendar' as ViewType, label: 'Calendar View', icon: Calendar },
    { id: 'assets' as ViewType, label: 'Asset Health', icon: ShieldCheck },
    { id: 'traffic' as ViewType, label: 'Train Traffic', icon: TrainTrack },
    { id: 'departments' as ViewType, label: 'Departments', icon: Building2 },
    { id: 'reports' as ViewType, label: 'Reports', icon: FileBarChart },
    { id: 'alerts' as ViewType, label: 'Alerts', icon: Bell },
    { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-[#1a2336] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#1a2336]/60">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 text-sm tracking-wide leading-tight">
              RAILWAY
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider">
              BLOCK PLANNING
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#162032]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Bottom Box */}
      <div className="p-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161b33] to-[#12162a] border border-purple-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-1 text-purple-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold tracking-wide">AI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-300">How can I help you?</p>
        </div>
      </div>
    </aside>
  );
};
