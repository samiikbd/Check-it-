import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, onOpenAuth }) => {
  const { isAdmin, isLoading, switchDemoRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm">Authenticating editor credentials...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#111625] border border-rose-500/30 rounded-3xl text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin Portal Restricted</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Access to Human-in-the-Loop (HITL) verdict overrides and editorial audit logs requires verified editorial or administrator privileges.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => switchDemoRole('admin')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition"
          >
            Switch to Demo Admin Profile
          </button>
          <button
            onClick={onOpenAuth}
            className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
          >
            Sign In with Admin Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};