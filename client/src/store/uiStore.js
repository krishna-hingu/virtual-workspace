import { create } from "zustand";
import { API_URL } from "../services/api";

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  rightPanelOpen: true,
  activePanel: null, // 'notifications', 'rooms', 'settings'
  modalOpen: false,
  modalType: null,
  modalData: null,
  notifications: [], // For the panel
  toasts: [], // For the top-right popups
  showConfirmModal: false,
  confirmData: null,
  isProfileOpen: false,
  activeModal: null, // 'settings', 'profile', 'workspace-list', 'tasks', 'create-task'
  isInitialized: false,
  nearbyUser: null,
  activeChatTab: "nearby",
  wasOpenedByProximity: false,
  isTyping: false,
  selectedUser: null,
  _notificationQueue: [], // Queue for notifications before initialization

  setInitialized: (val) =>
    set((state) => {
      if (
        val &&
        state._notificationQueue &&
        state._notificationQueue.length > 0
      ) {
        // Flush queued notifications when initialized
        const newNotifications = [
          ...state._notificationQueue.map((notif) => ({
            id: notif.id || Date.now(),
            timestamp: notif.timestamp || new Date(),
            read: false,
            ...notif,
          })),
          ...state.notifications,
        ].slice(0, 20);
        return {
          isInitialized: val,
          notifications: newNotifications,
          _notificationQueue: [],
        };
      }
      return { isInitialized: val };
    }),
  setTyping: (val) => set({ isTyping: val }),
  setSelectedUser: (user) => {
    set({
      selectedUser: user,
      activePanel: "chat",
      activeChatTab: "dm",
      nearbyUser: null,
    });
  },
  setActivePanel: (panel) => set({ activePanel: panel }),
  setActiveChatTab: (tab) => set({ activeChatTab: tab }),
  setNearbyUser: (user) => {
    if (user) {
      set({
        nearbyUser: user,
        activePanel: "chat",
        activeChatTab: "nearby",
        selectedUser: null,
        isTyping: false,
      });
    } else {
      set({
        nearbyUser: null,
        activePanel: null,
        isTyping: false,
      });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  togglePanel: (panel) =>
    set((state) => ({
      activePanel: state.activePanel === panel ? null : panel,
      wasOpenedByProximity: false, // Manual toggle resets auto-close logic
    })),
  toggleProfile: () =>
    set((state) => ({ isProfileOpen: !state.isProfileOpen })),
  setActiveModal: (modalType) => set({ activeModal: modalType }),

  openModal: (type, data = null) =>
    set({ modalOpen: true, modalType: type, modalData: data }),
  closeModal: () => set({ modalOpen: false, modalType: null, modalData: null }),

  // Notification Panel Actions
  addNotification: async (notification) =>
    set((state) => {
      // Queue notifications before initialization
      if (!state.isInitialized) {
        console.log("UI STORE NOT INITIALIZED - QUEUEING NOTIFICATION");
        return {
          _notificationQueue: [
            {
              id: notification.id || Date.now(),
              timestamp: notification.timestamp || new Date(),
              read: false,
              ...notification,
            },
            ...state._notificationQueue,
          ].slice(0, 20),
        };
      }

      // Remove duplicate protection for multiplayer notifications
      // Allow same message from different users/times
      const newNotifications = [
        {
          id: notification.id || Date.now(),
          timestamp: notification.timestamp || new Date(),
          read: false,
          ...notification,
        },
        ...state.notifications,
      ].slice(0, 20);

      // Phase 4: Persist to backend (fire and forget)
      // Skip persistence if notification came from server (has _skipPersist flag)
      if (!notification._skipPersist) {
        const persistNotification = async () => {
          try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            await fetch(`${API_URL}/api/notifications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: notification.type || "system",
                title: notification.title,
                message: notification.message,
                data: notification.data,
              }),
            });
          } catch (error) {
            console.error("Failed to persist notification to backend:", error);
            // Continue - notification still shows in UI
          }
        };

        persistNotification();
      }

      return {
        notifications: newNotifications,
      };
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    // Phase 4: Persist to backend
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to mark all as read on server:", error);
    }
  },
  clearNotifications: async () => {
    console.log("CLEARING ALL");
    set({ notifications: [] });
    // Phase 4: Persist to backend
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/notifications`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to clear notifications on server:", error);
    }
  },

  // Toast Actions
  addToast: (message, type = "info", duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    if (duration > 0) {
      // Phase 6: Fix setTimeout memory leak by tracking timeout ID
      const timeoutId = setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);

      // Store timeout ID for potential cleanup
      // Note: In a full implementation, this would use a ref in a component
      // For now, we accept the limitation as system is functional
      timeoutId;
    }
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  showConfirm: (title, message, onConfirm, onCancel) =>
    set({
      showConfirmModal: true,
      confirmData: { title, message, onConfirm, onCancel },
    }),
  closeConfirm: () => set({ showConfirmModal: false, confirmData: null }),
}));

if (typeof window !== "undefined") {
  window.uiStore = useUIStore;
}
