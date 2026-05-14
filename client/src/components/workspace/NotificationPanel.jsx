import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { Z_INDEX } from '../../constants/zIndex';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const NotificationPanel = () => {
  // Phase 5: Use shallow selectors to prevent unnecessary rerenders
  const notifications = useUIStore((state) => state.notifications);
  const activePanel = useUIStore((state) => state.activePanel);
  const markAsRead = useUIStore((state) => state.markAsRead);
  const markAllAsRead = useUIStore((state) => state.markAllAsRead);
  const clearNotifications = useUIStore((state) => state.clearNotifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  const isOpen = activePanel === 'notifications';
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_created':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'task_assigned':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'task_updated':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'task_completed':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'user_joined':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'user_left':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case 'chat_message':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'session_complete':
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_created': return 'text-green-400';
      case 'task_assigned': return 'text-blue-400';
      case 'task_updated': return 'text-yellow-400';
      case 'task_completed': return 'text-emerald-400';
      case 'user_joined': return 'text-violet-400';
      case 'user_left': return 'text-orange-400';
      case 'chat_message': return 'text-cyan-400';
      case 'session_complete': return 'text-purple-400';
      default: return 'text-slate-300';
    }
  };

  const getDotColor = (type) => {
    switch (type) {
      case 'task_created': return 'bg-green-500';
      case 'task_assigned': return 'bg-blue-500';
      case 'task_updated': return 'bg-yellow-500';
      case 'task_completed': return 'bg-emerald-500';
      case 'user_joined': return 'bg-violet-500';
      case 'user_left': return 'bg-orange-500';
      case 'chat_message': return 'bg-cyan-500';
      case 'session_complete': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`absolute right-4 top-20 w-80 max-h-[calc(100vh-120px)] overflow-hidden ${CINEMATIC.PRESETS.NOTIFICATION_PANEL} ${CINEMATIC.STATES.PANEL_HOVER}`}
      style={{ zIndex: Z_INDEX.TOOLTIP }}
    >
      <div className={`flex items-center justify-between border-b ${CINEMATIC.DIVIDER.PRIMARY} p-4`}>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
              {unreadCount} NEW
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-slate-400 transition hover:text-white"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-2 scrollbar-hide max-h-[400px]">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.0 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">No notifications yet</p>
              <p className="text-xs text-slate-500">We'll notify you when something happens</p>
            </motion.div>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative mb-2 flex items-start gap-3 p-3 rounded-lg bg-white/5 ${CINEMATIC.BORDER.MICRO} transition-all cursor-pointer ${
                  notification.read ? 'opacity-60' : CINEMATIC.STATES.INTERACTIVE_HOVER
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`mt-1 flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${getDotColor(notification.type)}`} />
                <div className="flex-1 ml-4">
                  <p className={`text-sm text-white leading-tight`}>{notification.message}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(notification.createdAt || notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="absolute right-2 top-2 rounded-lg p-1 text-slate-600 transition hover:bg-white/10 hover:text-slate-400"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {notifications.length > 0 && (
        <div className={`border-t ${CINEMATIC.DIVIDER.PRIMARY} p-3`}>
          <button
            onClick={clearNotifications}
            className={`w-full rounded-xl bg-white/5 py-2 text-xs font-medium text-slate-300 transition ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
          >
            Clear all notifications
          </button>
        </div>
      )}
    </motion.div>
  );
};
