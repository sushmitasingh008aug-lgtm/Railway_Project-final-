import React from 'react';
import {
  LayoutDashboard,
  Layers,
  ListTodo,
  BrainCircuit,
  Combine,
  CalendarRange,
  GitCompare,
  CalendarDays,
  AlertOctagon,
  SlidersHorizontal,
  FileCheck2,
  ClipboardList,
  Map as MapIcon,
  ShieldCheck,
  X
} from 'lucide-react';

export type ViewType =
  | 'command_center'
  | 'network_sections'
  | 'maintenance_tasks'
  | 'ai_priority'
  | 'coordination'
  | 'block_planner'
  | 'before_after'
  | 'weekly_monthly'
  | 'failure_intelligence'
  | 'what_if'
  | 'approvals_audit'
  | 'demand'
  | 'networkmap'
  | 'alerts'
  | 'planning'
  | 'dashboard'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navSections = [
    {
      heading: 'OPERATIONS CONTROL',
      items: [
        { id: 'command_center' as ViewType, label: 'Command Center', icon: LayoutDashboard },
        { id: 'network_sections' as ViewType, label: 'Network & Sections', icon: Layers },
        { id: 'maintenance_tasks' as ViewType, label: 'Maintenance Tasks', icon: ListTodo },
        { id: 'networkmap' as ViewType, label: 'GPS Network Map', icon: MapIcon },
      ],
    },
    {
      heading: 'AI & OPTIMIZATION',
      items: [
        { id: 'ai_priority' as ViewType, label: 'AI Priority & SHAP', icon: BrainCircuit },
        { id: 'coordination' as ViewType, label: 'Coordination Center', icon: Combine },
        { id: 'block_planner' as ViewType, label: 'CP-SAT Block Planner', icon: CalendarRange },
        { id: 'before_after' as ViewType, label: 'Before vs After (KPIs)', icon: GitCompare },
        { id: 'weekly_monthly' as ViewType, label: 'Weekly / Monthly Plan', icon: CalendarDays },
      ],
    },
    {
      heading: 'INTELLIGENCE & REVIEW',
      items: [
        { id: 'failure_intelligence' as ViewType, label: 'Failure Intelligence', icon: AlertOctagon },
        { id: 'what_if' as ViewType, label: 'What-If Simulator', icon: SlidersHorizontal },
        { id: 'approvals_audit' as ViewType, label: 'Human Review & Audit', icon: FileCheck2 },
        { id: 'demand' as ViewType, label: 'Demand Submission', icon: ClipboardList },
        { id: 'alerts' as ViewType, label: 'Verification Suite', icon: ShieldCheck },
      ],
    },
  ];

  const handleNavClick = (id: ViewType) => {
    setActiveView(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#E6E6E6] select-none shadow-sm">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-[#E6E6E6] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Railway Signal/Track Icon in Saffron */}
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13] shadow-sm shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {/* Dual Track Lines */}
              <line x1="4" y1="3" x2="4" y2="21" />
              <line x1="20" y1="3" x2="20" y2="21" />
              {/* Sleepers */}
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="11" x2="20" y2="11" />
              <line x1="4" y1="16" x2="20" y2="16" />
              {/* High-speed Train Signal Beacon */}
              <circle cx="12" cy="11" r="3" fill="#FF9933" stroke="#D96F13" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[13.5px] text-[#1F2937] tracking-wider uppercase font-display">
                RAILWAY CONTROL
              </span>
            </div>
            <p className="text-[10px] text-[#D96F13] font-bold tracking-widest uppercase">
              AUTOMATIC BLOCK PLANNING
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Subline */}
      <div className="px-5 py-2 bg-[#FFF9F2] border-b border-[#F2E5D5] text-[10px] text-[#8C4A08] font-medium">
        Maintenance Intelligence • Coordinated Blocks • Safer Operations
      </div>

      {/* Navigation Groups */}
      <nav className="px-3 py-3 flex-1 space-y-4 overflow-y-auto">
        {navSections.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-1 text-[9.5px] font-bold uppercase tracking-wider text-[#667085]">
              {group.heading}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#FFF3E6] text-[#B85C00] font-semibold border-l-[3.5px] border-[#FF9933] shadow-sm'
                        : 'text-[#475467] hover:bg-[#F7F7F5] hover:text-[#1F2937] border-l-[3.5px] border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#D96F13]' : 'text-[#667085]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="px-5 py-3.5 border-t border-[#E6E6E6] bg-[#FAFAFA]">
        <div className="flex items-center justify-between text-[11px] text-[#475467]">
          <span className="font-semibold text-[#1F2937]">Indian Railways</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#E7F8EE] text-[#0F7644] border border-[#B3E8C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
            SYSTEM OPERATIONAL
          </span>
        </div>
        <p className="text-[10px] text-[#667085] mt-1 font-medium">
          Divisional Control Office · BSB Division
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
