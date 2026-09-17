import React, { useState } from 'react';
import { Calendar, Bell, ChevronDown, Menu, X, Check, HelpCircle } from 'lucide-react';
import { ViewType } from './Sidebar';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigate?: (view: ViewType) => void;
  horizonDays?: number;
  onHorizonChange?: (days: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate, horizonDays = 7, onHorizonChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSimTooltip, setShowSimTooltip] = useState(false);
  const [selectedRange, setSelectedRange] = useState(
    horizonDays === 30 ? 'Monthly · 23 Aug – 22 Sep 2026' : 'Weekly · 23 – 30 Aug 2026 (Active Horizon)'
  );

  const ranges = [
    'Weekly · 23 – 30 Aug 2026 (Active Horizon)',
    'Monthly · 23 Aug – 22 Sep 2026',
    'Previous Cycle · 16 – 22 Aug 2026',
  ];

  return (
    <header className="bg-white border-b border-[#E6E6E6] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-20 select-none shadow-sm">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="text-[#475467] hover:text-[#1F2937] lg:hidden p-1.5 rounded-lg hover:bg-[#F7F7F5] transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[14px] sm:text-[15px] font-extrabold text-[#7F1418] tracking-tight font-display">
              ABPS — Automated Block Planning System
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#F7F7F5] text-[#344054] border border-[#E6E6E6]">
              Delhi Division
            </span>
            {/* Operational State Badge */}
            <div className="relative">
              <span
                onMouseEnter={() => setShowSimTooltip(true)}
                onMouseLeave={() => setShowSimTooltip(false)}
                onClick={() => setShowSimTooltip(!showSimTooltip)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3E6] text-[#B85C00] border border-[#FFD9B3]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]"></span>
                <span>SIMULATION MODE</span>
                <HelpCircle className="w-3 h-3 text-[#D96F13] opacity-75" />
              </span>
              {showSimTooltip && (
                <div className="absolute left-0 mt-1.5 w-72 bg-[#1F2937] text-white text-[11px] rounded-xl p-3 shadow-xl z-50 leading-relaxed border border-[#374151]">
                  <p className="font-bold text-[#FF9933] mb-1">Demonstration & Prototype Environment</p>
                  Operates on diversified synthetic 12K railway datasets. Decision support only — requires controller review and formal validation prior to plan approval.
                </div>
              )}
            </div>
          </div>
          {/* Synchronized feeds status */}
          <div className="flex items-center gap-3 mt-0.5 text-[10.5px] text-[#667085] hidden md:flex">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span> COA · SYNCHRONIZED
            </span>
            <span className="text-[#D0D5DD]">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span> TMS · SYNCHRONIZED
            </span>
            <span className="text-[#D0D5DD]">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span> SMMS · SYNCHRONIZED
            </span>
            <span className="text-[#D0D5DD]">|</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span> TDMS · SYNCHRONIZED
            </span>
          </div>
        </div>
      </div>

      {/* Right: Horizon Selector, Notifications & Planner Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Horizon selector */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-[#F7F7F5] border border-[#E6E6E6] hover:border-[#D96F13] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-[#1F2937] transition font-medium"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D96F13]" />
            <span className="hidden md:inline">{selectedRange}</span>
            <span className="md:hidden">23–30 Aug</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E6E6E6] rounded-xl shadow-xl p-2 z-50">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#F1F5F9] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  Operational Planning Horizon
                </span>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-[#667085] hover:text-[#1F2937] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRange(r);
                      setShowDatePicker(false);
                      const days = r.includes('Monthly') ? 30 : 7;
                      onHorizonChange?.(days);
                      if (onNavigate) onNavigate('block_planner');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition flex items-center justify-between ${
                      selectedRange === r
                        ? 'bg-[#FFF3E6] text-[#B85C00] font-semibold'
                        : 'text-[#344054] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <span>{r}</span>
                    {selectedRange === r && <Check className="w-4 h-4 text-[#D96F13]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification / Alert Bell */}
        <button
          onClick={() => onNavigate && onNavigate('alerts')}
          title="Verification suite alerts"
          className="relative p-2 rounded-lg bg-[#F7F7F5] border border-[#E6E6E6] text-[#475467] hover:text-[#1F2937] hover:border-[#CBD5E1] transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D92D20] text-white text-[9.5px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
            0
          </span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E6E6E6] hover:opacity-90 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFF3E6] border border-[#FFD9B3] flex items-center justify-center text-[#D96F13] text-xs font-bold shadow-sm">
              CP
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#1F2937] leading-tight">Central Planner</p>
              <p className="text-[10.5px] text-[#667085] font-medium">BSB Division</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
          </button>

          {showProfileModal && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E6E6E6] rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[#F1F5F9]">
                <p className="text-xs font-bold text-[#1F2937]">Senior Section Controller</p>
                <p className="text-[11px] text-[#667085]">planner@bsb.railnet.gov.in</p>
                <p className="text-[10px] text-[#D96F13] font-semibold mt-0.5">Authorization Level: L4 Planner</p>
              </div>
              <div className="pt-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('approvals_audit');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#FFF3E6] hover:text-[#B85C00] text-[#344054] font-medium"
                >
                  Pending Approvals
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('alerts');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#FFF3E6] hover:text-[#B85C00] text-[#344054] font-medium"
                >
                  Verification Suite
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
