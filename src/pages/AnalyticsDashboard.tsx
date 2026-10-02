import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Calendar, 
  ArrowUpRight 
} from 'lucide-react';

interface TrendItem {
  month: string;
  verified: number;
  fake: number;
  misleading: number;
}

const TRENDS_DATA: TrendItem[] = [
  { month: 'Jan', verified: 35, fake: 20, misleading: 10 },
  { month: 'Feb', verified: 42, fake: 28, misleading: 14 },
  { month: 'Mar', verified: 50, fake: 32, misleading: 18 },
  { month: 'Apr', verified: 48, fake: 40, misleading: 22 },
  { month: 'May', verified: 65, fake: 45, misleading: 15 },
  { month: 'Jun', verified: 72, fake: 52, misleading: 19 },
  { month: 'Jul', verified: 80, fake: 58, misleading: 24 },
  { month: 'Aug', verified: 78, fake: 62, misleading: 26 },
  { month: 'Sep', verified: 95, fake: 68, misleading: 30 },
];

const TRENDING_CLAIMS = [
  {
    rank: 1,
    title: 'WHO declares new airborne pandemic strain in Southeast Asia',
    category: 'Health',
    categoryColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    claims: '18.4K claims',
    velocity: '+340%',
  },
  {
    rank: 2,
    title: 'Central Bank launching mandatory biometric digital currency by next month',
    category: 'Finance',
    categoryColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    claims: '14.1K claims',
    velocity: '+215%',
  },
  {
    rank: 3,
    title: 'Leaked NASA telescope images reveal artificial structure orbiting Europa',
    category: 'Science',
    categoryColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    claims: '9.8K claims',
    velocity: '+180%',
  },
  {
    rank: 4,
    title: 'Deepfake audio of presidential candidate withdrawing from upcoming election',
    category: 'Politics',
    categoryColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    claims: '8.3K claims',
    velocity: '+142%',
  }
];

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('90d');
  const [hoveredMonth, setHoveredMonth] = useState<TrendItem | null>(null);

  // Maximum value for proportional bar chart heights
  const maxVal = 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Misinformation Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global real-time verification metrics and trending viral claims
          </p>
        </div>

        {/* Time Selector */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              timeRange === '30d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              timeRange === '90d' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              timeRange === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        
        {/* Card 1: Total Scanned */}
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +12.8%
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              TOTAL SCANNED
            </span>
            <span className="text-2xl md:text-3xl font-black text-white">1.2M</span>
          </div>
        </div>

        {/* Card 2: Fake News Flagged */}
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              38.4%
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              FAKE NEWS FLAGGED
            </span>
            <span className="text-2xl md:text-3xl font-black text-white">454.9K</span>
          </div>
        </div>

        {/* Card 3: Verified True */}
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              VERIFIED TRUE
            </span>
            <span className="text-2xl md:text-3xl font-black text-white">565.2K</span>
          </div>
        </div>

        {/* Card 4: Misleading */}
        <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              MISLEADING
            </span>
            <span className="text-2xl md:text-3xl font-black text-white">164.7K</span>
          </div>
        </div>

      </div>

      {/* Verification Trends Chart Card */}
      <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-6 mb-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Verification Trends</h3>
            <p className="text-xs text-slate-400">Monthly distribution over 9 months</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-300">Fake</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-slate-300">Misleading</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="relative pt-6 pb-2">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-slate-700 w-full" />
            <div className="border-b border-slate-700 w-full" />
            <div className="border-b border-slate-700 w-full" />
          </div>

          <div className="relative flex items-end justify-between h-44 gap-1 sm:gap-2 px-1">
            {TRENDS_DATA.map((item) => (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredMonth(item)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="flex-1 flex flex-col items-center group cursor-pointer"
              >
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-36">
                  {/* Verified Bar (Green) */}
                  <div
                    className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                    style={{ height: `${(item.verified / maxVal) * 100}%` }}
                    title={`Verified: ${item.verified}K`}
                  />
                  {/* Fake Bar (Red) */}
                  <div
                    className="w-1.5 sm:w-2 bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                    style={{ height: `${(item.fake / maxVal) * 100}%` }}
                    title={`Fake: ${item.fake}K`}
                  />
                  {/* Misleading Bar (Yellow) */}
                  <div
                    className="w-1.5 sm:w-2 bg-amber-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                    style={{ height: `${(item.misleading / maxVal) * 100}%` }}
                    title={`Misleading: ${item.misleading}K`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-400 mt-2 group-hover:text-indigo-400">
                  {item.month}
                </span>
              </div>
            ))}
          </div>

          {/* Hover Tooltip display */}
          {hoveredMonth && (
            <div className="mt-3 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs flex items-center justify-around animate-in fade-in">
              <span className="font-bold text-white">{hoveredMonth.month} Breakdown:</span>
              <span className="text-emerald-400">Verified: {hoveredMonth.verified}K</span>
              <span className="text-rose-400">Fake: {hoveredMonth.fake}K</span>
              <span className="text-amber-400">Misleading: {hoveredMonth.misleading}K</span>
            </div>
          )}
        </div>
      </div>

      {/* Trending Misinformation Card */}
      <div className="bg-[#111625] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Trending Misinformation</h3>
            <p className="text-xs text-slate-400">Top viral false claims</p>
          </div>
          <TrendingUp className="w-5 h-5 text-rose-400" />
        </div>

        <div className="space-y-3">
          {TRENDING_CLAIMS.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#141b2d] border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-500 w-4">{item.rank}</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.categoryColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.claims}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                <span>{item.velocity}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};