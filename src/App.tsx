import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { FactChecker } from './components/FactChecker';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminRoute } from './components/AdminRoute';
import { AuthModal } from './components/AuthModal';

export const AppContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('checker');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Handle shared claims beamed via Web Share Target (e.g., shared text/URL from mobile)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedText = urlParams.get('text') || urlParams.get('title');
    const sharedUrl = urlParams.get('url');

    if (sharedText || sharedUrl) {
      setActiveNav('checker');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Grid Pattern & Ambient Glow */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-25 z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Top Header / Brand Bar */}
      <Navbar 
        onOpenAuth={() => setIsAuthOpen(true)} 
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main View Router */}
      <main className="relative z-10 flex-1 pb-24 md:pb-16">
        {activeNav === 'checker' && <FactChecker />}
        {activeNav === 'dashboard' && <AnalyticsDashboard />}
        {activeNav === 'history' && <HistoryPage />}
        {activeNav === 'admin' && (
          <AdminRoute onOpenAuth={() => setIsAuthOpen(true)}>
            <AdminDashboard />
          </AdminRoute>
        )}
      </main>

      {/* Mobile & Responsive Bottom Navigation Bar */}
      <BottomNav 
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
      />

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
