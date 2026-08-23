import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  ClipboardList,
  AlertTriangle,
  Calendar,
  PieChart as PieIcon,
  Train,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Clock,
  IndianRupee,
  Bell
} from 'lucide-react';
import { MetricsResponse, ImpactResponse } from '../api/client';
import { ViewType } from './Sidebar';

interface DashboardViewProps {
  metrics: MetricsResponse | null;
  impact: ImpactResponse | null;
  loading: boolean;
  onNavigate: (view: ViewType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics, impact, loading, onNavigate }) => {
  // Department Donut Data
  const deptData = [
    { name: 'Engineering', value: 650, pct: '52%', color: '#3b82f6' },
    { name: 'TRD', value: 349, pct: '28%', color: '#22c55e' },
    { name: 'S&T', value: 249, pct: '20%', color: '#f97316' },
  ];

  // Priority Distribution Data
  const priorityData = [
    { name: 'Critical', value: 210, fill: '#ef4444' },
    { name: 'High', value: 420, fill: '#f97316' },
    { name: 'Medium', value: 380, fill: '#eab308' },
    { name: 'Low', value: 238, fill: '#22c55e' },
  ];

  // Utilization Trend Data
  const trendData = [
    { date: '17 May', val: 70 },
    { date: '18 May', val: 72 },
    { date: '19 May', val: 74 },
    { date: '20 May', val: 76 },
    { date: '21 May', val: 78 },
    { date: '22 May', val: 78 },
    { date: '23 May', val: 78 },
  ];

  // Asset Type Donut Data
  const assetData = [
    { name: 'Track', value: 561, pct: '45%', color: '#3b82f6' },
    { name: 'OHE', value: 312, pct: '25%', color: '#22c55e' },
    { name: 'Signals', value: 187, pct: '15%', color: '#f97316' },
    { name: 'Others', value: 188, pct: '15%', color: '#8b5cf6' },
  ];

  // Upcoming Blocks Table Data
  const upcomingBlocks = [
    { id: 'B1', section: 'NDLS - ALD', datetime: '24 May, 01:00 - 05:00', duration: '4h', depts: 'ENG, S&T', status: 'Planned', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'B2', section: 'ALD - CNB', datetime: '25 May, 23:00 - 04:00', duration: '5h', depts: 'TRD', status: 'Planned', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'B3', section: 'CNB - PRYJ', datetime: '27 May, 01:30 - 06:30', duration: '5h', depts: 'ENG, TRD, S&T', status: 'Planned', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    { id: 'B4', section: 'PRYJ - MGS', datetime: '28 May, 22:30 - 03:30', duration: '5h', depts: 'ENG, S&T', status: 'Under Review', statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { id: 'B5', section: 'MGS - BSB', datetime: '30 May, 01:00 - 06:00', duration: '5h', depts: 'TRD', status: 'Proposed', statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  ];

  return (
    <div className="space-y-5 pb-8 select-none">
      {/* 1. TOP KPI METRICS ROW (6 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1 */}
        <button
          onClick={() => onNavigate('demand')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-purple-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Total Maintenance Demands</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">1,248</h3>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+12%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>

        {/* Card 2 */}
        <button
          onClick={() => onNavigate('demand')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-red-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Critical & Overdue</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">210</h3>
            <p className="text-[11px] font-semibold text-red-400 mt-1 flex items-center gap-1">
              <span>+8%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>

        {/* Card 3 */}
        <button
          onClick={() => onNavigate('planning')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-blue-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Blocks Planned (This Week)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">156</h3>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+15%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>

        {/* Card 4 */}
        <button
          onClick={() => onNavigate('reports')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-emerald-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Block Utilization</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">78%</h3>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+6%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>

        {/* Card 5 */}
        <button
          onClick={() => onNavigate('traffic')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-amber-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Train Disruptions Avoided</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {metrics?.high_level?.disruptions_avoided ? metrics.high_level.disruptions_avoided : 24}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+20%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>

        {/* Card 6 */}
        <button
          onClick={() => onNavigate('assets')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-teal-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200">Assets Available</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white tracking-tight">92%</h3>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+5%</span> <span className="text-slate-400 font-normal">from last week</span>
            </p>
          </div>
        </button>
      </div>

      {/* 2. MIDDLE ROW GRID (3 CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Maintenance Demand by Department */}
        <div className="lg:col-span-4 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Maintenance Demand by Department
            </h2>
            <button
              onClick={() => onNavigate('departments')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              View Depts →
            </button>
          </div>
          <div className="flex items-center justify-between my-2">
            <div className="w-36 h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-extrabold text-white leading-none">1,248</span>
                <span className="text-[10px] text-slate-400 font-medium">Total</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 pl-4">
              {deptData.map((d) => (
                <button
                  key={d.name}
                  onClick={() => onNavigate('departments')}
                  className="w-full flex items-center justify-between text-xs hover:bg-[#141d30] p-1 rounded-lg transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-slate-300 font-medium">{d.name}</span>
                  </div>
                  <span className="text-slate-400 font-semibold">{d.pct} ({d.value})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Maintenance Priority Distribution */}
        <div className="lg:col-span-4 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Maintenance Priority Distribution
            </h2>
            <button
              onClick={() => onNavigate('demand')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              View Backlog →
            </button>
          </div>
          <div className="h-44 w-full cursor-pointer" onClick={() => onNavigate('demand')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 800]} ticks={[0, 200, 400, 600, 800]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: AI Recommended Blocks (This Week) */}
        <div className="lg:col-span-4 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              AI Recommended Blocks (This Week)
            </h2>
            <button
              onClick={() => onNavigate('planning')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>View on Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Corridor Node Diagram */}
          <div className="my-2.5 px-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500/40 z-0"></div>
              {['NDLS', 'ALD', 'CNB', 'PRYJ'].map((node) => (
                <div key={node} className="relative z-10 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#101726] border-2 border-blue-400 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 mt-1">{node}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Block Cards Carousel */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {/* Block B1 */}
            <button
              onClick={() => onNavigate('planning')}
              className="p-2.5 rounded-xl bg-[#121b2d] border border-emerald-500/40 hover:border-emerald-500 transition text-left group"
            >
              <span className="text-[10px] font-extrabold text-emerald-400 block group-hover:underline">Block B1</span>
              <p className="text-[9px] text-slate-300 font-medium mt-0.5">24 May, 01:00 - 05:00 4h</p>
              <span className="text-[9px] font-semibold text-slate-400 block mt-1">Engineering + S&T</span>
            </button>

            {/* Block B2 */}
            <button
              onClick={() => onNavigate('planning')}
              className="p-2.5 rounded-xl bg-[#121b2d] border border-blue-500/40 hover:border-blue-500 transition text-left group"
            >
              <span className="text-[10px] font-extrabold text-blue-400 block group-hover:underline">Block B2</span>
              <p className="text-[9px] text-slate-300 font-medium mt-0.5">25 May, 23:00 - 04:00 5h</p>
              <span className="text-[9px] font-semibold text-slate-400 block mt-1">TRD</span>
            </button>

            {/* Block B3 */}
            <button
              onClick={() => onNavigate('planning')}
              className="p-2.5 rounded-xl bg-[#121b2d] border border-purple-500/40 hover:border-purple-500 transition text-left group"
            >
              <span className="text-[10px] font-extrabold text-purple-400 block group-hover:underline">Block B3</span>
              <p className="text-[9px] text-slate-300 font-medium mt-0.5">27 May, 01:30 - 06:30 5h</p>
              <span className="text-[9px] font-semibold text-slate-400 block mt-1">Engineering + TRD + S&T</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW GRID (3 CARDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Upcoming Blocks Table */}
        <div className="lg:col-span-5 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Upcoming Blocks
            </h2>
            <button
              onClick={() => onNavigate('planning')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Master Gantt →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e293b] text-[10px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Block ID</th>
                  <th className="pb-2">Route / Section</th>
                  <th className="pb-2">Date & Time</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Departments</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60 text-[11px]">
                {upcomingBlocks.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onNavigate('planning')}
                    className="hover:bg-[#152033] transition cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-200">{b.id}</td>
                    <td className="py-2.5 text-slate-300 font-medium">{b.section}</td>
                    <td className="py-2.5 text-slate-400">{b.datetime}</td>
                    <td className="py-2.5 text-slate-400">{b.duration}</td>
                    <td className="py-2.5 text-slate-300 font-medium">{b.depts}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${b.statusColor}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-center">
            <button
              onClick={() => onNavigate('planning')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              <span>View All Blocks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Block Utilization Trend */}
        <div className="lg:col-span-4 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Block Utilization Trend
            </h2>
            <button
              onClick={() => onNavigate('reports')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Analytics →
            </button>
          </div>
          <div className="h-48 w-full cursor-pointer" onClick={() => onNavigate('reports')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGrad)" dot={{ r: 3, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Maintenance by Asset Type */}
        <div className="lg:col-span-3 bg-[#101726] border border-[#1d273a] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Maintenance by Asset Type
            </h2>
            <button
              onClick={() => onNavigate('assets')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Assets →
            </button>
          </div>
          <div className="flex flex-col items-center my-1 cursor-pointer" onClick={() => onNavigate('assets')}>
            <div className="w-32 h-32 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-asset-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-extrabold text-white leading-none">1,248</span>
                <span className="text-[9px] text-slate-400 font-medium">Total</span>
              </div>
            </div>

            <div className="w-full space-y-1.5 mt-3">
              {assetData.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }}></span>
                    <span className="text-slate-300 font-medium">{a.name}</span>
                  </div>
                  <span className="text-slate-400 font-semibold">{a.pct} ({a.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM AI & ALERTS BANNER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: AI Insights */}
        <div className="bg-gradient-to-br from-[#161c33] to-[#12162a] border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold">AI Insights</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mt-2">
            There is a high number of critical demands in ALD - CNB section. Consider an additional block in the next 7 days.
          </p>
          <button
            onClick={() => onNavigate('optimization')}
            className="mt-3 px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold hover:bg-purple-600/40 transition w-fit"
          >
            View Details
          </button>
        </div>

        {/* Card 2: Optimal Blocks Recommended */}
        <button
          onClick={() => onNavigate('planning')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-blue-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-white">18</h3>
            <p className="text-[11px] font-bold text-slate-300">Optimal Blocks Recommended</p>
            <p className="text-[10px] font-semibold text-emerald-400 mt-1">+3 vs current plan</p>
          </div>
        </button>

        {/* Card 3: Maintenance Time Optimized */}
        <button
          onClick={() => onNavigate('optimization')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-emerald-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-white">32h</h3>
            <p className="text-[11px] font-bold text-slate-300">Maintenance Time Optimized</p>
            <p className="text-[10px] font-semibold text-emerald-400 mt-1">+12% improvement</p>
          </div>
        </button>

        {/* Card 4: Cost Saving Potential */}
        <button
          onClick={() => onNavigate('reports')}
          className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-amber-500/50 hover:bg-[#141d30] transition text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-white">₹ 4.2 Cr</h3>
            <p className="text-[11px] font-bold text-slate-300">Cost Saving Potential</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1">Estimated impact</p>
          </div>
        </button>

        {/* Card 5: Recent Alerts */}
        <div className="bg-[#101726] border border-[#1d273a] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-red-400">
              <Bell className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Recent Alerts</span>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[10px] font-semibold text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>
          <div className="space-y-1.5 my-1 text-[10px]">
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full flex items-center justify-between text-slate-300 hover:text-white hover:bg-[#141d30] p-1 rounded transition text-left"
            >
              <span className="truncate pr-1">Critical defect in ALD - CNB (Track)</span>
              <span className="text-red-400 font-semibold shrink-0">10m ago</span>
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full flex items-center justify-between text-slate-300 hover:text-white hover:bg-[#141d30] p-1 rounded transition text-left"
            >
              <span className="truncate pr-1">Block conflict detected on 27 May</span>
              <span className="text-amber-400 font-semibold shrink-0">25m ago</span>
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full flex items-center justify-between text-slate-300 hover:text-white hover:bg-[#141d30] p-1 rounded transition text-left"
            >
              <span className="truncate pr-1">High maintenance demand in NDLS - ALD</span>
              <span className="text-yellow-400 font-semibold shrink-0">1h ago</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
