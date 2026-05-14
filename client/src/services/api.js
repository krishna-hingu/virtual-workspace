import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We let the auth store handle 401s to avoid race conditions
    // and provide a better UX (e.g. showing a "session expired" message)
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (name, email, password, role) =>
    api.post("/api/auth/register", { name, email, password, role }),
  getMe: () => api.get("/api/auth/me"),
};

export const taskAPI = {
  getTasks: () => api.get("/api/tasks"),
  createTask: (task) => {
    console.log("STEP 3: API REQUEST SENT", task);
    return api.post("/api/tasks", task)
      .then(response => {
        console.log("STEP 4: API RESPONSE SUCCESS", response.data);
        return response;
      })
      .catch(error => {
        console.log("STEP ERROR: API REQUEST FAILED", error.response?.data || error);
        throw error;
      });
  },
  updateTask: (id, task) => api.patch(`/api/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`),
};

export const sessionAPI = {
  clockIn: () => api.post("/api/sessions/clock-in"),
  clockOut: () => api.post("/api/sessions/clock-out"),
  getSessions: () => api.get("/api/sessions"),
  getActiveSession: () => api.get("/api/sessions/active"),
};

export const messageAPI = {
  sendMessage: (recipientId, content) =>
    api.post("/api/messages", { recipientId, content }),
  getMessages: (userId) => api.get(`/api/messages/${userId}`),
};

export const analyticsAPI = {
  getStats: () => api.get("/api/analytics/stats"),
  getHeatmap: () => api.get("/api/analytics/heatmap"),
  getWorkHistory: () => api.get("/api/analytics/history"),
  getWorkPressure: () => api.get("/api/analytics/pressure"),
  getInterruptionLogs: () => api.get("/api/analytics/interruption-logs"),
};

export const activityAPI = {
  getActivity: () => api.get("/api/activity"),
  getHeatmap: () => api.get("/api/activity/heatmap"),
  trackLogin: (sessionId) => api.post("/api/activity/login", { sessionId }),
  trackLogout: () => api.post("/api/activity/logout"),
  trackTaskCreate: (title, description) => api.post("/api/activity/task/create", { title, description }),
  trackTaskUpdate: (taskId, status, title) => api.post("/api/activity/task/update", { taskId, status, title }),
  trackTaskComplete: (taskId, title) => api.post("/api/activity/task/complete", { taskId, title }),
  trackMovement: (x, y, z, room) => api.post("/api/activity/movement", { x, y, z, room }),
  trackWorkspaceInteraction: (action, element, details) => api.post("/api/activity/workspace", { action, element, details }),
  trackFocusStart: () => api.post("/api/activity/focus/start"),
  trackFocusEnd: () => api.post("/api/activity/focus/end"),
  trackInterruption: (reason, duration) => api.post("/api/activity/interruption", { reason, duration }),
  trackIdleStart: () => api.post("/api/activity/idle/start"),
  trackIdleEnd: () => api.post("/api/activity/idle/end"),
  trackActivity: (data) => api.post("/api/activity", data), // Generic activity tracking
};

export const userAPI = {
  getUsers: () => api.get("/api/users"),
  getUserById: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
};

export const adminAPI = {
  getOverview: () => api.get("/api/admin/overview"),
  getUsers: () => api.get("/api/admin/users"),
  updateUserRole: (userId, role) => api.patch("/api/admin/users/role", { userId, role }),
  getAnalytics: () => api.get("/api/admin/analytics"),
  broadcast: (title, message, type) => api.post("/api/admin/broadcast", { title, message, type }),
};

export default api;
