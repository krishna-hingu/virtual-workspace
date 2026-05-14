/**
 * TIMELINE PROCESSOR
 *
 * Transforms existing workspace data into cinematic memory timeline
 * Pure frontend transformation - no backend changes required
 *
 * Processes: workspaceStore.tasks, activityAPI data, uiStore.notifications
 * Output: Chronological timeline events grouped by time periods
 */

import { useMemo } from "react";

/**
 * Event type definitions for timeline classification
 */
const EVENT_TYPES = {
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_COMPLETED: "task_completed",
  TASK_DELETED: "task_deleted",
  FOCUS_START: "focus_start",
  FOCUS_END: "focus_end",
  SESSION_START: "session_start",
  SESSION_COMPLETE: "session_complete",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  CHAT_MESSAGE: "chat_message",
  INTERRUPTION: "interruption",
};

/**
 * Event metadata for cinematic display
 */
const EVENT_METADATA = {
  [EVENT_TYPES.TASK_CREATED]: {
    icon: "✨",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    label: "Task Created",
  },
  [EVENT_TYPES.TASK_UPDATED]: {
    icon: "📝",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Task Updated",
  },
  [EVENT_TYPES.TASK_COMPLETED]: {
    icon: "✅",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    label: "Task Completed",
  },
  [EVENT_TYPES.TASK_DELETED]: {
    icon: "🗑️",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "Task Deleted",
  },
  [EVENT_TYPES.FOCUS_START]: {
    icon: "🎯",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    label: "Focus Session",
  },
  [EVENT_TYPES.FOCUS_END]: {
    icon: "🏁",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    label: "Focus Complete",
  },
  [EVENT_TYPES.SESSION_START]: {
    icon: "🚀",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    label: "Session Started",
  },
  [EVENT_TYPES.SESSION_COMPLETE]: {
    icon: "⏱️",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    label: "Session Complete",
  },
  [EVENT_TYPES.USER_JOINED]: {
    icon: "👋",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    label: "User Joined",
  },
  [EVENT_TYPES.USER_LEFT]: {
    icon: "👋",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    label: "User Left",
  },
  [EVENT_TYPES.CHAT_MESSAGE]: {
    icon: "💬",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    label: "Chat Message",
  },
  [EVENT_TYPES.INTERRUPTION]: {
    icon: "⚠️",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    label: "Interruption",
  },
};

/**
 * Transform task data into timeline events
 */
const processTaskEvents = (tasks) => {
  return tasks
    .map((task) => {
      const events = [];

      // Task creation event
      if (task.createdAt) {
        events.push({
          id: `task-created-${task._id}`,
          type: EVENT_TYPES.TASK_CREATED,
          timestamp: new Date(task.createdAt),
          title: task.title,
          description: `Created task: ${task.title}`,
          metadata: {
            taskId: task._id,
            status: task.status,
            assignedTo: task.assignedTo?.name,
            createdBy: task.createdBy?.name,
          },
        });
      }

      // Task completion event
      if (task.updatedAt && task.status === "done") {
        events.push({
          id: `task-completed-${task._id}`,
          type: EVENT_TYPES.TASK_COMPLETED,
          timestamp: new Date(task.updatedAt),
          title: task.title,
          description: `Completed: ${task.title}`,
          metadata: {
            taskId: task._id,
            status: task.status,
            completedAt: task.updatedAt,
          },
        });
      }

      return events;
    })
    .flat();
};

/**
 * Transform activity data into timeline events
 */
const processActivityEvents = (activity) => {
  return activity
    .filter((item) => EVENT_METADATA[item.type]) // Only show curated events (whitelist)
    .map((item) => {
      const eventType = item.type;

      return {
        id: `activity-${item._id || Math.random()}`,
        type: eventType,
        timestamp: new Date(item.createdAt || item.timestamp),
        title: item.title || item.description || "Activity",
        description: item.description || item.message || "Activity recorded",
        metadata: {
          ...item,
          activityId: item._id,
        },
      };
    });
};

/**
 * Transform notification data into timeline events
 */
const processNotificationEvents = (notifications) => {
  return notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    type: notification.type || EVENT_TYPES.TASK_UPDATED,
    timestamp: new Date(notification.createdAt || notification.timestamp),
    title: "Notification",
    description: notification.message,
    metadata: {
      notificationId: notification.id,
      read: notification.read,
      type: notification.type,
    },
  }));
};

/**
 * Group events by time periods
 */
const groupEventsByTime = (events) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups = {
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);

    if (eventDate >= today) {
      groups.today.push(event);
    } else if (eventDate >= thisWeek) {
      groups.thisWeek.push(event);
    } else if (eventDate >= thisMonth) {
      groups.thisMonth.push(event);
    } else {
      groups.older.push(event);
    }
  });

  // Sort each group by timestamp (newest first)
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });

  return groups;
};

/**
 * Main timeline processor hook
 * Transforms raw data into grouped timeline events
 */
export const useTimelineProcessor = (tasks, activity, notifications) => {
  return useMemo(() => {
    try {
      // Process all data sources
      const taskEvents = processTaskEvents(tasks || []);
      const activityEvents = processActivityEvents(activity || []);
      const notificationEvents = processNotificationEvents(notifications || []);

      // Combine all events
      const allEvents = [
        ...taskEvents,
        ...activityEvents,
        ...notificationEvents,
      ];

      // Filter out events without valid timestamps
      const validEvents = allEvents.filter(
        (event) => event.timestamp && !isNaN(event.timestamp.getTime()),
      );

      // Group by time periods
      const groupedEvents = groupEventsByTime(validEvents);

      // Add metadata to each event
      Object.keys(groupedEvents).forEach((period) => {
        groupedEvents[period] = groupedEvents[period].map((event) => ({
          ...event,
          metadata: {
            ...(event.metadata || {}),
            ...(EVENT_METADATA[event.type] || EVENT_METADATA.TASK_UPDATED),
          },
          period,
        }));
      });

      return {
        events: groupedEvents,
        totalEvents: validEvents.length,
        hasEvents: validEvents.length > 0,
      };
    } catch (error) {
      console.error("Timeline processor error:", error);
      return {
        events: { today: [], thisWeek: [], thisMonth: [], older: [] },
        totalEvents: 0,
        hasEvents: false,
      };
    }
  }, [tasks, activity, notifications]);
};

/**
 * Format timestamp for display
 */
export const formatTimelineTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Today logic
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 12 && isToday) return `${diffHours}h ago`;

  if (isToday) {
    return `Today at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  if (isYesterday) {
    return `Yesterday • ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) +
    ` • ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
  );
};

/**
 * Get period label for display
 */
export const getPeriodLabel = (period) => {
  const labels = {
    today: "TODAY",
    thisWeek: "THIS WEEK",
    thisMonth: "THIS MONTH",
    older: "OLDER",
  };
  return labels[period] || period;
};

export default useTimelineProcessor;
