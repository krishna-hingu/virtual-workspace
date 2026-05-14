import { motion } from 'framer-motion';
import { TimelineEventCard, CompactTimelineEventCard } from './TimelineEventCard';
import { getPeriodLabel } from '../../utils/timelineProcessor';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

/**
 * TimelineSection - Time-grouped section of timeline events
 * 
 * Groups events by periods: TODAY, THIS WEEK, THIS MONTH, OLDER
 * Creates cinematic visual hierarchy with breathing room
 */
export const TimelineSection = ({ 
  period, 
  events, 
  isCompact = false,
  expandedEvents = new Set(),
  onToggleExpand 
}) => {
  if (!events || events.length === 0) return null;

  const periodLabel = getPeriodLabel(period);
  const eventCount = events.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-12 last:mb-0"
    >
      {/* Period Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-4 mb-6"
      >
        {/* Period Label */}
        <div className="relative">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {periodLabel}
          </h2>
          
          {/* Subtle glow behind text */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent blur-xl -z-10" />
        </div>
        
        {/* Event count */}
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${CINEMATIC.BACKGROUND.PANEL}
          ${CINEMATIC.BORDER.PRIMARY}
          border text-slate-400
        `}>
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </div>
      </motion.div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-slate-600/30 to-transparent" />
        
        {/* Events */}
        <div className="space-y-4">
          {events.map((event, index) => {
            const isExpanded = expandedEvents.has(event.id);
            
            if (isCompact) {
              return (
                <CompactTimelineEventCard
                  key={event.id}
                  event={event}
                  index={index}
                />
              );
            }
            
            return (
              <div key={event.id} className="relative pl-10">
                <TimelineEventCard
                  event={event}
                  isExpanded={isExpanded}
                  onExpand={() => onToggleExpand?.(event.id)}
                  index={index}
                  totalInGroup={events.length}
                />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * TimelineContainer - Main timeline wrapper with cinematic atmosphere
 */
export const TimelineContainer = ({ 
  groupedEvents, 
  loading = false,
  isCompact = false,
  expandedEvents = new Set(),
  onToggleExpand 
}) => {
  const periods = ['today', 'thisWeek', 'thisMonth', 'older'];
  const hasEvents = periods.some(period => groupedEvents[period]?.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
        />
      </div>
    );
  }

  if (!hasEvents) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        {/* Empty state icon */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-4
          ${CINEMATIC.BACKGROUND.EMPTY}
          ${CINEMATIC.BORDER.MICRO}
          border
        `}>
          <span className="text-2xl opacity-60">📅</span>
        </div>
        
        {/* Empty state text */}
        <h3 className="text-xl font-semibold text-white mb-2">
          No work history yet
        </h3>
        <p className="text-slate-400 max-w-md">
          Your productivity journey will appear here as you complete tasks, 
          start focus sessions, and interact with the workspace.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      {/* Cinematic background layers */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/5 via-transparent to-cyan-900/5" />
        
        {/* Atmospheric depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* Timeline sections */}
      <div className="relative z-10">
        {periods.map((period, index) => (
          groupedEvents[period] && groupedEvents[period].length > 0 && (
            <TimelineSection
              key={period}
              period={period}
              events={groupedEvents[period]}
              isCompact={isCompact}
              expandedEvents={expandedEvents}
              onToggleExpand={onToggleExpand}
            />
          )
        ))}
      </div>
    </motion.div>
  );
};

/**
 * TimelineFilters - Filter controls for timeline events
 */
export const TimelineFilters = ({ 
  activeFilters, 
  onFilterChange, 
  availableFilters 
}) => {
  if (!availableFilters || availableFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        flex flex-wrap gap-2 p-4 rounded-xl mb-8
        ${CINEMATIC.BACKGROUND.PANEL}
        ${CINEMATIC.BORDER.PRIMARY}
        border
      `}
    >
      <span className="text-sm text-slate-400 font-medium self-center mr-2">
        Filter:
      </span>
      
      {availableFilters.map(filter => {
        const isActive = activeFilters.includes(filter.type);
        
        return (
          <button
            key={filter.type}
            onClick={() => onFilterChange?.(filter.type)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isActive 
                ? `${filter.bgColor} ${filter.color} border ${filter.borderColor}` 
                : `${CINEMATIC.BACKGROUND.EMPTY} ${CINEMATIC.BORDER.MICRO} border text-slate-400 hover:text-white`
              }
            `}
          >
            {filter.icon} {filter.label}
          </button>
        );
      })}
      
      {activeFilters.length > 0 && (
        <button
          onClick={() => onFilterChange?.('clear')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          Clear all
        </button>
      )}
    </motion.div>
  );
};

export default TimelineSection;
