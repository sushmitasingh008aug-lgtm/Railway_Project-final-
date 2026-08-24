import React from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  TrainFront,
  FileBarChart,
  Bell,
  Settings,
  Train,
  Map as MapIcon,
} from 'lucide-react';

export type ViewType =
  | 'dashboard'
  | 'planning'
  | 'demand'
  | 'traffic'
  | 'networkmap'
  | 'reports'
  | 'alerts'
  | 'settings';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navSections = [
    {
      heading: 'Operations',
      items: [
        { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'demand' as ViewType, label: 'Maintenance Demand', icon: ClipboardList },
        { id: 'planning' as ViewType, label: 'Block Planning', icon: CalendarRange },
        { id: 'traffic' as ViewType, label: 'Train Traffic', icon: TrainFront },
        { id: 'networkmap' as ViewType, label: 'Network Map', icon: MapIcon },
      ],
    },
    {
      heading: 'Administration',
      items: [
        { id: 'reports' as ViewType, label: 'Reports', icon: FileBarChart },
        { id: 'alerts' as ViewType, label: 'Alerts', icon: Bell },
        { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
          <Train className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-bold text-[13px] text-gray-900 leading-tight tracking-wide">RAILWAY</h1>
          <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">Block Planning</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2.5 py-4 flex-1 space-y-5 overflow-y-auto">
        {navSections.map((group) => (
          <div key={group.heading}>
            <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.label}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Block Planning System
          <br />
          v2.1 · Divisional Control Office, BSB
        </p>
      </div>
    </aside>
  );
};
