import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';
import { Z_INDEX } from '../../constants/zIndex';
import { TRANSITION } from '../../constants/transitions';
import socket from '../../socket/socket';
import { activityAPI } from '../../services/api';
import { Tooltip } from '../shared/Tooltip';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

const iconButtonClasses =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-100 transition-all duration-200 hover:scale-105 hover:border-white/20 hover:bg-white/10 relative';

function TopBar() {
  const navigate = useNavigate();
  const [overflowOpen, setOverflowOpen] = useState(false);

  // Phase 5: Use shallow selectors to prevent unnecessary rerenders
  const notifications = useUIStore((state) => state.notifications);
  const activePanel = useUIStore((state) => state.activePanel);
  const setActivePanel = useUIStore((state) => state.setActivePanel);
  const markAllAsRead = useUIStore((state) => state.markAllAsRead);
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const { logout, user: authUser } = useAuthStore();
  const role = authUser?.role || localStorage.getItem('role');

  const users = useWorkspaceStore((state) => state.users);
  const isInFocusMode = useWorkspaceStore((state) => state.isInFocusMode);
  const setFocusMode = useWorkspaceStore((state) => state.setFocusMode);

  const handleAnalyticsClick = () => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/analytics');
    }
  };

  const handleNotificationClick = () => {
    const newPanel = activePanel === "notifications" ? null : "notifications";
    setActivePanel(newPanel);
    if (newPanel === "notifications") {
      markAllAsRead();
    }
  };

  const handleChatClick = () => {
    setActivePanel(activePanel === "chat" ? null : "chat");
  };

  const handleWorkspaceClick = () => {
    setActiveModal('workspace-list');
  };

  const handleSettingsClick = () => {
    setActivePanel(activePanel === "settings" ? null : "settings");
    setOverflowOpen(false);
  };

  const handleTasksClick = () => {
    setActivePanel(activePanel === "tasks" ? null : "tasks");
  };

  
  const handleActivityClick = () => {
    setActivePanel(activePanel === "activity" ? null : "activity");
  };

  
  const unreadCount = notifications.filter(n => !n.read).length;
  const usersCount = users.length || 0;

  const handleLogout = () => {
    console.log("Logout button clicked");
    logout();
    setOverflowOpen(false);
  };

  // Focus mode toggle handler
  const handleFocusToggle = async () => {
    const newFocusMode = !isInFocusMode;
    
    // Update local state immediately for responsive UI
    setFocusMode(newFocusMode);
    
    // Emit socket event to backend
    socket.emit('focus:toggle', { focusMode: newFocusMode });
    
    // Track activity in ActivityLog
    try {
      if (newFocusMode) {
        await activityAPI.trackFocusStart();
      } else {
        await activityAPI.trackFocusEnd();
      }
    } catch (error) {
      console.error('Error tracking focus activity:', error);
    }
  };

  // Socket listeners for focus mode synchronization
  useEffect(() => {
    const handleFocusConfirmed = (data) => {
      setFocusMode(data.focusMode);
    };

    const handleFocusUpdated = (data) => {
      // Only update if it's not the current user (optional remote sync)
      // For now, we only sync local user state via focus:confirmed
      // Remote user focus sync can be added later if needed
    };

    socket.on('focus:confirmed', handleFocusConfirmed);
    socket.on('focus:updated', handleFocusUpdated);

    return () => {
      socket.off('focus:confirmed', handleFocusConfirmed);
      socket.off('focus:updated', handleFocusUpdated);
    };
  }, [setFocusMode]);


  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 w-auto max-w-[95vw] px-2" style={{ zIndex: Z_INDEX.PANEL }}>
      <div className="flex h-auto min-h-[48px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#161B27]/80 px-4 py-2 backdrop-blur-md text-slate-100 shadow-xl">
        <div className="flex items-center gap-3"> 
          <div className="flex items-center gap-2 shrink-0"> 
            <img 
              src="/assets/logo.png" 
              alt="Workspace Logo" 
              className="h-7 w-auto object-contain" 
            /> 
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium whitespace-nowrap">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="opacity-80 whitespace-nowrap">Workspace A • {usersCount} active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/10">
            <motion.button
              type="button"
              onClick={handleChatClick}
              className={`${iconButtonClasses} ${activePanel === "chat" ? "bg-primary/20 border-primary/30" : ""}`}
              whileHover={{ scale: 1.05 }}
              aria-label="Chat"
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 14H5.17L4 17.17V4h16v12Z" />
              </svg>
            </motion.button>

            <motion.button
              type="button"
              onClick={handleNotificationClick}
              className={`${iconButtonClasses} ${activePanel === "notifications" ? "bg-primary/20 border-primary/30" : ""}`}
              whileHover={{ scale: 1.05 }}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7v4.586l-.707.707A1 1 0 0 0 5 16h14a1 1 0 0 0 .707-1.707L19 13.586V9a7 7 0 0 0-7-7Zm0 20a3.001 3.001 0 0 0 2.816-2H9.184A3.001 3.001 0 0 0 12 22Z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={handleTasksClick}
              className={`${iconButtonClasses} ${activePanel === "tasks" ? "bg-primary/20 border-primary/30" : ""}`}
              whileHover={{ scale: 1.05 }}
              aria-label="Tasks"
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </motion.button>

            {/* Analytics Button */}
            <Tooltip text={role === 'admin' ? "Operations Center" : "Analytics"}>
              <motion.button
                type="button"
                onClick={handleAnalyticsClick}
                className={iconButtonClasses}
                whileHover={{ scale: 1.05 }}
                aria-label={role === 'admin' ? "Operations Center" : "Analytics"}
              >
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </motion.button>
            </Tooltip>

            {/* Focus Mode Toggle Button */}
            <Tooltip text={isInFocusMode ? "Focus Mode ON" : "Focus Mode OFF"}>
              <motion.button
                type="button"
                onClick={handleFocusToggle}
                className={`${iconButtonClasses} ${isInFocusMode ? "bg-primary/20 border-primary/30 shadow-lg shadow-primary/20" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Focus Mode"
              >
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                </svg>
                {isInFocusMode && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary shadow-sm animate-pulse" />
                )}
              </motion.button>
            </Tooltip>

            {/* Overflow Menu Button */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setOverflowOpen(!overflowOpen)}
                className={`${iconButtonClasses} ${overflowOpen ? "bg-white/10 border-white/20" : ""}`}
                whileHover={{ scale: 1.05 }}
                aria-label="More options"
              >
                <svg viewBox="0 0 24 24" className="h-[16px] w-[16px] fill-current" aria-hidden="true">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {overflowOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: TRANSITION.FAST }}
                    className={`absolute right-0 top-full mt-2 w-48 ${CINEMATIC.PRESETS.TOOLTIP}`}
                    style={{ zIndex: Z_INDEX.DROPDOWN }}
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={handleSettingsClick}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-100 transition-all ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-slate-400" aria-hidden="true">
                          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm10 4a8.11 8.11 0 0 0-.12-1.16l1.92-1.5a1 1 0 0 0 .2-1.34l-1.82-2.97a1 1 0 0 0-1.98 1.15l-2.27-.9a8.2 8.2 0 0 0-1.98-1.15l-.34-2.4A1 1 0 0 0 10.5 22h3a1 1 0 0 0 .99-.84l.34-2.4a8.2 8.2 0 0 0 1.98-1.15l2.26.9a1 1 0 0 0 1.28.4l1.82 2.97a1 1 0 0 0 .2 1.34l-1.92 1.5c.08-.39.12-.77.12-1.16Z" />
                        </svg>
                        Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/work-history")}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-100 transition-all ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-slate-400" aria-hidden="true">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        Work History
                      </button>
                      <div className={`h-px ${CINEMATIC.DIVIDER.PRIMARY} my-1`} />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/10 ${CINEMATIC.STATES.INTERACTIVE_HOVER}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-red-400" aria-hidden="true">
                          <path d="M9 10h6v2h4v-2H9zm0 4h6v2h4v-2H9zm0 6h6v2h4v-2H9zm0 8h6v2h4v-2H9zm0 10h6v2h4v-2H9z" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap">
            <span id="zone-dot" className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
            <span id="zone-name" className="opacity-80">CORRIDOR</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
