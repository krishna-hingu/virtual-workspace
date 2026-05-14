import { create } from "zustand";
import { authAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../socket/socket";

// Safe localStorage parsing
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Module-level fetch guard to prevent duplicate calls
let _isFetchingMe = false;
let _lastFetchTime = 0;
const FETCH_COOLDOWN = 5000; // 5 second cooldown between fetch attempts

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("token") || null,
  userId: localStorage.getItem("userId") || null,
  role: localStorage.getItem("role") || null,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      // Set all localStorage values
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Update store with all user data
      set({ 
        user, 
        token, 
        userId: user._id, 
        role: user.role 
      });
      
      // Connect socket after successful login
      connectSocket();
      
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Login failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ name, email, password, role }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(name, email, password, role);
      
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || "Registration failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isInitialized: true });
      return null;
    }

    // Guard: prevent duplicate fetchMe calls with cooldown
    const now = Date.now();
    if (_isFetchingMe) {
      console.log("fetchMe already in progress, skipping duplicate call");
      return null;
    }

    if (now - _lastFetchTime < FETCH_COOLDOWN) {
      console.log(`fetchMe cooldown active, skipping call (${Math.round((FETCH_COOLDOWN - (now - _lastFetchTime)) / 1000)}s remaining)`);
      return null;
    }

    _isFetchingMe = true;
    _lastFetchTime = now;
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.getMe();
      set({ user: response.data.user, token });

      // Connect socket after successful authentication
      connectSocket();

      return response.data.user;
    } catch (error) {
      // Only clear session if it's explicitly an auth error (401)
      if (error.response?.status === 401) {
        console.warn("Session expired or invalid token, clearing session.");
        localStorage.removeItem("token");
        set({ user: null, token: null, error: "Session expired" });
      } else {
        // For network errors or other issues, we keep the token but set error
        console.error("Failed to fetch user:", error);
        set({ error: "Connection error. Please check your internet." });
      }
      return null;
    } finally {
      set({ isLoading: false, isInitialized: true });
      _isFetchingMe = false;
    }
  },

  
  logout: () => {
    // Clear ALL localStorage data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    // Clear Zustand store
    set({
      user: null,
      token: null,
      userId: null,
      role: null
    });

    // Stop activity tracking
    if (window.activityTracker) {
      window.activityTracker.stop();
    }

    // Disconnect socket
    disconnectSocket();

    // Reset fetch guard to allow re-fetch on next login
    _isFetchingMe = false;
    _lastFetchTime = 0; // Reset cooldown on logout

    // Reset notification load guard to allow re-fetch on next login
    // Note: This is safe to call even if Workspace is not defined
    if (typeof Workspace !== 'undefined' && Workspace._notificationsLoaded !== undefined) {
      Workspace._notificationsLoaded = false;
    }

    console.log("Logout completed - all auth data cleared");
  },

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
