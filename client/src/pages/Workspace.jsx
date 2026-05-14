import { useEffect } from 'react';
import WorkspaceScene from '../components/workspace/WorkspaceScene.jsx';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useSocketReady } from '../App';
import { LoadingSpinner } from '../components/shared/LoadingStates';
import { ToastContainer } from '../components/shared/Toast';
import { NotificationPanel } from '../components/workspace/NotificationPanel';
import { ChatPanel } from '../components/workspace/ChatPanel';
import { SettingsModal } from '../components/workspace/SettingsModal';
import TopBar from '../components/workspace/TopBar';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { ActivityPanel } from '../components/activity';
import { ClockWidget, PomodoroWidget } from '../components/productivity';
import { useUIStore } from '../store/uiStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import WorkspaceLoader from '../react/loading/WorkspaceLoader';
import socket from '../socket/socket';
import { Z_INDEX } from '../constants/zIndex';
import { CINEMATIC } from '../constants/cinematicAtmosphere';

import { API_URL } from '../services/api';

// Module-level guard to prevent duplicate notification fetches
let _isFetchingNotifications = false;
let _lastNotificationFetchTime = 0;
const NOTIFICATION_FETCH_COOLDOWN = 5000; // 5 second cooldown between notification fetch attempts

// Function to reset notification guard (called from authStore logout)
export const resetNotificationGuard = () => {
  _isFetchingNotifications = false;
  _lastNotificationFetchTime = 0;
  if (typeof Workspace !== 'undefined') {
    Workspace._notificationsLoaded = false;
  }
};

export function Workspace() {
  const { user, isInitialized: isAuthInitialized } = useAuth();
  const socketReady = useSocketReady();
  // Use shallow selectors to prevent rerender spam
  const activePanel = useUIStore((state) => state.activePanel);
  const setInitialized = useUIStore((state) => state.setInitialized);
  const workspaceLoaded = useWorkspaceStore((state) => state.workspaceLoaded);
  const setWorkspaceLoaded = useWorkspaceStore((state) => state.setWorkspaceLoaded);

  // Session restoration - SAFE ZONE after auth + socket
  const { restoreSession } = useSession(false); // Don't auto-restore, we'll trigger manually

  // Auth initialization - STABLE
  useEffect(() => {
    if (isAuthInitialized && user) {
      setInitialized(true);
    }
  }, [isAuthInitialized, user, setInitialized]);

  // Session restoration - TRIGGERED ONLY after auth + socket ready
  useEffect(() => {
    if (isAuthInitialized && user && socketReady) {
      // Restore any active session from backend
      // This happens AFTER auth is stable and socket is connected
      restoreSession();
    }
  }, [isAuthInitialized, user, socketReady, restoreSession]);

  // Phase 4: Load notifications from backend on mount
  useEffect(() => {
    if (!user) return;

    // Guard: prevent duplicate notification fetches with cooldown
    const now = Date.now();
    if (Workspace._notificationsLoaded || _isFetchingNotifications) {
      console.log("Notifications already loading or loaded, skipping duplicate fetch");
      return;
    }

    if (now - _lastNotificationFetchTime < NOTIFICATION_FETCH_COOLDOWN) {
      console.log(`Notification fetch cooldown active, skipping call (${Math.round((NOTIFICATION_FETCH_COOLDOWN - (now - _lastNotificationFetchTime)) / 1000)}s remaining)`);
      return;
    }

    const loadNotifications = async () => {
      try {
        _isFetchingNotifications = true;
        _lastNotificationFetchTime = now;
        Workspace._notificationsLoaded = true;
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const notifications = await response.json();
          // Populate uiStore with loaded notifications
          useUIStore.getState().setInitialized(true);
          notifications.forEach((notif) => {
            useUIStore.getState().addNotification({
              id: notif._id,
              type: notif.type,
              message: notif.message,
              timestamp: notif.createdAt,
              read: notif.read,
              data: notif.data,
              _skipPersist: true, // Prevent POST back to server
            });
          });
          console.log(`Loaded ${notifications.length} notifications from backend`);
        }
      } catch (error) {
        console.error('Failed to load notifications from backend:', error);
        // Reset guards on error to allow retry
        Workspace._notificationsLoaded = false;
        _isFetchingNotifications = false;
      } finally {
        _isFetchingNotifications = false;
      }
    };

    loadNotifications();
  }, [user]);

  // Workspace loader setup - STABLE
  useEffect(() => {
    window.setWorkspaceLoaded = setWorkspaceLoaded;
  }, [setWorkspaceLoaded]);

  // Realtime notification listeners - STABLE VERSION
  useEffect(() => {
    if (!socket || !socketReady) {
      console.log('Socket not ready, skipping listener setup');
      return;
    }

    console.log('REGISTERING notification:new LISTENER');
    console.log('SETTING UP REALTIME NOTIFICATION LISTENERS');

    /**
     * PHASE 2 NOTE: Socket handlers use useUIStore.getState() pattern.
     *
     * CURRENT PATTERN:
     * - Direct store access via getState() in socket event handlers
     * - Bypasses React subscription in these specific handlers
     * - Component subscribes to uiStore separately (line 24-27)
     * - Works because mutations trigger store updates which trigger component rerender
     *
     * FUTURE IMPROVEMENT (Phase 5+):
     * - Consider using useCallback + proper state subscriptions
     * - Or create a notificationService to abstract this pattern
     * - Current pattern is functional for socket handlers
     */
    const handleNewNotification = (notification) => {
      console.log('CLIENT RECEIVED notification:new:', notification);
      console.log('CLIENT ADDING NOTIFICATION TO STORE:', notification);
      // Add to notification panel
      useUIStore.getState().addNotification(notification);

      console.log('CLIENT TRIGGERING TOAST:', notification.message);
      // Show toast notification
      useUIStore.getState().addToast(notification.message, 'info', 4000);
    };

    const handleUserJoined = (data) => {
      console.log('USER JOINED:', data);
      // Phase 5 fix: user:joined should only update user state, not create notification
      // Notifications should come via notification:new event only to prevent duplicates
      const message = `${data.user?.name || 'Someone'} joined workspace`;
      useUIStore.getState().addToast(message, 'info', 3000);
    };

    const handleUserLeft = (data) => {
      console.log('USER LEFT:', data);
      // Phase 5 fix: user:left should only update user state, not create notification
      // Notifications should come via notification:new event only to prevent duplicates
      const message = `${data.user?.name || 'Someone'} left workspace`;
      useUIStore.getState().addToast(message, 'warning', 3000);
    };

    const handleRemoteToast = (data) => {
      console.log('REMOTE TOAST RECEIVED:', data);
      useUIStore.getState().addToast(data.message, data.type || 'info', data.duration || 3000);
    };

    const handleAISuggestion = (data) => {
      console.log('AI SUGGESTION RECEIVED:', data);
      if (!data || !data.message) {
        console.log('AI SUGGESTION INVALID PAYLOAD:', data);
        return;
      }
      const toastType = data.type === 'high_pressure' ? 'warning' : 'info';
      useUIStore.getState().addToast(data.message, toastType, 5000);
    };

    // Register listeners
    socket.on('notification:new', handleNewNotification);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('toast:new', handleRemoteToast);
    socket.on('ai:suggestion', handleAISuggestion);

    console.log('REALTIME NOTIFICATION LISTENERS REGISTERED');

    return () => {
      // Cleanup listeners
      socket.off('notification:new', handleNewNotification);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('toast:new', handleRemoteToast);
      socket.off('ai:suggestion', handleAISuggestion);
      console.log('REALTIME NOTIFICATION LISTENERS CLEANED UP');
    };
  }, [socketReady]); // Depend on socketReady, not empty array

  // Block rendering until socket is connected
  if (!socketReady) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${CINEMATIC.PRESETS.SYSTEM_OVERLAY}`}>
        {/* Environmental atmospheric layers */}
        <div className="absolute inset-0">
          {/* Cinematic radial glow background */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-cyan-900/10 animate-pulse" style={{ animationDuration: '8s' }} />
          
          {/* Deep vignette for cinematic depth */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/60" />
          
          {/* Subtle atmospheric diffusion */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-transparent to-purple-900/5" />
        </div>

        <div className="relative flex flex-col items-center gap-5">
          {/* Enhanced logo with atmospheric presence */}
          <div className={`relative w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 ${CINEMATIC.SHADOW.GLOW} shadow-2xl shadow-black/40`}>
            {/* Subtle ambient glow ring */}
            <div className="absolute -inset-2 rounded-xl bg-gradient-radial from-purple-400/20 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
          </div>
          
          {/* Enhanced loading typography */}
          <div className="text-white/80 text-sm font-medium tracking-wide">
            Connecting Environment...
          </div>
        </div>
      </div>
    );
  }

  // Always render workspace - loader overlays only when not ready
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <TopBar />
      <WorkspaceScene />
        {activePanel === 'chat' && <ChatPanel />}
        {activePanel === 'notifications' && <NotificationPanel />}
        {activePanel === 'settings' && <SettingsModal />}
        {/* {activePanel === 'activity' && <ActivityPanel />} */}
        {activePanel === 'rooms' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ zIndex: Z_INDEX.PANEL }}>
            <div className="rounded-2xl border border-white/10 bg-[#161B25]/90 p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-white mb-4">Rooms</h2>
              <p className="text-slate-400">Rooms panel coming soon...</p>
            </div>
          </div>
        )}
        <ToastContainer />
        {activePanel === "tasks" && <TaskBoard />}
        <CreateTaskModal />

        {/* Productivity Widgets */}
        <ClockWidget />
        <PomodoroWidget />

        {/* Cinematic loader overlay - only for workspace route */}
        {!workspaceLoaded && <WorkspaceLoader />}
      </div>
    );
}

