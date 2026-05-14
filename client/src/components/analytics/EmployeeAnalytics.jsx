import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { activityAPI, analyticsAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useTaskHydration } from "../../hooks/useTaskHydration";
import activityTracker from "../../services/activityTracker";
import { WorkPressureIndicator, InterruptionCostWidget } from "../productivity";

export default function EmployeeAnalytics() {
  const { user, userId, role } = useAuthStore();
  const tasks = useWorkspaceStore(state => state.tasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState([]);
  const [liveAI, setLiveAI] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [interruptionLogs, setInterruptionLogs] = useState([]);

  // Hydrate tasks if empty (route-independent)
  useTaskHydration();

  const currentUserId = userId || user?._id || user?.id || localStorage.getItem("userId");

  // DEBUG: Log essential auth info only
  console.log("ROLE:", localStorage.getItem("role"));
  console.log("USER:", localStorage.getItem("userId"));

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [activityRes, pressureRes, interruptionRes] = await Promise.all([
          activityAPI.getActivity(),
          analyticsAPI.getWorkPressure(),
          analyticsAPI.getInterruptionLogs()
        ]);

        console.log("ACTIVITY API RESPONSE:", activityRes);
        console.log("PRESSURE API RESPONSE:", pressureRes);
        console.log("INTERRUPTION LOGS RESPONSE:", interruptionRes);

        // Backend already filters activity by user role, so use them directly
        console.log("BACKEND FILTERED ACTIVITY COUNT:", activityRes.data.length);
        console.log("SAMPLE ACTIVITY STRUCTURE:", activityRes.data[0]);

        setActivity(activityRes.data);
        setPressure(pressureRes.data);
        setInterruptionLogs(interruptionRes.data.interruptions);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error loading data");
        setLoading(false);
      }
    };

    fetchActivity();
  }, [currentUserId]);

  const { completedTasks, inProgressTasks, todoTasks } = (() => {
    const normalize = (s) => s?.toLowerCase().replace("-", " ");
    const statusMap = {
      completed: ["completed", "done", "finished"],
      inprogress: ["in progress", "in-progress", "ongoing"],
      todo: ["todo", "pending", "to do"],
    };

    const completedTasks = tasks.filter((task) =>
      statusMap.completed.includes(normalize(task.status))
    ).length;

    const inProgressTasks = tasks.filter((task) =>
      statusMap.inprogress.includes(normalize(task.status))
    ).length;

    const todoTasks = tasks.filter((task) =>
      statusMap.todo.includes(normalize(task.status))
    ).length;

    return { completedTasks, inProgressTasks, todoTasks };
  })();

  const totalTasks = tasks.length;
  const interruptions = activity?.filter((a) => a.type === "interruption").length || 0;

  // AI Insights Generator
  const generateInsights = ({ totalTasks, completedTasks, interruptions, activity }) => {
    const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    let risk = "low";
    let insight = "Productivity looks stable";
    let suggestion = "Keep up the good work";

    if (productivityRate < 30) {
      risk = "high";
      insight = "Productivity needs attention";
      suggestion = "Consider breaking tasks into smaller steps";
    } else if (productivityRate < 60) {
      risk = "medium";
      insight = "Productivity could improve";
      suggestion = "Try time-blocking techniques";
    }

    if (interruptions > 5) {
      insight = "High interruptions detected";
      suggestion = "Enable focus mode to minimize distractions";
    }

    return {
      productivityRate,
      risk,
      insight,
      suggestion,
    };
  };

  const ai = generateInsights({
    totalTasks,
    completedTasks,
    interruptions,
    activity
  });

  // Update live AI when data changes (removed fake random variation)
  useEffect(() => {
    setLiveAI(ai);
  }, [totalTasks, completedTasks, interruptions, activity]);

  // AI Enhancement States
  const [focusTime, setFocusTime] = useState(0);
  const [history, setHistory] = useState([]);

  // Productivity Level
  const productivityLevel =
    liveAI?.productivityRate < 40
      ? "Low"
      : liveAI?.productivityRate < 70
        ? "Moderate"
        : "High";

  // Burnout Risk Detection
  const burnoutRisk =
    interruptions > 5 &&
    liveAI?.productivityRate < 40;

  // Focus Efficiency based on real data
  const focusEfficiency = useMemo(() => {
    if (activity.length === 0) return 0;
    
    const focusActivities = activity.filter(item => 
      item.type === "task_update" || item.type === "login" || item.type === "session_start"
    );
    
    const interruptionActivities = activity.filter(item => 
      item.type === "interruption"
    );
    
    const baseEfficiency = Math.min(focusActivities.length * 10, 100);
    const interruptionPenalty = interruptionActivities.length * 5;
    
    return Math.max(0, baseEfficiency - interruptionPenalty);
  }, [activity]);

  // Interruption Cost Metrics - derived from InteractionLog data
  const interruptionMetrics = useMemo(() => {
    const interruptions = interruptionLogs || [];

    const count = interruptions.length;

    const totalDuration = interruptions.reduce(
      (sum, item) => sum + (item.duration || 0),
      0
    );

    const avgDuration = count > 0 ? totalDuration / count : 0;

    const productivityLoss = Math.min(count * 5, 50);

    const frequencyPerHour = count > 0 ? (count / 7 / 24).toFixed(2) : 0;

    return {
      count,
      totalDuration,
      avgDuration,
      productivityLoss,
      frequencyPerHour,
    };
  }, [interruptionLogs]);

  // Dynamic Weekly Data - Generate from real task timestamps
  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    return days.map(day => {
      // Count completed tasks for this day of week
      const dayTasks = tasks.filter(task => {
        if (!task.updatedAt && !task.createdAt) return false;
        
        const taskDate = new Date(task.updatedAt || task.createdAt);
        const taskDay = taskDate.toLocaleDateString("en-US", { weekday: "short" });
        
        return taskDay === day && task.status?.toLowerCase() === "completed";
      });
      
      const count = dayTasks.length;
      const value = Math.max(count * 20, 10); // Each completed task = 20 points, min 10
      
      return {
        day,
        value
      };
    });
  }, [tasks]);

  // AI Confidence based on data quality and quantity
  const confidence = useMemo(() => {
    const dataPoints = activity.length + tasks.length;
    const recentActivity = activity.filter(item => {
      const itemDate = new Date(item.createdAt || item.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    });
    
    if (dataPoints > 20 && recentActivity.length > 10) return "High";
    if (dataPoints > 10 && recentActivity.length > 5) return "Moderate";
    return "Low";
  }, [activity, tasks]);

  // Enhanced Heatmap Data Generation from real-time activity
  const heatmapData = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array(7).fill(0));
    
    // Process real-time activity and task data
    const allItems = [...activity, ...tasks];
    
    allItems.forEach((item) => {
      const timestamp = item.createdAt || item.updatedAt || item.timestamp;
      if (timestamp) {
        const date = new Date(timestamp);
        const day = date.getDay();
        const hour = Math.floor(date.getHours() / 4); // Group into 4-hour blocks
        
        if (day >= 0 && day < 7 && hour >= 0 && hour < 7) {
          // Weight different types of activity based on real-time tracking
          let weight = 1;
          if (item.status === "completed") weight = 3; // Completed tasks worth more
          if (item.type === "task_create" || item.type === "task_update") weight = 2;
          if (item.type === "task_complete") weight = 3;
          if (item.type === "movement") weight = 1;
          if (item.type === "workspace_interaction") weight = 2;
          if (item.type === "focus_start" || item.type === "focus_end") weight = 2;
          if (item.type === "interruption") weight = 1;
          if (item.title && !item.type) weight = 2; // Task without type = task update
          
          data[day][hour] += weight;
        }
      }
    });
    
    console.log('Real-time heatmap data:', data);
    return data;
  }, [activity, tasks]);

  // Smart Insight History Effect
  useEffect(() => {
    if (!liveAI?.insight) return;

    setHistory(prev => {
      const updated = [liveAI.insight, ...prev];
      return [...new Set(updated)].slice(0, 3);
    });
  }, [liveAI?.insight]);

  // Real-time Activity Tracking
  useEffect(() => {
    // Start activity tracking when component mounts
    activityTracker.start();
    
    // Setup real-time activity updates
    const updateActivity = () => {
      const status = activityTracker.getActivityStatus();
      console.log('Activity status:', status);
    };
    
    // Update activity status every 5 seconds
    const interval = setInterval(updateActivity, 5000);
    
    return () => {
      clearInterval(interval);
      activityTracker.stop();
    };
  }, []);

  // Track task-related activities
  useEffect(() => {
    const handleTaskCreate = (title, description) => {
      activityTracker.trackTaskCreate(title, description);
    };
    
    const handleTaskUpdate = (taskId, status, title) => {
      activityTracker.trackTaskUpdate(taskId, status, title);
    };
    
    const handleTaskComplete = (taskId, title) => {
      activityTracker.trackTaskComplete(taskId, title);
    };
    
    // Store handlers for external use
    window.taskActivityHandlers = {
      create: handleTaskCreate,
      update: handleTaskUpdate,
      complete: handleTaskComplete
    };
    
    return () => {
      delete window.taskActivityHandlers;
    };
  }, []);

  // Real-time Focus Timer with activity detection
  useEffect(() => {
    const interval = setInterval(() => {
      const status = activityTracker.getActivityStatus();
      
      // Only increment focus time if user is active and not idle
      if (status.isActive && !status.isIdle) {
        setFocusTime(prev => prev + 1);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getHeatColor = (value) => {
    if (value === 0) return "bg-[#020617]";
    if (value === 1) return "bg-blue-500";
    if (value === 2) return "bg-green-400";
    if (value === 3) return "bg-green-500";
    return "bg-green-600";
  };

  if (loading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-[#0F1117] flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden bg-[#0F1117] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#0F1117]">
      {/* Gradient glow */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-green-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-5xl mx-auto px-6 py-8 w-full"
      >
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white tracking-wide">Employee Analytics</h1>
          <p className="text-gray-400 text-sm mt-2">Monitor your personal productivity and insights</p>
        </div>

        {/* AI Score - Hero System Panel */}
        <div className="relative w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="
              relative
              rounded-3xl p-8 md:p-10
              bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5
              border border-blue-400/20
              ring-1 ring-blue-400/10
              backdrop-blur-xl
              shadow-[0_20px_60px_rgba(0,0,0,0.3)]
              overflow-hidden
            "
          >
            <div className="absolute top-10 right-10 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* LEFT COLUMN - Score + Text */}
              <div className="relative">
                <div className="absolute blur-2xl opacity-20 bg-blue-400 w-40 h-40 rounded-full"></div>

                <h3 className="text-sm text-gray-400 mb-4">AI SCORE</h3>

                <div className="flex items-center gap-2 text-xs text-green-400 mt-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Live AI Monitoring
                </div>

                <div className="mt-2">
                  <span className="text-xs text-blue-400 border border-blue-400/20 px-2 py-1 rounded-full">
                    {productivityLevel} Productivity
                  </span>
                </div>

                <div className="text-6xl md:text-7xl font-extrabold transition-all duration-500 ease-in-out bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent relative z-10">
                  {liveAI?.productivityRate || 0}%
                </div>

                <div className="mt-2 text-sm text-gray-400">
                  Real-time performance evaluation
                </div>

                <div className="mt-4 text-sm text-gray-400 space-y-1">
                  <div>
                    Focus Efficiency:
                    <span className="text-blue-400 ml-1">
                      {focusEfficiency}%
                    </span>
                  </div>

                  <div>
                    Task Completion:
                    <span className="text-green-400 ml-1">
                      {liveAI?.productivityRate || 0}%
                    </span>
                  </div>

                  <div>
                    Interruption Impact:
                    <span className="text-red-400 ml-1">
                      {interruptions > 0 ? `-${Math.min(interruptions * 5, 50)}%` : '0%'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  AI Confidence:
                  <span className="text-green-400 ml-1">
                    {confidence}
                  </span>
                </div>

                <div className="mt-4 text-sm text-gray-400">
                  Focus Session:
                  <span className="text-white ml-1">
                    {focusTime} min
                  </span>
                </div>

                {burnoutRisk && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400 text-sm">
                    ⚠ Burnout risk detected. Consider taking a break.
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Graph + Visuals */}
              <div>
                {/* Weekly Trend Graph */}
                <div>
                  <h3 className="text-sm text-gray-400 mb-3">Weekly Trend</h3>

                  <div className="flex items-end gap-2 h-28">
                    {weeklyData.map((item, i) => (
                      <div
                        key={`week-${i}`}
                        title={`${item.day}: ${item.value}% productivity`}
                        style={{ height: `${item.value}%` }}
                        className="
                          w-4 rounded
                          bg-gradient-to-t from-blue-500 to-green-400
                          transition-all duration-500
                          hover:scale-110
                        "
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insight Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                },
              },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="
              relative z-10
              rounded-2xl p-6 md:p-7
              md:col-span-4 w-full
              bg-gradient-to-br from-blue-500/10 via-transparent to-green-500/10
              border border-blue-400/20
              ring-1 ring-blue-400/10
              backdrop-blur-xl
              shadow-[0_10px_50px_rgba(0,0,0,0.6)]
              transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_60px_rgba(59,130,246,0.25)]
            "
          >
            <div className="flex gap-4">
              <div className="w-[3px] rounded-full bg-gradient-to-b from-blue-400 to-green-400"></div>

              <div className="flex-1">
                <div className="h-[2px] w-20 bg-blue-400 rounded-full mb-3 animate-[pulse_4s_ease-in-out_infinite]"></div>

                <div className="max-w-4xl space-y-3">
                  <div className="text-xs text-blue-400 mb-1 tracking-wide">
                    AI ANALYSIS
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <h3 className="text-sm text-gray-400">AI Insight</h3>
                  </div>

                  <p
                    className={`text-xl font-bold mb-2 ${liveAI?.risk === "high"
                        ? "text-red-400"
                        : liveAI?.risk === "medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                  >
                    {liveAI?.insight || "Analyzing..."}
                  </p>

                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {liveAI?.suggestion || "Processing data..."}
                  </p>

                  <div className="text-xs text-gray-500 mt-2">
                    Based on your activity patterns & behavior
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${liveAI?.risk === "high"
                        ? "bg-red-500/20 text-red-400 border border-red-400/20"
                        : liveAI?.risk === "medium"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/20"
                          : "bg-green-500/20 text-green-400 border border-green-400/20"
                      }`}
                  >
                    {liveAI?.risk?.toUpperCase()} RISK
                  </span>

                  {burnoutRisk && (
                    <div className="mt-4 text-red-400 text-sm border border-red-400/20 bg-red-500/10 rounded-xl px-3 py-2">
                      ⚠ Burnout risk detected. Consider taking a break.
                    </div>
                  )}

                  <div className="mt-5 text-xs text-gray-500">
                    <div className="mb-2 text-gray-400">
                      Recent AI Insights
                    </div>

                    <div className="space-y-1">
                      {history.map((item, index) => (
                        <div key={index}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Work Pressure and Interruption Cost Cards in Same Row */}
        <div className="grid grid-cols-1 gap-6 mb-8 items-stretch">
          {/* Work Pressure Indicator */}
          {pressure && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="h-full transition-all duration-300"
            >
              <WorkPressureIndicator
                level={pressure.level}
                score={pressure.score}
              />
            </motion.div>
          )}

          {/* Interruption Cost Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="h-full transition-all duration-300"
          >
            <InterruptionCostWidget metrics={interruptionMetrics} />
          </motion.div>
        </div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg text-white mb-3">Activity Heatmap</h2>
          <div className="bg-[#0F1117]/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="grid grid-cols-8 gap-1 text-xs">
              <div></div>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-gray-400 text-center">
                  {day.slice(0, 3)}
                </div>
              ))}
              {["6a", "10a", "2p", "6p", "10p", "2a", "6a"].map((hour, hourIndex) => (
                <div key={`hour-${hourIndex}`} className="text-gray-500">
                  {hour}
                </div>
              ))}
              {heatmapData.map((row, dayIndex) =>
                row.map((value, hourIndex) => (
                  <div
                    key={`heatmap-${dayIndex}-${hourIndex}`}
                    className={`aspect-square rounded ${getHeatColor(value)}`}
                    title={`${value} activities`}
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Task Stats Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
        >
          {/* Tasks Completed */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="
              relative
              rounded-2xl p-6
              bg-gradient-to-br from-green-500/10 via-transparent to-green-500/5
              border border-green-400/20
              ring-1 ring-green-400/10
              backdrop-blur-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.2)]
              transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-5 h-5 bg-green-400 rounded-full"></div>
              </div>
              <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                Completed
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{completedTasks}</div>
            <div className="text-sm text-gray-400">Tasks Completed</div>
          </motion.div>

          {/* Total Tasks */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="
              relative
              rounded-2xl p-6
              bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5
              border border-blue-400/20
              ring-1 ring-blue-400/10
              backdrop-blur-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.2)]
              transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
              </div>
              <div className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                Total
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{totalTasks}</div>
            <div className="text-sm text-gray-400">Total Tasks</div>
          </motion.div>

          {/* In Progress */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="
              relative
              rounded-2xl p-6
              bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/5
              border border-yellow-400/20
              ring-1 ring-yellow-400/10
              backdrop-blur-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.2)]
              transition-all duration-300 hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="w-5 h-5 bg-yellow-400 rounded-full"></div>
              </div>
              <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
                Active
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{inProgressTasks}</div>
            <div className="text-sm text-gray-400">In Progress</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
