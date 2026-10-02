import React from 'react';
import { LayoutGrid, Search, History } from 'lucide-react';

interface BottomNavProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeNav, setActiveNav }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-800/80 px-6 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-around">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveNav('dashboard')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'dashboard'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[11px]">Dashboard</span>
        </button>

        {/* Tab 2: Fact Checker */}
        <button
          onClick={() => setActiveNav('checker')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'checker'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[11px]">Fact Checker</span>
        </button>

        {/* Tab 3: History */}
        <button
          onClick={() => setActiveNav('history')}
          className={`flex flex-col items-center gap-1 transition ${
            activeNav === 'history'
              ? 'text-indigo-400 font-semibold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[11px]">History</span>
        </button>

      </div>
    </nav>
  );
};