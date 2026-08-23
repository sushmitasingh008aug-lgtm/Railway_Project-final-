import React, { useState } from 'react';
import { Calendar, Bell, ChevronDown, User, Menu, X, Check } from 'lucide-react';
import { ViewType } from './Sidebar';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigate?: (view: ViewType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState('23 May 2026 - 30 May 2026');

  const ranges = [
    '23 May 2026 - 30 May 2026 (Weekly)',
    '23 May 2026 - 22 Jun 2026 (Monthly)',
    '17 May 2026 - 23 May 2026 (Past Week)',
  ];

  return (
    <header className="bg-[#0b101d] border-b border-[#1a2336] px-6 py-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left Title & Subtitle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-slate-200 lg:hidden p-1 rounded-lg hover:bg-[#162032]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            AI-Powered Automatic Block Planning
          </h1>
          <p className="text-xs text-slate-400 font-normal mt-0.5">
            Smart Maintenance. Better Planning. Safer Operations.
          </p>
        </div>
      </div>

      {/* Right User & Controls */}
      <div className="flex items-center gap-4 relative">
        {/* Date Range Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2.5 bg-[#121929] border border-[#1e293b] px-3.5 py-1.5 rounded-xl text-xs text-slate-200 hover:border-slate-700 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">{selectedRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Date Picker Dropdown Modal */}
          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-64 bg-[#101726] border border-[#1d273a] rounded-xl shadow-2xl p-2 z-50">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e293b] mb-1">
                <span className="text-[11px] font-bold text-slate-300">Select Horizon Range</span>
                <button onClick={() => setShowDatePicker(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRange(r.split(' (')[0]);
                      setShowDatePicker(false);
                      if (onNavigate) onNavigate('planning');
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#19243a] text-slate-300 flex items-center justify-between"
                  >
                    <span>{r}</span>
                    {selectedRange === r.split(' (')[0] && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell Button */}
        <button
          onClick={() => onNavigate && onNavigate('alerts')}
          title="View Live Alerts & Notifications"
          className="relative p-2 rounded-xl bg-[#121929] border border-[#1e293b] text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0b101d]">
            5
          </span>
        </button>

        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="flex items-center gap-2.5 pl-2 border-l border-[#1a2336] hover:opacity-90 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 text-xs font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-200 leading-tight">Planner</p>
              <p className="text-[10px] text-slate-400 font-medium">Central Planner</p>
            </div>
          </button>

          {/* Profile Dropdown Modal */}
          {showProfileModal && (
            <div className="absolute right-0 mt-2 w-56 bg-[#101726] border border-[#1d273a] rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[#1e293b]">
                <p className="text-xs font-bold text-white">Central Planner</p>
                <p className="text-[10px] text-slate-400">planner@indianrailways.gov.in</p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#19243a] text-slate-300"
                >
                  ⚙️ System Settings & Config
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('assets');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#19243a] text-slate-300"
                >
                  🛡️ Asset Health & Tests
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
