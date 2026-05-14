import { create } from "zustand";

export const useWorkspaceStore = create((set, get) => ({
  users: [],
  currentUserPosition: { x: 0, y: 0 },
  nearbyUsers: [],
  messages: [],
  isInFocusMode: false,
  sessionActive: false,
  sessionTime: 0,
  sessionStartTime: null,
  tasks: [],
  activity: [],
  workspaceLoaded: false,

  // Users management
  setUsers: (users) => {
    return set({ users });
  },
  addUser: (user) =>
    set((state) => ({
      users: [...state.users.filter((u) => u.id !== user.id), user],
    })),
  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      nearbyUsers: state.nearbyUsers.filter((u) => u.id !== userId),
    })),

  // Tasks management
  addTask: (task) => {
    return set((state) => {
      const exists = state.tasks.some(t => t._id === task._id);
      if (exists) {
        return state; // No change if task already exists
      }
      return {
        tasks: [task, ...state.tasks],
      };
    });
  },
  updateTask: (task) => {
    console.log("TASK UPDATE RECEIVED:", task);
    console.log("CURRENT TASKS:", task);
    return set((state) => {
      const updatedTasks = state.tasks.map((t) => (t._id === task._id ? task : t));
      console.log("TASK STORE UPDATED");
      return { tasks: updatedTasks };
    });
  },
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id !== id),
    })),

  addActivity: (item) =>
    set((state) => ({
      activity: [item, ...state.activity].slice(0, 50),
    })),

  // Position management
  setCurrentUserPosition: (position) => set({ currentUserPosition: position }),
  updateUserPosition: (userId, position) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, position } : u)),
    })),

  // Nearby users
  setNearbyUsers: (users) => set({ nearbyUsers: users }),
  addNearbyUser: (user) =>
    set((state) => ({
      nearbyUsers: [...state.nearbyUsers.filter((u) => u.id !== user.id), user],
    })),
  removeNearbyUser: (userId) =>
    set((state) => ({
      nearbyUsers: state.nearbyUsers.filter((u) => u.id !== userId),
    })),

  // Messages
  addMessage: (message) =>
    set((state) => {
      // Create unique signature for deduplication
      const messageSignature = `${message.timestamp}_${message.senderId || message.userId}_${message.content || message.message}`;

      // Check if message already exists
      const exists = state.messages.some((msg) => {
        const existingSignature = `${msg.timestamp}_${msg.senderId}_${msg.content}`;
        return existingSignature === messageSignature;
      });

      if (exists) {
        return state; // No change if message already exists
      }

      return {
        messages: [
          ...state.messages,
          {
            senderId: message.senderId || message.userId,
            senderName: message.senderName || message.name || "User",
            receiverId: message.receiverId,
            content: message.content || message.message,
            type: message.type || "nearby", // default to nearby
            timestamp: message.timestamp || Date.now(),
          },
        ],
      };
    }),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),

  // Focus mode
  toggleFocusMode: () =>
    set((state) => ({ isInFocusMode: !state.isInFocusMode })),
  setFocusMode: (value) => set({ isInFocusMode: value }),

  // Session
  startSession: (initialTime = 0) => set((state) => {
    // Only reset sessionTime if starting fresh session
    const newSessionTime = state.sessionActive ? state.sessionTime : initialTime;
    return { sessionActive: true, sessionTime: newSessionTime };
  }),
  endSession: () => set({ sessionActive: false, sessionStartTime: null }),
  setSessionStartTime: (startTime) => set({ sessionStartTime: startTime }),
  incrementSessionTime: () =>
    set((state) =>
      state.sessionActive ? { sessionTime: state.sessionTime + 1 } : {},
    ),

  // Workspace loading
  setWorkspaceLoaded: (loaded) => set({ workspaceLoaded: loaded }),
}));
