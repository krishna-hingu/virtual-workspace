import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, activityAPI } from '../../../services/api';
import { useWorkspaceStore } from '../../../store/workspaceStore';
import { useTaskHydration } from '../../../hooks/useTaskHydration';

export default function AggregatedAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const tasks = useWorkspaceStore(state => state.tasks);
  const [liveAI, setLiveAI] = useState(null);
  const [history, setHistory] = useState([]);

  // Ensure tasks are hydrated
  useTaskHydration();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, activityRes] = await Promise.all([
          adminAPI.getAnalytics(),
          activityAPI.getActivity()
        ]);
        
        setAnalytics(analyticsRes.data);
        setActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
      } catch (error) {
        console.error("Failed to fetch ecosystem data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // AI Logic - Reused from AdminAnalytics.jsx but scoped to this component
  const { completedTasks, inProgressTasks, todoTasks } = useMemo(() => {
    const normalize = (s) => s?.toLowerCase().replace("-", " ");
    const statusMap = {
      completed: ["completed", "done", "finished"],
      inprogress: ["in progress", "in-progress", "ongoing"],
      todo: ["todo", "pending", "to do"],
    };

    return {
      completedTasks: tasks.filter((t) => statusMap.completed.includes(normalize(t.status))).length,
      inProgressTasks: tasks.filter((t) => statusMap.inprogress.includes(normalize(t.status))).length,
      todoTasks: tasks.filter((t) => statusMap.todo.includes(normalize(t.status))).length,
    };
  }, [tasks]);

  const interruptions = useMemo(() => 
    activity?.filter((a) => a.type === "interruption").length || 0
  , [activity]);

  const generateInsights = useMemo(() => {
    const totalTasks = tasks.length;
    const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let risk = "low";
    let insight = "Ecosystem performance is optimal";
    let suggestion = "Maintain current operational equilibrium";

    if (productivityRate < 60) {
      risk = "high";
      insight = "Workspace productivity requires strategic review";
      suggestion = "Consider ecosystem optimization initiatives";
    } else if (productivityRate < 75) {
      risk = "medium";
      insight = "Collaborative efficiency could be improved";
      suggestion = "Implement cross-department coordination protocols";
    }

    if (interruptions > 30) {
      insight = "High fragmentation levels detected in focus zones";
      suggestion = "Deploy organization-wide focus preservation policies";
    }

    return { productivityRate, risk, insight, suggestion };
  }, [tasks.length, completedTasks, interruptions]);

  useEffect(() => {
    setLiveAI(generateInsights);
    if (generateInsights.insight) {
      setHistory(prev => [...new Set([generateInsights.insight, ...prev])].slice(0, 3));
    }
  }, [generateInsights]);

  const heatmapData = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array(7).fill(0));
    activity?.forEach((item) => {
      const timestamp = item.createdAt || item.updatedAt || item.timestamp;
      if (timestamp) {
        const date = new Date(timestamp);
        const day = date.getDay();
        const hour = Math.floor(date.getHours() / 4);
        if (day >= 0 && day < 7 && hour >= 0 && hour < 7) data[day][hour] += 1;
      }
    });
    return data;
  }, [activity]);

  const getHeatColor = (value) => {
    if (value === 0) return "bg-white/5";
    if (value === 1) return "bg-blue-500/30";
    if (value === 2) return "bg-blue-500/50";
    if (value === 3) return "bg-purple-500/70";
    return "bg-purple-500";
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Processing Ecosystem Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Total Focus Investment</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{analytics?.totalFocusHours || 0}</span>
            <span className="text-slate-500 font-medium">Hours</span>
          </div>
          <div className="mt-4 h-1 w-12 bg-purple-500/50 rounded-full" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Productivity Index</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{liveAI?.productivityRate}%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              liveAI?.risk === 'low' ? 'bg-emerald-500/10 text-emerald-500' : 
              liveAI?.risk === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {liveAI?.risk?.toUpperCase()}
            </span>
          </div>
          <div className="mt-4 h-1 w-12 bg-blue-500/50 rounded-full" />
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Active Disruptions</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{interruptions}</span>
            <span className="text-slate-500 font-medium">Events</span>
          </div>
          <div className="mt-4 h-1 w-12 bg-amber-500/50 rounded-full" />
        </motion.div>
      </div>

      {/* AI Insights & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Analysis Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/20 via-white/5 to-transparent border border-white/10 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <span className="text-6xl">🧠</span>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-mono text-purple-400 uppercase tracking-tighter">AI Ecosystem Synthesis</span>
            </div>

            <h3 className={`text-2xl font-bold mb-4 ${
              liveAI?.risk === 'high' ? 'text-rose-400' : 
              liveAI?.risk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {liveAI?.insight}
            </h3>
            
            <p className="text-slate-400 leading-relaxed mb-8 max-w-md">
              {liveAI?.suggestion}
            </p>

            <div className="space-y-3">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Intelligence Log</h5>
              {history.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Heatmap Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-semibold text-slate-200">Activity Density Map</h4>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(v => (
                <div key={v} className={`w-2 h-2 rounded-sm ${getHeatColor(v)}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-8 gap-2">
            <div />
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-600 text-center">{d}</div>
            ))}
            
            {['6a', '10a', '2p', '6p', '10p', '2a', '6a'].map((h, i) => (
              <React.Fragment key={h}>
                <div className="text-[10px] font-mono text-slate-600 self-center">{h}</div>
                {heatmapData.map((row, di) => (
                  <motion.div
                    key={`${di}-${i}`}
                    whileHover={{ scale: 1.2 }}
                    className={`aspect-square rounded-md ${getHeatColor(row[i])} transition-colors duration-500`}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
          
          <p className="mt-6 text-[10px] text-slate-500 italic text-center font-mono">
            Synchronized with live activity telemetry.
          </p>
        </motion.div>
      </div>

      {/* Workspace Utilization */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-3xl bg-white/5 border border-white/5"
      >
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-8 text-center">Inhabitant Saturation Trends</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {analytics?.utilization?.slice(-4).map((day) => (
            <div key={day.date} className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-mono text-slate-500">{day.date}</span>
                <span className="text-lg font-bold text-white">{day.count}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (day.count / 10) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
