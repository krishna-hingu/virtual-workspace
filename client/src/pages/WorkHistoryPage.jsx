import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useUIStore } from '../store/uiStore';
import { useTimelineProcessor } from '../utils/timelineProcessor';
import { TimelineContainer, TimelineFilters } from '../components/work-history/TimelineSection';
import { CINEMATIC } from '../constants/cinematicAtmosphere';
import { Z_INDEX } from '../constants/zIndex';
import CinematicLoader from '../components/shared/CinematicLoader';
import { activityAPI } from '../services/api';

/**
 * WorkHistoryPage - Cinematic memory timeline of user's productivity journey
 * 
 * This is NOT an admin dashboard or CRUD interface
 * This IS a visual interpretation layer showing evolution of work
 * 
 * Data sources: workspaceStore.tasks, activityAPI data, uiStore.notifications
 * No backend changes required - pure frontend transformation
 */
export default function WorkHistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState(new Set());
  const [activeFilters, setActiveFilters] = useState([]);
  const [isCompact, setIsCompact] = useState(false);
  const [historicalActivity, setHistoricalActivity] = useState([]);

  // Read-only access to existing data stores
  const tasks = useWorkspaceStore((state) => state.tasks);
  const liveActivity = useWorkspaceStore((state) => state.activity);
  const notifications = useUIStore((state) => state.notifications);

  // Safely merge historical and live activity to avoid duplicates
  const combinedActivity = useMemo(() => {
    const activityMap = new Map();
    
    // Add historical activity first
    historicalActivity.forEach(item => {
      activityMap.set(item._id || item.id, item);
    });
    
    // Merge live activity, potentially overwriting historical if IDs match
    liveActivity.forEach(item => {
      activityMap.set(item._id || item.id, item);
    });
    
    return Array.from(activityMap.values());
  }, [historicalActivity, liveActivity]);

  // Transform data into cinematic timeline
  const { events: groupedEvents, totalEvents, hasEvents } = useTimelineProcessor(
    tasks, 
    combinedActivity, 
    notifications
  );

  // Hydrate historical telemetry on mount
  useEffect(() => {
    const hydrateHistory = async () => {
      try {
        const response = await activityAPI.getActivity();
        if (response.data) {
          setHistoricalActivity(response.data);
        }
      } catch (error) {
        console.error('Failed to hydrate work history:', error);
      } finally {
        setLoading(false);
      }
    };

    hydrateHistory();
  }, []);

  // Handle event expansion
  const handleToggleExpand = (eventId) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterType) => {
    if (filterType === 'clear') {
      setActiveFilters([]);
    } else {
      setActiveFilters(prev => {
        if (prev.includes(filterType)) {
          return prev.filter(f => f !== filterType);
        } else {
          return [...prev, filterType];
        }
      });
    }
  };

  // Available filter options based on event types in data
  const availableFilters = [
    { type: 'task_created', label: 'Tasks Created', icon: '✨', bgColor: 'bg-emerald-500/10', color: 'text-emerald-400', borderColor: 'border-emerald-500/20' },
    { type: 'task_completed', label: 'Tasks Done', icon: '✅', bgColor: 'bg-green-500/10', color: 'text-green-400', borderColor: 'border-green-500/20' },
    { type: 'focus_start', label: 'Focus Sessions', icon: '🎯', bgColor: 'bg-violet-500/10', color: 'text-violet-400', borderColor: 'border-violet-500/20' },
    { type: 'session_complete', label: 'Sessions', icon: '⏱️', bgColor: 'bg-teal-500/10', color: 'text-teal-400', borderColor: 'border-teal-500/20' }
  ];

  // Filter events based on active filters
  const filteredEvents = activeFilters.length > 0 
    ? Object.keys(groupedEvents).reduce((acc, period) => {
        acc[period] = groupedEvents[period].filter(event => 
          activeFilters.includes(event.type)
        );
        return acc;
      }, {})
    : groupedEvents;

  if (loading) {
    return <CinematicLoader text="Loading Work History..." zIndex={Z_INDEX.PANEL} />;
  }

  return (
    <div className="relative min-h-screen bg-[#0F1117] overflow-hidden">
      {/* Cinematic background layers */}
      <div className="absolute inset-0 -z-10">
        {/* Primary atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-cyan-900/5" />
        
        {/* Deep vignette for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/50" />
        
        {/* Subtle animated atmospheric layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/3 via-transparent to-purple-900/3 animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10"
      >
        {/* Header with cinematic navigation */}
        <div className="fixed top-0 left-0 right-0 z-20">
          <div className={`
            border-b border-white/10 backdrop-blur-xl
            ${CINEMATIC.BACKGROUND.SYSTEM}
          `}>
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              {/* Back button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={() => navigate('/workspace')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  ${CINEMATIC.STATES.INTERACTIVE_HOVER}
                  text-slate-300 hover:text-white
                  transition-all duration-200
                `}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Workspace</span>
              </motion.button>

              {/* Page title */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-center"
              >
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  Work History
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Your productivity journey through time
                </p>
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex items-center gap-3"
              >
                {/* View toggle */}
                <button
                  onClick={() => setIsCompact(!isCompact)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium
                    ${isCompact 
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' 
                      : `${CINEMATIC.STATES.INTERACTIVE_HOVER} text-slate-300`
                    }
                    transition-all duration-200
                  `}
                >
                  {isCompact ? 'Detailed' : 'Compact'}
                </button>

                {/* Event count */}
                <div className={`
                  px-3 py-2 rounded-lg text-sm
                  ${CINEMATIC.BACKGROUND.PANEL}
                  ${CINEMATIC.BORDER.PRIMARY}
                  border text-slate-400
                `}>
                  {totalEvents} events
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Filters */}
            <TimelineFilters
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              availableFilters={availableFilters}
            />

            {/* Timeline */}
            <TimelineContainer
              groupedEvents={filteredEvents}
              loading={loading}
              isCompact={isCompact}
              expandedEvents={expandedEvents}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
