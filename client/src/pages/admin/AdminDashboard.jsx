import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';
import { Z_INDEX } from '../../constants/zIndex';
import CinematicLoader from '../../components/shared/CinematicLoader';

// Sub-components
import WorkspaceOverview from './components/WorkspaceOverview';
import UserManagement from './components/UserManagement';
import BroadcastCenter from './components/BroadcastCenter';
import AggregatedAnalytics from './components/AggregatedAnalytics';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await adminAPI.getOverview();
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch admin overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <CinematicLoader text="Initializing Operations Center..." />;

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: '🌐' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'broadcast', label: 'Broadcast Center', icon: '📢' },
    { id: 'analytics', label: 'Ecosystem Intelligence', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-[#0F1117] text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Atmospheric Background - Enhanced for Cinematic Depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/15 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.04] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F1117]/50 to-[#0F1117]" />
      </div>

      {/* Header - Refined for Cinematic Operations Identity */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0F1117]/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/workspace')}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">Workspace</span>
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent uppercase italic">
                Operations Center
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Ecosystem Oversight</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-5 py-2 rounded-xl text-xs font-bold transition-all duration-500 flex items-center gap-2.5 overflow-hidden
                  ${activeTab === tab.id 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ borderRadius: '12px' }}
                  />
                )}
                <span className="relative z-10 text-sm">{tab.icon}</span>
                <span className="relative z-10 uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">System Nominal</span>
                </div>
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">v4.0.2-stable</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content - Improved Pacing and Immersion */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(10px)', y: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {activeTab === 'overview' && <WorkspaceOverview data={data} />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'broadcast' && <BroadcastCenter />}
            {activeTab === 'analytics' && <AggregatedAnalytics />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}