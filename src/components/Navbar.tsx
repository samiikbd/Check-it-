import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  Clock, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, activeNav, setActiveNav }) => {
  const { user, profile, isAdmin, signOut, switchDemoRole } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveNav('checker')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-white leading-none">
                Check It
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Verification Engine
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          
          {/* Admin Portal Toggle (Visible if Admin) */}
          {isAdmin && (
            <button
              onClick={() => setActiveNav(activeNav === 'admin' ? 'checker' : 'admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeNav === 'admin'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}

          {/* User Status / Role Menu */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141b2d] hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition"
                >
                  <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                  <span className="max-w-[100px] sm:max-w-[130px] truncate font-medium">
                    {user.email.split('@')[0]}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    isAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {profile?.role || 'user'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#111625] border border-slate-700/90 rounded-2xl p-2 shadow-2xl z-50 text-xs text-slate-300 animate-in fade-in">
                    <div className="p-2 border-b border-slate-800 mb-1">
                      <p className="font-semibold text-white truncate">{user.email}</p>
                      <p className="text-[10px] text-slate-400">Role: {profile?.role?.toUpperCase()}</p>
                    </div>

                    <button
                      onClick={() => {
                        setActiveNav('history');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>My Search History</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveNav('admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-purple-300 transition text-left"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin HITL Dashboard</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800 pt-1">
                      <p className="text-[10px] text-slate-500 px-3 py-1">Quick Role Simulation:</p>
                      <button
                        onClick={() => {
                          switchDemoRole(profile?.role === 'admin' ? 'user' : 'admin');
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition text-left"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                        <span>Switch to {profile?.role === 'admin' ? 'User' : 'Admin'}</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-300 transition text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};