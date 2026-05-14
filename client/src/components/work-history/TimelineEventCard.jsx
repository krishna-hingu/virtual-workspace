import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';
import { formatTimelineTime } from '../../utils/timelineProcessor';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

/**
 * TimelineEventCard - Individual memory fragment in the timeline
 * 
 * Represents a single event in the user's productivity journey
 * Designed to feel like a cinematic memory, not a data row
 */
export const TimelineEventCard = ({ 
  event, 
  isExpanded = false,
  onExpand,
  index,
  totalInGroup 
}) => {
  const { metadata, title, description, timestamp } = event;
  
  // Internal UI keys that should never be rendered in user-facing content
  const INTERNAL_UI_KEYS = [
    'icon', 
    'color', 
    'bgColor', 
    'borderColor', 
    'label',
    'activityId', 
    'notificationId', 
    'taskId', 
    'period',
    '_id',
    '__v',
    'user',
    'createdAt',
    'updatedAt',
    'type',
    'context',
    'intensity',
    'isActive',
    'coordinates',
    'metadata'
  ];

  /**
   * Semantic formatter for metadata values
   * Transforms raw telemetry into human-readable workspace intelligence
   */
  const formatMetadataValue = (key, value) => {
    if (!value) return null;

    // Handle specific semantic keys
    switch (key) {
      case 'completedAt':
        return `Completed on ${formatTimelineTime(value)}`;

      case 'timestamp':
        return `Recorded on ${formatTimelineTime(value)}`;

      case 'clockInTime':
        return `Started at ${formatTimelineTime(value)}`;

      case 'clockOutTime':
        return `Ended at ${formatTimelineTime(value)}`;

      case 'duration':
        return `Focused for ${value} minutes`;
      
      case 'status':
        const statusMap = {
          'todo': 'Task added to backlog',
          'in-progress': 'Started working on task',
          'done': 'Successfully completed task'
        };
        return statusMap[value] || `Status: ${value}`;

      case 'assignedTo':
        return typeof value === 'object' ? `Assigned to ${value.name}` : `Assigned to ${value}`;

      case 'createdBy':
        return typeof value === 'object' ? `Created by ${value.name}` : `Created by ${value}`;

      case 'totalMinutes':
        return `Session duration: ${value}m`;

      case 'interruptionCount':
        return value === 0 ? 'Zero interruptions' : `${value} interruptions detected`;

      default:
        // Handle object safety to prevent [object Object]
        if (typeof value === 'object') {
          return value.name || value.title || value.label || null;
        }
        return String(value);
    }
  };
  
  // Calculate position for staggered animation
  const animationDelay = index * 0.1;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: animationDelay,
        ease: [0.23, 1, 0.32, 1]
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)'
      }}
      className={`
        relative group cursor-pointer
        ${CINEMATIC.PRESETS.TOOLTIP}
        ${metadata?.bgColor || 'bg-white/5'}
        ${metadata?.borderColor || 'border-white/10'}
        border rounded-xl p-4
        transition-all duration-300 ease-out
        hover:border-white/20
        backdrop-blur-sm
      `}
      onClick={onExpand}
    >
      {/* Timeline connector dot */}
      <div className="absolute -left-6 top-6 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-800 group-hover:border-violet-400 transition-colors duration-300" />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Event icon and type */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          flex items-center justify-center w-8 h-8 rounded-lg
          ${metadata?.bgColor || 'bg-white/10'}
          ${metadata?.color || 'text-slate-400'}
          text-sm font-medium
          flex-shrink-0
        `}>
          {metadata?.icon || '📝'}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Event title */}
          <h4 className="text-white font-medium text-sm leading-tight mb-1 truncate">
            {title}
          </h4>
          
          {/* Event type label */}
          <div className={`
            text-xs font-medium uppercase tracking-wider
            ${metadata?.color || 'text-slate-500'}
          `}>
            {metadata?.label || 'Activity'}
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-slate-500 font-medium whitespace-nowrap ml-2">
          {formatTimelineTime(timestamp)}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-3 line-clamp-2">
        {description}
      </p>
      
      {/* Metadata details - shown on expand or hover */}
      {(isExpanded || event.metadata) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isExpanded ? 1 : 0, 
            height: isExpanded ? 'auto' : 0 
          }}
          className="overflow-hidden"
        >
          <div className={`pt-3 border-t ${metadata?.borderColor || 'border-white/10'}`}>
            {event.metadata && Object.entries(event.metadata).map(([key, value]) => {
              // Skip internal fields and UI configuration keys
              if (INTERNAL_UI_KEYS.includes(key)) return null;
              
              const formattedValue = formatMetadataValue(key, value);
              if (!formattedValue) return null;
              
              return (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-xs text-slate-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {formattedValue}
                  </span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </motion.div>
      )}
      
      {/* Expand indicator */}
      {event.metadata && Object.keys(event.metadata).some(key => 
        !INTERNAL_UI_KEYS.includes(key) && event.metadata[key]
      ) && (
        <div className="flex items-center justify-center mt-2">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500 text-xs"
          >
            ▼
          </motion.div>
        </div>
      )}
      
      {/* Subtle connection line to next event */}
      {index < totalInGroup - 1 && (
        <div className="absolute left-4 top-full w-px h-4 bg-gradient-to-b from-slate-600 to-transparent" />
      )}
    </motion.div>
  );
};

/**
 * Minimal timeline event card for dense views
 */
export const CompactTimelineEventCard = ({ event, index }) => {
  const { metadata, title, timestamp } = event;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05
      }}
      className={`
        flex items-center gap-3 p-2 rounded-lg
        ${metadata?.bgColor || 'bg-white/5'}
        ${metadata?.borderColor || 'border-white/10'}
        border transition-all duration-200
        hover:bg-white/10 hover:border-white/20
      `}
    >
      {/* Icon */}
      <div className={`
        flex items-center justify-center w-6 h-6 rounded-md
        ${metadata?.bgColor || 'bg-white/10'}
        ${metadata?.color || 'text-slate-400'}
        text-xs font-medium
        flex-shrink-0
      `}>
        {metadata?.icon || '📝'}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">
          {title}
        </div>
        <div className="text-slate-500 text-xs">
          {formatTimelineTime(timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineEventCard;
