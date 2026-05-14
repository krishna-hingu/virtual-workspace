import React from 'react';
import { motion } from 'framer-motion';

export default function WorkspaceOverview({ data }) {
  if (!data) return null;

  const stats = [
    { label: 'Total Inhabitants', value: data.totalUsers, icon: '👥', color: 'from-blue-500/20 to-cyan-500/20' },
    { label: 'Active Sessions', value: data.activeSessions, icon: '⚡', color: 'from-amber-500/20 to-orange-500/20' },
    { label: 'Task Throughput', value: `${data.taskStats.completionRate}%`, icon: '🎯', color: 'from-emerald-500/20 to-teal-500/20' },
    { label: 'System Vitality', value: `${data.systemHealth}%`, icon: '❤️', color: 'from-rose-500/20 to-purple-500/20' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br ${stat.color} border border-white/5 backdrop-blur-xl group transition-all duration-500`}
          >
            <div className="absolute top-0 right-0 p-6 text-4xl opacity-10 group-hover:opacity-30 group-hover:scale-125 transition-all duration-700 pointer-events-none">
              {stat.icon}
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
               <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
               </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ecosystem Status Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
          
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            Ecosystem Core Vitals
          </h4>

          <div className="space-y-8">
             {[
               { label: 'Database Connection', status: 'STABLE', color: 'text-emerald-400' },
               { label: 'Socket Orchestrator', status: 'ACTIVE', color: 'text-emerald-400' },
               { label: 'Telemetry Engine', status: 'STREAMING', color: 'text-cyan-400' },
               { label: 'AI Synthesis Node', status: 'OPERATIONAL', color: 'text-purple-400' }
             ].map((item) => (
               <div key={item.label} className="flex justify-between items-center group/item">
                  <span className="text-sm font-medium text-slate-400 group-hover/item:text-slate-200 transition-colors">{item.label}</span>
                  <div className="flex items-center gap-4">
                     <div className="h-px w-12 bg-white/5 group-hover/item:w-16 transition-all" />
                     <span className={`${item.color} font-mono text-[10px] font-bold tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5`}>
                       {item.status}
                     </span>
                  </div>
               </div>
             ))}
          </div>
        </motion.div>

        {/* Workload Balance Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
          
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
             <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
             Workload Distribution
          </h4>

          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-end mb-4">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Task Throughput</span>
                 <span className="text-2xl font-black text-white">{data.taskStats.completionRate}%</span>
              </div>
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${data.taskStats.completionRate}%` }}
                   transition={{ duration: 1, ease: "circOut" }}
                   className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                 />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Outstanding</p>
                  <p className="text-xl font-black text-white">{data.taskStats.total - data.taskStats.completed}</p>
               </div>
               <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Load</p>
                  <p className="text-xl font-black text-white">{data.taskStats.total}</p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}