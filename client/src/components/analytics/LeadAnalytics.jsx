import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { activityAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useTaskHydration } from "../../hooks/useTaskHydration";

export default function LeadAnalytics() {
  const { user } = useAuthStore();
  const tasks = useWorkspaceStore(state => state.tasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activity, setActivity] = useState([]);
  const [showTeamSection, setShowTeamSection] = useState(false);
  const [liveAI, setLiveAI] = useState(null);

  // Hydrate tasks if empty (route-independent)
  useTaskHydration();

  const currentUserId = user?._id || user?.id || localStorage.getItem("userId");

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Fetch all activity for team
        const activityResponse = await activityAPI.getActivity();
        const safeActivity = Array.isArray(activityResponse?.data) 
          ? activityResponse.data 
          : [];

        setActivity(safeActivity);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Error loading team data");
        setLoading(false);
      }
    };

    fetchTeamData();
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
  
  // Team metrics - calculated from real task data
  const activeTeamMembers = 0; // Requires real backend endpoint
  const averageProductivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const burnoutRiskMembers = 0; // Requires real backend endpoint

  // AI Insights Generator for Team
  const generateTeamInsights = ({ totalTasks, completedTasks, interruptions, activity }) => {
    const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let risk = "low";
    let insight = "Team performance is stable";
    let suggestion = "Continue current workflow";

    if (productivityRate < 50) {
      risk = "high";
      insight = "Team productivity needs attention";
      suggestion = "Consider team meeting to address blockers";
    } else if (productivityRate < 70) {
      risk = "medium";
      insight = "Team could improve collaboration";
      suggestion = "Schedule regular check-ins";
    }

    if (interruptions > 10) {
      insight = "High interruptions affecting team";
      suggestion = "Review team focus policies";
    }

    return {
      productivityRate,
      risk,
      insight,
      suggestion,
    };
  };

  const ai = generateTeamInsights({
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
    liveAI?.productivityRate < 50
      ? "Low"
      : liveAI?.productivityRate < 70
        ? "Moderate"
        : "High";

  // Burnout Risk Detection
  const burnoutRisk = interruptions > 10;

  // AI Confidence
  const confidence = tasks.length > 10
    ? "High"
    : "Moderate";

  // Dynamic Weekly Data - Real aggregation from task timestamps
  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    const data = days.map(day => ({
      day,
      value: 0,
    }));

    tasks?.forEach(task => {
      const completed =
        task.status === "done" ||
        task.status === "completed";

      if (!completed) return;

      const date = new Date(task.updatedAt || task.createdAt);
      const dayName = days[date.getDay()];
      const dayIndex = days.indexOf(dayName);

      if (dayIndex >= 0) {
        data[dayIndex].value += 20;
      }
    });

    return data;
  }, [tasks]);

  // Focus Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusTime(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Smart Insight History Effect
  useEffect(() => {
    if (!liveAI?.insight) return;

    setHistory(prev => {
      const updated = [liveAI.insight, ...prev];
      return [...new Set(updated)].slice(0, 3);
    });
  }, [liveAI?.insight]);

  // Heatmap Data Generation - use useMemo for performance
  const heatmapData = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array(7).fill(0));
    
    activity?.forEach((item) => {
      const timestamp = item.createdAt || item.updatedAt || item.timestamp;
      if (timestamp) {
        const date = new Date(timestamp);
        const day = date.getDay();
        const hour = Math.floor(date.getHours() / 4);
        if (day >= 0 && day < 7 && hour >= 0 && hour < 7) {
          data[day][hour] += 1;
        }
      }
    });
    
    return data;
  }, [activity]);

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
        <div className="text-white">Loading team analytics...</div>
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
          <h1 className="text-4xl font-bold text-white tracking-wide">Team Lead Analytics</h1>
          <p className="text-gray-400 text-sm mt-2">Monitor team performance and productivity insights</p>
        </div>

        {/* Team Overview Cards */}
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Team Members */}
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
                Team
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">-</div>
            <div className="text-sm text-gray-400">Total Members</div>
            <div className="text-xs text-gray-500 mt-2">Team data not available</div>
          </motion.div>

          {/* Team Productivity */}
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
                Productivity
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{averageProductivity}%</div>
            <div className="text-sm text-gray-400">Team Average</div>
            <div className="text-xs text-blue-400 mt-2">{productivityLevel} performance</div>
          </motion.div>

          {/* Burnout Alerts */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="
              relative
              rounded-2xl p-6
              bg-gradient-to-br from-red-500/10 via-transparent to-red-500/5
              border border-red-400/20
              ring-1 ring-red-400/10
              backdrop-blur-xl
              shadow-[0_10px_40px_rgba(0,0,0,0.2)]
              transition-all duration-300 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-5 h-5 bg-red-400 rounded-full"></div>
              </div>
              <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                Alert
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{burnoutRiskMembers}</div>
            <div className="text-sm text-gray-400">Burnout Risk</div>
            <div className="text-xs text-yellow-400 mt-2">Needs attention</div>
          </motion.div>
        </motion.div>

        {/* AI Team Insight Card */}
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
                    TEAM AI ANALYSIS
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <h3 className="text-sm text-gray-400">Team Insight</h3>
                  </div>

                  <p
                    className={`text-xl font-bold mb-2 ${liveAI?.risk === "high"
                        ? "text-red-400"
                        : liveAI?.risk === "medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                  >
                    {liveAI?.insight || "Analyzing team data..."}
                  </p>

                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                    {liveAI?.suggestion || "Processing team patterns..."}
                  </p>

                  <div className="text-xs text-gray-500 mt-2">
                    Based on team activity patterns & performance
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
                      ⚠ High interruptions detected - review team focus policies
                    </div>
                  )}

                  <div className="mt-5 text-xs text-gray-500">
                    <div className="mb-2 text-gray-400">
                      Recent Team Insights
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

        {/* Team Task Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg text-white mb-3">Team Task Progress</h2>
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
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
              <div className="text-3xl font-bold text-white mb-2">{completedTasks}</div>
              <div className="text-sm text-gray-400">Tasks Completed</div>
            </motion.div>

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
              <div className="text-3xl font-bold text-white mb-2">{inProgressTasks}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </motion.div>

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
              <div className="text-3xl font-bold text-white mb-2">{todoTasks}</div>
              <div className="text-sm text-gray-400">Pending Tasks</div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Team Members Performance - Hidden until real backend endpoint available */}
        {!showTeamSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-[#0F1117]/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 text-center">
              <p className="text-gray-400 text-sm">Team member performance data requires backend endpoint implementation</p>
            </div>
          </motion.div>
        )}

        {/* Team Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-lg text-white mb-3">Team Activity Heatmap</h2>
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
                    key={`${dayIndex}-${hourIndex}`}
                    className={`aspect-square rounded ${getHeatColor(value)}`}
                    title={`${value} team activities`}
                  />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
