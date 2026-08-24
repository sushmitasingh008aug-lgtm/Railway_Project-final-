import React, { useState } from 'react';
import { Calendar, Bell, ChevronDown, Menu, X, Check } from 'lucide-react';
import { ViewType } from './Sidebar';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigate?: (view: ViewType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Weekly · 23 – 30 Aug 2026');

  const ranges = [
    'Weekly · 23 – 30 Aug 2026',
    'Monthly · 23 Aug – 22 Sep 2026',
    'Past Week · 17 – 23 Aug 2026',
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-800 lg:hidden p-1 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Automatic Block Planning
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Smart Maintenance. Better Planning. Safer Operations.
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 relative">
        {/* Horizon selector */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs text-gray-800 hover:border-gray-300 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium hidden sm:inline">{selectedRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-50">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 mb-1">
                <span className="text-[11px] font-semibold text-gray-800">Planning Horizon</span>
                <button onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRange(r);
                      setShowDatePicker(false);
                      if (onNavigate) onNavigate('planning');
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-gray-50 text-gray-800 flex items-center justify-between"
                  >
                    <span>{r}</span>
                    {selectedRange === r && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts bell */}
        <button
          onClick={() => onNavigate && onNavigate('alerts')}
          title="Alerts and notifications"
          className="relative p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">
            5
          </span>
        </button>

        {/* User chip */}
        <div className="relative">
          <button
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="flex items-center gap-2.5 pl-3 border-l border-gray-100 hover:opacity-90 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-semibold">
              CP
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">Central Planner</p>
              <p className="text-[10px] text-gray-400">BSB Division</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfileModal && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800">Central Planner</p>
                <p className="text-[10px] text-gray-400">planner@indianrailways.gov.in</p>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-gray-50 text-gray-800"
                >
                  System Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onNavigate) onNavigate('reports');
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-gray-50 text-gray-800"
                >
                  Reports &amp; Exports
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
